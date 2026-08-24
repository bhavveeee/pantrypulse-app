// PantryPulse — recipe query proxy -> Apps Script on the Recipe Master sheet.
// Credentials come from Vercel env vars only: APPS_URL, APPS_KEY.
export const config = { maxDuration: 60 };
const APPS = process.env.APPS_URL;
const KEY = process.env.APPS_KEY;

// Google allows ~30 concurrent Apps Script executions per account. Past that it
// returns an HTML error page instead of JSON — detect it and retry with backoff.
const BUSY = /too many scripts running simultaneously|Service invoked too many times|exceeded maximum execution time/i;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!APPS || !KEY) {
    res.status(503).json({ error: 'config_missing', detail: 'Set APPS_URL and APPS_KEY in Vercel env vars, then redeploy.' });
    return;
  }
  const dish = req.query.dish || '';
  const url = APPS + '?key=' + encodeURIComponent(KEY) + '&q=' + encodeURIComponent(dish);
  let lastTxt = '';
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { redirect: 'follow' });
      const txt = await r.text();
      lastTxt = txt;
      if (txt && txt.trim().charAt(0) === '{') {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(txt);
        return;
      }
      if (BUSY.test(txt)) { await sleep(700 * Math.pow(2, attempt) + Math.random() * 400); continue; }
      break;
    } catch (e) {
      lastTxt = String((e && e.message) || e);
      await sleep(500 * (attempt + 1));
    }
  }
  const busy = BUSY.test(lastTxt);
  res.status(busy ? 429 : 502).json({
    error: busy ? 'apps_script_busy' : 'apps_script_bad_reply',
    retryable: busy,
    detail: String(lastTxt).slice(0, 160)
  });
}
