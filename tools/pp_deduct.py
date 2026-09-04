"""PantryPulse deduction engine — resolves SKUs via the 'SKU Knowledge' sheet.
Usage:
    from pp_deduct import sys as _s; _s.path.insert(0,'/mnt/user-data/outputs')
from pp_changelog import log as _changelog
import Deductor
    d = Deductor('/mnt/user-data/outputs/PantryPulse-MASTER_2026-08-17_EOD.xlsx')
    d.deduct('Soozy & Munz','h2','2026-08-23','L bang bang chicken',
             [('chicken breast',350,'g','L 2pax'),('rice',200,'g','L')])
    d.save()
Every deduction: resolves via knowledge (exact canon -> alias -> guarded substring),
never touches DO-NOT-USE rows, never deducts zero stock (flags instead),
unit-aware (won't subtract grams from a pc row), floors at 0,
stamps LastChecked, appends a Deductions-ledger row with before/after.
"""
from openpyxl import load_workbook
import re

def _canon(s):
    s = str(s).lower()
    s = re.sub(r'\([^)]*\)', ' ', s)
    s = re.sub(r'[^a-z0-9 ]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

class Deductor:
    def __init__(self, path):
        self.path = path
        self.wb = load_workbook(path)
        self.k = {}   # sheet -> list of dicts
        ks = self.wb['SKU Knowledge']
        for row in ks.iter_rows(min_row=2, values_only=True):
            sheet, _, r, sku, cat, unit, ck, aliases, guards, note = row[:10]
            self.k.setdefault(sheet, []).append({
                'row': int(r), 'sku': str(sku), 'cat': str(cat or ''),
                'unit': str(unit or ''), 'ck': str(ck or ''),
                'al': set((aliases or '').split('|')) - {''},
                'gd': set((guards or '').split('|')) - {''},
                'dead': 'DO NOT USE' in str(note or ''),
            })
        self.log = []

    CLASSW = ['powder','masala','oil','sauce','paste','pickle','chutney',
              'flour','syrup','ketchup','achaar','seeds']
    SOFT = {'powder','masala','flour'}

    @staticmethod
    def _classes(s):
        return [c for c in Deductor.CLASSW if c in s]

    @staticmethod
    def _forms(t):
        out = [t]
        if t.endswith('s'): out.append(t[:-1])
        else: out.append(t + 's')
        if t.endswith('ies'): out.append(t[:-3] + 'y')
        return [x for x in dict.fromkeys(out) if x]

    def _resolve(self, sheet, term):
        """Mirror of the app's ppSkuCandidates: exact canon > alias > guarded substring.
        A base ingredient never resolves to its oil/sauce/paste form; powder and masala
        are forgiven only when the term is the head of the SKU name."""
        exact, alias, sub, seen = [], [], [], set()
        for t in self._forms(_canon(term)):
            tn = t.replace(' ', '')
            tcls = self._classes(t)
            for e in self.k.get(sheet, []):
                if e['dead'] or e['sku'] in seen:
                    continue
                if any(g and g in t for g in e['gd']):
                    continue
                ecls = self._classes(e['ck'])
                if set(ecls) != set(tcls):
                    hard_extra = any(c not in tcls and c not in self.SOFT for c in ecls)
                    head_ok = (not hard_extra) and (
                        e['ck'].split(' ')[0] == t or e['ck'].split('/')[0].strip() == t)
                    if e['ck'] != t and not head_ok:
                        continue
                if e['ck'] == t or e['ck'].replace(' ', '') == tn:
                    exact.append(e); seen.add(e['sku']); continue
                if t in e['al'] or tn in {a.replace(' ', '') for a in e['al']}:
                    alias.append(e); seen.add(e['sku']); continue
                last = e['ck'].split(' ')[-1] if e['ck'] else ''
                if len(t) >= 3 and (t in e['ck'] or e['ck'] in t or last == t):
                    sub.append(e); seen.add(e['sku'])
        return exact + alias + sub

    def gd_for(self, term, e):
        return e['gd']

    # unit families we can convert between; anything else is a hard mismatch
    CONV = {('kg','g'):1000.0, ('g','kg'):0.001, ('l','ml'):1000.0, ('ml','l'):0.001}

    def _to_row_unit(self, need, unit, row_unit):
        """Return (qty_in_row_unit, note) or (None, reason) if not convertible."""
        u, ru = (unit or '').lower().strip(), (row_unit or '').lower().strip()
        if not ru or u == ru:
            return need, ''
        if (u, ru) in self.CONV:
            return round(need * self.CONV[(u, ru)], 3), f'converted {need}{u} -> {ru}'
        return None, f'unit mismatch: asked {u}, row is {ru}'

    def _already_deducted(self, sheet, date, dish, sku):
        """A (household, date, dish, SKU) combination must appear ONCE in the ledger.
        On 3-Sep-2026 a deduction script ran twice and produced 53 double deductions
        across all 8 households; this guard makes that impossible."""
        ds = self.wb['Deductions']
        for r in range(2, ds.max_row + 1):
            if (str(ds.cell(r, 1).value or '') == sheet
                    and str(ds.cell(r, 3).value or '')[:10] == str(date)[:10]
                    and str(ds.cell(r, 4).value or '') == dish
                    and str(ds.cell(r, 5).value or '') == sku):
                q = ds.cell(r, 6).value
                if isinstance(q, (int, float)) and q > 0:
                    return q
        return None

    def deduct(self, sheet, hid, date, dish, items, allow_zero_flag=True):
        """items: (term, qty, unit, why). Plan-stated grams override estimates.
        Never guesses across incompatible units, records SHORT, never goes negative."""
        w = self.wb[sheet]
        ds = self.wb['Deductions']
        report = []
        for term, need, unit, why in items:
            cands = self._resolve(sheet, term)
            hit = None
            skipped = []
            for e in cands:
                r = e['row']
                q = w.cell(r, 3).value
                ru = str(w.cell(r, 4).value or '')
                if not isinstance(q, (int, float)) or q <= 0:
                    continue
                conv, note = self._to_row_unit(need, unit, ru)
                if conv is None:
                    skipped.append(f"{e['sku']} ({note})")
                    continue
                hit = (e, r, q, ru, conv, note)
                break
            if hit is None:
                reason = 'NO STOCK'
                detail = why
                if skipped:
                    reason = 'UNIT MISMATCH'
                    detail = f'{why} — candidates skipped: ' + '; '.join(skipped[:3])
                report.append(f'FLAG {reason.lower()}: {term} — {detail}')
                ds.append([sheet, hid, date, dish, term, 0, unit, '', '', f'{reason} — {detail}'])
                continue
            e, r, cur, ru, conv, note = hit
            prev = self._already_deducted(sheet, date, dish, e['sku'])
            if prev is not None:
                report.append(f"SKIP {e['sku']}: already deducted {prev}{ru} "
                              f"for '{dish}' on {str(date)[:10]} — refusing to double-deduct")
                continue
            take = min(conv, cur)                      # never over-deduct
            nv = round(cur - take, 3)
            if nv == int(nv):
                nv = int(nv)
            w.cell(r, 3).value = nv
            w.cell(r, 5).value = 'in' if nv > 0 else 'out'
            w.cell(r, 9).value = date
            mon = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][int(date[5:7])]
            w.cell(r, 11).value = f'{date[8:]}-{mon}: -{take}{ru} {dish}'
            short = '' if take >= conv - 1e-9 else f' [SHORT: needed {conv}{ru}]'
            reason = why + (f' ({note})' if note else '') + short
            ds.append([sheet, hid, date, dish, e['sku'], take, ru, cur, nv, reason])
            report.append(f'{e["sku"]}: {cur}{ru} -{take} -> {nv}{short}')
        self.log += report
        return report

    def note(self, sheet, hid, date, dish, item, text):
        """Record something that deliberately was NOT deducted (e.g. pre-soaked stock)."""
        self.wb['Deductions'].append([sheet, hid, date, dish, item, 0, '', '', '', text])
        self.log.append(f'NOTE {item}: {text}')

    def close_day(self, sheet, hid, date, meals):
        """meals: {'B dish name':[(term,qty,unit,why),...], 'L ...':[...]}
        One entry point for a whole household-day."""
        out = []
        for dish, items in meals.items():
            out += self.deduct(sheet, hid, date, dish, items)
        return out

    def save(self):
        self.wb.save(self.path)
