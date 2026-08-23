// PantryPulse — Rasoi recipe-breakdown proxy. POST /api/rasoi {dish, pax?}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    const b = req.body || {};
    const dish = b.dish || b.query || '';
    if (!dish) { res.status(400).json({ error: 'dish required' }); return; }
    // Rasoi requires exactly { query }. Extra fields cause 422 — send only query.
    const payload = { query: String(dish) };
    const r = await fetch('https://recipe-voice-finder.emergent.host/api/recipe/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const txt = await r.text();
    res.status(r.status).setHeader('Content-Type', 'application/json');
    res.send(txt);
  } catch (e) { res.status(502).json({ error: String(e && e.message || e) }); }
}
