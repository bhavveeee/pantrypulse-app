// /api/handover-xlsx — POST { household, dayLabels:[…], rows:[…] }
// EXACT replica of the friend's board export (verified against handover-y24-mon-21-sep.xlsx):
//   sheet name "Handover <first day label>", 10 columns, bold soft-green header, per-row status fill,
//   ONLY the ingredient cell bold when hero, frozen header, autofilter, valign top. No dropdowns/CF/merges.
import ExcelJS from 'exceljs';
const HEADERS = ['Status','Ingredient','Unit','Required','In kitchen','To buy','Built on','Past use-by','On the shelf as','For which dishes','Order?','Reason'];
// widths: col 7 (Built on) left default, exactly like theirs
const WIDTHS = { 1:14, 2:30, 3:7, 4:10, 5:11, 6:10, 8:12, 9:34, 10:52, 11:10, 12:40 };
const FILL = { green:'FFE8F0E8', yellow:'FFFBEFD6', red:'FFFBE3E0', expired:'FFFBE3E0', unit:'FFEFF1EE' };
const HEADER_FILL = 'FFE7EDE6';
const WORD = { green:'Available', yellow:'Low', red:'Not available', expired:'Expired', unit:'Unit clash' };
const round = n => Math.abs(n) < 1 ? Math.round(n*100)/100 : Math.round(n*10)/10;
function slug(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function sheetName(dayLabels){ var base = dayLabels && dayLabels.length ? 'Handover '+dayLabels[0] : 'Handover'; return base.replace(/[[\]:*?/\\]/g,' ').slice(0,31); }

export default async function handler(req, res){
  if (req.method !== 'POST'){ res.status(405).json({error:'POST only'}); return; }
  let body = req.body; if (typeof body === 'string'){ try{ body = JSON.parse(body); }catch{ body = {}; } }
  const household = String((body&&body.household) || 'Handover');
  const rows = Array.isArray(body&&body.rows) ? body.rows : [];
  const dayLabels = Array.isArray(body&&body.dayLabels) ? body.dayLabels.map(String) : [];
  try {
    const wb = new ExcelJS.Workbook(); wb.creator = 'PantryPulse';
    const ws = wb.addWorksheet(sheetName(dayLabels));
    ws.columns = HEADERS.map((h,i)=>{ const c = { header:h }; if (WIDTHS[i+1]) c.width = WIDTHS[i+1]; return c; });
    // header row: soft-green fill + bold
    const head = ws.getRow(1); head.font = { bold:true };
    head.eachCell(c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:HEADER_FILL } }; });
    for (const r of rows){
      const st = String(r.status||'red');
      const line = [
        WORD[st] || st,
        String(r.ingredient||''),
        (r.unit==='pcs'||r.unit==='pc') ? 'pc' : (r.unit||'g'),
        (r.required!=null&&r.required!=='') ? round(+r.required) : '',
        (st==='unit') ? '' : (r.inKitchen!=null&&r.inKitchen!=='' ? round(+r.inKitchen) : 0),
        (+r.toBuy>0) ? round(+r.toBuy) : 0,
        r.hero ? 'yes' : '',
        (r.pastUse!=null&&r.pastUse!=='') ? round(+r.pastUse) : '',
        String(r.shelfAs||''),          // pooled: "A + B + C"
        String(r.dishes||''),           // "Dish (L); Dish (D)"
        '',                             // Order? — human ticks Yes/No via the dropdown
        '',                             // Reason — human writes why
      ];
      const row = ws.addRow(line);
      const argb = FILL[st] || 'FFFFFFFF';
      row.eachCell({ includeEmpty:true }, c => { c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb } }; c.alignment = { vertical:'top' }; });
      if (r.hero) row.getCell(2).font = { bold:true };   // ONLY the ingredient cell bold, like theirs
    }
    // "Order?" dropdown (Yes/No) on every data row; "Reason" stays free text
    for (let i = 2; i <= rows.length + 1; i++){
      ws.getCell('K' + i).dataValidation = { type:'list', allowBlank:true, formulae:['"Yes,No"'], showErrorMessage:true, errorTitle:'Order?', error:'Pick Yes or No' };
      ws.getCell('K' + i).alignment = { vertical:'top' };
      ws.getCell('L' + i).alignment = { vertical:'top', wrapText:true };
    }
    ws.views = [{ state:'frozen', ySplit:1 }];
    ws.autoFilter = { from:'A1', to:{ row: rows.length+1, column: HEADERS.length } };
    const buf = await wb.xlsx.writeBuffer();
    const span = dayLabels.length===0 ? 'handover' : dayLabels.length===1 ? slug(dayLabels[0]) : slug(dayLabels[0])+'-to-'+slug(dayLabels[dayLabels.length-1]);
    res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition','attachment; filename="handover-'+slug(household)+'-'+span+'.xlsx"');
    res.setHeader('Cache-Control','no-store');
    res.status(200).send(Buffer.from(buf));
  } catch(e){ res.status(500).json({ error: String(e&&e.message||e) }); }
}
export const config = { maxDuration: 60 };
