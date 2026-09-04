"""pp_changelog — the ONE place every PantryPulse data change is recorded.
Import and call log() from every tool that touches the workbook (book.py, apply.py,
pp_deduct.py, ad-hoc corrections). Nothing changes on a board without a row here.

    from pp_changelog import log
    log(wb, household='Yash & Manik', kind='order', sku='Paneer', old=0, new=200, unit='g',
        source='Bhavya-dictated order list', reason='3-Sep order', build='MASTER_740')

kind   : order | deduction | board-overwrite | correction | reversal | rule | new-sku | merge | expiry
source : Bhavya-dictated order list | Bhavya overwrote — smart-list check result | Emergent meal plan |
         Tequila cart read | physical count | pp_deduct engine | Claude correction | system
"""
import datetime
COLS=['when','household','hid','kind','sku','field','old','new','delta','unit','source','reason','build','ref']
def _sheet(wb):
    if 'Change Log' not in wb.sheetnames:
        s=wb.create_sheet('Change Log'); s.append(COLS); return s
    return wb['Change Log']
def log(wb, household, kind, sku, old, new, unit='', source='', reason='', build='', ref='', field='qty', hid='', when=None):
    s=_sheet(wb)
    if hid=='' and 'Index' in wb.sheetnames:
        ix=wb['Index']
        for r in range(5,ix.max_row+1):
            if str(ix.cell(r,1).value)==household: hid=str(ix.cell(r,3).value); break
    try: delta=round(float(new)-float(old),3) if old is not None and new is not None else None
    except Exception: delta=None
    s.append([when or datetime.date.today().isoformat(), household, hid, kind, sku, field, old, new, delta, unit, source, reason, build, ref])
    return s.max_row
