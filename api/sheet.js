// PantryPulse — recipe repository sheet proxy. GET /api/sheet[?tab=<tabName>]
const SHEET_ID = process.env.RECIPE_SHEET_ID || '13xim-o6uZMDiIHkp2CnFXwnYq8wNKS_Y5lsHxeCg__Q';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  try {
    let url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv';
    if (req.query.tab) url += '&sheet=' + encodeURIComponent(req.query.tab);
    const r = await fetch(url, { redirect: 'follow' });
    const txt = await r.text();
    if (!r.ok || txt.slice(0, 200).toLowerCase().includes('<html')) {
      res.status(403).json({ error: 'sheet not readable — set Share: Anyone with link (Viewer)', status: r.status });
      return;
    }
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.status(200).send(txt);
  } catch (e) { res.status(502).json({ error: String(e && e.message || e) }); }
}
