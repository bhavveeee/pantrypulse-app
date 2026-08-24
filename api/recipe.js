// PantryPulse — recipe query proxy -> Apps Script on Recipe Master sheet.
// Vercel Pro: allow a longer run — Apps Script and Rasoi can take 10-30s.
export const config = { maxDuration: 60 };
const APPS = 'https://script.google.com/macros/s/AKfycbyw2-4MILZ-u-CjhTcoCmqZNiOJIaVgj7QDWRXTvgrsC1ME8Uqs43gTbzLq8wFtST6j9A/exec';
const KEY = 'pp';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const r = await fetch(APPS + '?key=' + encodeURIComponent(KEY) + '&q=' + encodeURIComponent(req.query.dish || ''), { redirect: 'follow' });
    const txt = await r.text();
    res.setHeader('Content-Type', 'application/json'); res.status(200).send(txt);
  } catch (e) { res.status(502).json({ error: String(e && e.message || e) }); }
}
