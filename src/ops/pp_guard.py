"""PantryPulse write-guard + audit. Prevents duplicate-row / unit-twin leakage and detects it before push.
Every inventory write should go through set_one(); every push should call audit()."""
import re
try:
    import sys; sys.path.insert(0,'/mnt/user-data/outputs'); from pp_rows import data_rows
except Exception:
    def data_rows(ws):
        # fallback: header-aware — data from row 2 if header on row1 else row5
        return range(2, ws.max_row+1)

UNIT_SUFFIX = re.compile(r'\s*\((?:g|kg|ml|l|pc|pcs|piece|pieces|gm)\)\s*$', re.I)
FORM_WORDS = re.compile(r'\b(powder|whole|seed|seeds|paste|sauce|oil|flour|flakes|leaves|leaf|split|milk|fresh|dried|cut)\b', re.I)
# Words that make two same-stem items DIFFERENT foods (never merge across these).
# e.g. "cherry tomato" != "tomato"; "apple cider vinegar" != "vinegar"; "soy sauce" != "mustard sauce".
DISTINCT_QUALIFIER = re.compile(r'\b(cherry|grape|plum|roma|apple cider|balsamic|rice|white|malt|red wine|soy|soya|mustard|chilli|green chilli|red chilli|fish|oyster|hoisin|worcestershire|tomato|schezwan|schezuan|tamari|coconut|almond|oat|soya?|skimmed|toned|full cream|sweet|bitter|baby|spring|red|green|yellow|black|white|brown|basmati|matta|jeera|sona|masoori|kolam|sticky|jasmine|arborio|ponni|idli)\b', re.I)
# Distinct product nouns that share a stem word but are different products.
DISTINCT_HEAD = [
    (re.compile(r'\bvinegar\b',re.I), re.compile(r'\b(apple cider|balsamic|rice|white|malt|red wine|synthetic|chilli|coconut)\b',re.I)),
    (re.compile(r'\bsauce\b',re.I),   re.compile(r'\b(soy|soya|mustard|chilli|fish|oyster|hoisin|worcestershire|tomato|schezwan|schezuan|barbecue|bbq|tabasco|sriracha|peri|piri|ranch|thousand|smokey|tamarind|pizza)\b',re.I)),
    (re.compile(r'\btomato\b',re.I),  re.compile(r'\b(cherry|grape|plum|roma|sun.?dried|ketchup|paste|sauce|puree)\b',re.I)),
    (re.compile(r'\brice\b',re.I),    re.compile(r'\b(brown|red|matta|sticky|jasmine|basmati|jeera|flour|paper|vermic|noodle|wild|black|arborio)\b',re.I)),
    (re.compile(r'\bmilk\b',re.I),    re.compile(r'\b(coconut|almond|oat|soy|soya)\b',re.I)),
]

def _qualset(name):
    """Distinct qualifiers present — two items are the same food only if these match exactly."""
    lc=str(name or '').lower()
    q=set(m.group(0).lower() for m in DISTINCT_QUALIFIER.finditer(lc))
    for head,quals in DISTINCT_HEAD:
        if head.search(lc):
            q|=set(m.group(0).lower() for m in quals.finditer(lc))
    return frozenset(q)

def food_key(name):
    """Canonical food identity for dedup: strip a trailing unit-suffix + brand-ish parens, lowercase, singularise.
    Deliberately CONSERVATIVE — keeps form words (powder/whole/leaf) so 'coriander powder' != 'coriander leaves'."""
    s = UNIT_SUFFIX.sub('', str(name or '').strip())
    s = re.sub(r'\(.*?\)', ' ', s)            # drop other parentheticals (brand/variety)
    s = re.sub(r'[^a-z0-9 ]', ' ', s.lower())
    s = re.sub(r'\s+', ' ', s).strip()
    toks = s.split()
    if toks: toks[-1] = re.sub(r'ies$', 'y', toks[-1]); toks[-1] = re.sub(r'([^s])s$', r'\1', toks[-1])
    return ' '.join(toks)

def find_row(ws, name, exclude=None):
    """Find THE existing row for this food (unit-agnostic). Returns row index or None.
    Never returns a row whose name contains a form-word the query lacks (so powder!=whole)."""
    want = food_key(name); wantforms = set(FORM_WORDS.findall(str(name).lower()))
    cands = []
    for r in data_rows(ws):
        n = ws.cell(r,2).value
        if not n: continue
        if exclude and re.search(exclude, str(n), re.I): continue
        if food_key(n) != want: continue
        nforms = set(FORM_WORDS.findall(str(n).lower()))
        if nforms != wantforms: continue
        if _qualset(n) != _qualset(name): continue   # cherry!=plain tomato, apple-cider!=plain vinegar, soy!=mustard sauce
        cands.append(r)
    if not cands: return None
    # prefer a positive-qty row, else the first
    for r in cands:
        q = ws.cell(r,3).value
        if isinstance(q,(int,float)) and q>0: return r
    return cands[0]

def set_one(ws, name, qty, unit, cat, date, note, exclude=None):
    """Set a food to qty/unit in its SINGLE canonical row. If multiple rows for the same food exist,
    collapse to one (keep the found one, zero+mark the others) so no twin survives. Returns (row, action)."""
    want = food_key(name); wantforms = set(FORM_WORDS.findall(str(name).lower()))
    matches = []
    for r in data_rows(ws):
        n = ws.cell(r,2).value
        if not n: continue
        if exclude and re.search(exclude, str(n), re.I): continue
        if food_key(n)==want and set(FORM_WORDS.findall(str(n).lower()))==wantforms and _qualset(n)==_qualset(name):
            matches.append(r)
    if not matches:
        r = ws.max_row+1
        for c,v in [(1,cat),(2,name),(8,1)]: ws.cell(r,c).value=v
        matches=[r]; action='created'
    else:
        action='updated' if len(matches)==1 else 'merged(%d)'%len(matches)
    keep = matches[0]
    ws.cell(keep,2).value=name; ws.cell(keep,3).value=qty; ws.cell(keep,4).value=unit
    ws.cell(keep,5).value='in' if (isinstance(qty,(int,float)) and qty>0) else 'out'
    ws.cell(keep,9).value=date; ws.cell(keep,11).value=note
    for r in sorted(matches[1:], reverse=True): ws.delete_rows(r)  # kill twins
    return keep, action

def audit(wb, households):
    """Return a list of problems: same-food-multiple-rows (unit twins) in any household sheet."""
    problems=[]
    def real(disp):
        if disp in wb.sheetnames: return disp
        for s in wb.sheetnames:
            if disp.split(' ')[0].lower() in s.lower() and 'MoH' not in s: return s
    for disp in households:
        sh=real(disp)
        if not sh: continue
        ws=wb[sh]; groups={}
        for r in data_rows(ws):
            n=ws.cell(r,2).value; q=ws.cell(r,3).value
            if not n or not isinstance(q,(int,float)) or q<=0: continue
            k=(food_key(n), frozenset(FORM_WORDS.findall(str(n).lower())), _qualset(n))
            groups.setdefault(k,[]).append((str(n),q,str(ws.cell(r,4).value or '')))
        for k,rows in groups.items():
            if len(rows)>1:
                problems.append(f'{sh}: DUPLICATE "{k[0]}" -> '+' + '.join(f'{n}={q}{u}' for n,q,u in rows))
    return problems
