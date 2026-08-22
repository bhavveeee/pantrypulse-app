// PantryPulse — recipe query proxy -> Bhavya's Apps Script on the Recipe Master sheet.
// GET /api/recipe?dish=<name>  -> { matches:[{dish,score,rows:[[ing,perAdult,unit,class],...]}] }
const APPS = ''; // <- paste the Apps Script /exec URL here
const KEY = ''; // <- shared secret (same as SECRET in the script)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!APPS) { res.status(503).json({ error: 'apps-script URL not configured yet' }); return; }
  try {
    const r = await fetch(APPS + '?key=' + encodeURIComponent(KEY) + '&q=' + encodeURIComponent(req.query.dish || ''), { redirect: 'follow' });
    const txt = await r.text();
    res.setHeader('Content-Type', 'application/json'); res.status(200).send(txt);
  } catch (e) { res.status(502).json({ error: String(e && e.message || e) }); }
}
