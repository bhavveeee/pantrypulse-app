// PantryPulse — append NEW recipe (Rasoi) into Recipe Master, dupe-guarded, append-only.
// Vercel Pro: allow a longer run — Apps Script and Rasoi can take 10-30s.
export const config = { maxDuration: 60 };
const APPS = 'https://script.google.com/macros/s/AKfycbyw2-4MILZ-u-CjhTcoCmqZNiOJIaVgj7QDWRXTvgrsC1ME8Uqs43gTbzLq8wFtST6j9A/exec';
const KEY = 'pp';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  try {
    const b = req.body || {};
    const r = await fetch(APPS, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: KEY, dish: b.dish, rows: b.rows }), redirect: 'follow' });
    const txt = await r.text();
    res.setHeader('Content-Type', 'application/json'); res.status(200).send(txt);
  } catch (e) { res.status(502).json({ error: String(e && e.message || e) }); }
}
