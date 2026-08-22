// PantryPulse — append a NEW recipe (from Rasoi) into Recipe Master, as Bhavya, dupe-guarded.
// POST /api/recipeadd { dish, rows:[[ingredient, perAdultQty, unit, class],...] }
const APPS = ''; // <- same Apps Script /exec URL
const KEY = ''; // <- same shared secret
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (!APPS) { res.status(503).json({ error: 'apps-script URL not configured yet' }); return; }
  try {
    const b = req.body || {};
    const r = await fetch(APPS, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: KEY, dish: b.dish, rows: b.rows }), redirect: 'follow' });
    const txt = await r.text();
    res.setHeader('Content-Type', 'application/json'); res.status(200).send(txt);
  } catch (e) { res.status(502).json({ error: String(e && e.message || e) }); }
}
