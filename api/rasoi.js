// PantryPulse — Rasoi recipe-breakdown proxy. POST /api/rasoi {dish, youtube_url?, notes?, pax?}
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    const b = req.body || {};
    const payload = { recipe_name: b.dish, query: b.dish, recipe: b.dish,
      youtube_url: b.youtube_url || undefined, url: b.youtube_url || undefined,
      notes: b.notes || undefined, servings: b.pax || undefined };
    const r = await fetch('https://recipe-voice-finder.emergent.host/api/recipe/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const txt = await r.text();
    res.status(r.status).setHeader('Content-Type', 'application/json');
    res.send(txt);
  } catch (e) { res.status(502).json({ error: String(e && e.message || e) }); }
}
