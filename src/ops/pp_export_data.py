#!/usr/bin/env python3
"""Export the FULL current PantryPulse model from the live workbook into CSVs for the repo:
ledgers, reference sheets (incl Master FnV), per-household boards, and snapshots.
Everything is generated fresh from the embedded workbook so the repo mirror is always current."""
import csv, os, io
from openpyxl import load_workbook
X='/mnt/user-data/outputs/PantryPulse-MASTER_2026-08-17_EOD.xlsx'
OUT='/tmp/pp_data'; 
import shutil; shutil.rmtree(OUT,ignore_errors=True); os.makedirs(OUT,exist_ok=True)

LEDGERS={'Orders':'ledgers/orders.csv','Deductions':'ledgers/deductions.csv','Meals':'ledgers/meals.csv','History':'ledgers/history.csv','Change Log':'ledgers/change_log.csv','Checks':'ledgers/inventory_checks.csv'}
REFERENCE={'Index':'reference/index.csv','Master FnV':'reference/master_fnv.csv','SKU Knowledge':'reference/sku_knowledge.csv','Dishes library':'reference/dishes_library.csv','Shelf-life rules':'reference/shelf_life_rules.csv','Conversions':'reference/conversions.csv','Ingredient map':'reference/ingredient_map.csv','Deduction method':'reference/deduction_method.csv','Subscriptions':'reference/subscriptions.csv','Board Snapshots':'snapshots/board_snapshots.csv'}
SKIP=set(LEDGERS)|set(REFERENCE)

def dump(ws,path):
    full=os.path.join(OUT,path); os.makedirs(os.path.dirname(full),exist_ok=True)
    with open(full,'w',newline='',encoding='utf-8') as f:
        w=csv.writer(f)
        for row in ws.iter_rows(values_only=True):
            if all(c is None for c in row): continue
            w.writerow(['' if c is None else c for c in row])
    return os.path.getsize(full)

def export_all():
    wb=load_workbook(X, read_only=True)
    files={}
    for sh,path in {**LEDGERS,**REFERENCE}.items():
        if sh in wb.sheetnames: files[path]=dump(wb[sh],path)
    # per-household boards
    for sh in wb.sheetnames:
        if sh in SKIP or sh in ('MoH data','MoH — Pratik & Sakshi'): continue
        # heuristic: a household board has 'Item' or 'SKU' in row1 col2, or is one of the known names
        safe=sh.replace('/','-').replace(' ','_')
        files[f'households/{safe}.csv']=dump(wb[sh],f'households/{safe}.csv')
    return OUT, files

if __name__=='__main__':
    out,files=export_all()
    print('exported',len(files),'files to',out)
    for p in sorted(files): print(f'  {p} ({files[p]:,}b)')
