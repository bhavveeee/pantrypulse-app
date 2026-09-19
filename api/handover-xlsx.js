// /api/handover-xlsx  — POST { household, dayLabels:[…], rows:[ {status,ingredient,unit,required,inKitchen,toBuy,builtOn,pastUse,shelfAs,dishes} … ] }
// Returns a styled .xlsx built with ExcelJS (server side — SheetJS's free build drops the fills that are
// the whole point of this file). The board computes the rows and posts them; this only formats.
import ExcelJS from 'exceljs';
const HEADERS = ['Status','Ingredient','Unit','Required','In kitchen','To buy','Built on','Past use-by','On the shelf as','For which dishes'];
const WIDTHS  = [14,30,7,10,11,10,9,12,34,52];
const FILL = { green:'FFE8F0E8', yellow:'FFFBEFD6', red:'FFFBE3E0', expired:'FFFBE3E0', unit:'FFEFF1EE' };
const WORD = { green:'Available', yellow:'Low', red:'Not available', expired:'Expired', unit:'Unit clash' };
const round = n => Math.abs(n) < 1 ? Math.round(n*100)/100 : Math.round(n*10)/10;
function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function sheetName(t){ return (t||'Handover').replace(/[[\]:*?/\\]/g,' ').slice(0,31) || 'Handover'; }

export default async function handler(req, res){
  if (req.method !== 'POST'){ res.status(405).json({error:'POST only'}); return; }
  let body = req.body;
  if (typeof body === 'string'){ try{ body = JSON.parse(body); }catch{ body = {}; } }
  const household = String((body&&body.household) || 'Handover');
  const rows = Array.isArray(body&&body.rows) ? body.rows : [];
  const dayLabels = Array.isArray(body&&body.dayLabels) ? body.dayLabels.map(String) : [];
  try {
    const wb = new ExcelJS.Workbook(); wb.creator = 'PantryPulse';
    const ws = wb.addWorksheet(sheetName(household));
    ws.columns = HEADERS.map((h,i)=>({ header:h, width:WIDTHS[i] }));
    const head = ws.getRow(1);
    head.font = { bold:true };
    head.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'FFE7EDE6' } }; });
    for (const r of rows){
      const st = String(r.status||'red');
      const line = [
        WORD[st] || st,
        (r.hero ? '★ ' : '') + String(r.ingredient||''),
        (r.unit==='pcs'||r.unit==='pc') ? 'pc' : (r.unit||'g'),
        (r.required!=null&&r.required!=='') ? round(+r.required) : '',
        (st==='unit') ? '' : (r.inKitchen!=null&&r.inKitchen!=='' ? round(+r.inKitchen) : 0),
        (+r.toBuy>0) ? round(+r.toBuy) : 0,
        r.hero ? 'yes' : '',
        (r.pastUse!=null&&r.pastUse!=='') ? round(+r.pastUse) : '',
        String(r.shelfAs||''),
        String(r.dishes||''),
      ];
      const row = ws.addRow(line);
      const argb = FILL[st] || 'FFFFFFFF';
      row.eachCell({ includeEmpty:true }, c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb } }; c.alignment = { vertical:'top' }; });
      if (r.hero) row.getCell(2).font = { bold:true };
    }
    ws.views = [{ state:'frozen', ySplit:1 }];
    ws.autoFilter = { from:'A1', to:{ row: rows.length+1, column: HEADERS.length } };
    const buf = await wb.xlsx.writeBuffer();
    const span = dayLabels.length===0 ? 'no-days' : dayLabels.length===1 ? slug(dayLabels[0]) : slug(dayLabels[0])+'-to-'+slug(dayLabels[dayLabels.length-1]);
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition','attachment; filename="handover-'+slug(household)+'-'+span+'.xlsx"');
    res.setHeader('Cache-Control','no-store');
    res.status(200).send(Buffer.from(buf));
  } catch(e){ res.status(500).json({ error: String(e&&e.message||e) }); }
}
export const config = { maxDuration: 60 };
