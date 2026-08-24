// PantryPulse — append a NEW recipe into Recipe Master, dupe-guarded, append-only.
// Credentials come from Vercel env vars only: APPS_URL, APPS_KEY.
export const config = { maxDuration: 60 };
const APPS = process.env.APPS_URL;
const KEY = process.env.APPS_KEY;
const BUSY = /too many scripts running simultaneously|Service invoked too many times/i;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (!APPS || !KEY) {
    res.status(503).json({ error: 'config_missing', detail: 'Set APPS_URL and APPS_KEY in Vercel env vars, then redeploy.' });
    return;
  }
  const b = req.body || {};
  let lastTxt = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(APPS, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: KEY, dish: b.dish, rows: b.rows }), redirect: 'follow' });
      const txt = await r.text();
      lastTxt = txt;
      if (txt && txt.trim().charAt(0) === '{') {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(txt);
        return;
      }
      if (BUSY.test(txt)) { await sleep(900 * Math.pow(2, attempt)); continue; }
      break;
    } catch (e) { lastTxt = String((e && e.message) || e); await sleep(600 * (attempt + 1)); }
  }
  res.status(BUSY.test(lastTxt) ? 429 : 502)
     .json({ error: 'apps_script_unavailable', detail: String(lastTxt).slice(0, 160) });
}
