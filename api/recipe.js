// PantryPulse — recipe query proxy -> Apps Script on the Recipe Master sheet.
// Credentials come from Vercel env vars only: APPS_URL, APPS_KEY.
// Duration is set in vercel.json (config exports are not honoured for root /api functions).
const APPS = process.env.APPS_URL;
const KEY = process.env.APPS_KEY;

// Google allows ~30 concurrent Apps Script executions per account. Past that it
// returns an HTML error page instead of JSON. Retry, but never outlive the budget:
// we bail out and answer 429 rather than letting the platform 504 us.
const BUSY = /too many scripts running simultaneously|Service invoked too many times|exceeded maximum execution time/i;
const DEADLINE_MS = 40000;   // hard stop, well inside maxDuration 60
const PER_TRY_MS  = 12000;   // give one Apps Script call this long
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithTimeout(url, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { redirect: 'follow', signal: ac.signal }); }
  finally { clearTimeout(t); }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!APPS || !KEY) {
    res.status(503).json({ error: 'config_missing', detail: 'Set APPS_URL and APPS_KEY in Vercel env vars, then redeploy.' });
    return;
  }
  const started = Date.now();
  const dish = req.query.dish || '';
  const url = APPS + '?key=' + encodeURIComponent(KEY) + '&q=' + encodeURIComponent(dish);
  let lastTxt = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (Date.now() - started > DEADLINE_MS - PER_TRY_MS) break;
    try {
      const r = await fetchWithTimeout(url, PER_TRY_MS);
      const txt = await r.text();
      lastTxt = txt;
      if (txt && txt.trim().charAt(0) === '{') {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(txt);
        return;
      }
      if (BUSY.test(txt)) { await sleep(600 * Math.pow(2, attempt)); continue; }
      break;
    } catch (e) {
      lastTxt = String((e && e.name === 'AbortError') ? 'apps_script_timeout' : ((e && e.message) || e));
      if (Date.now() - started > DEADLINE_MS - PER_TRY_MS) break;
      await sleep(400);
    }
  }
  const busy = BUSY.test(lastTxt) || lastTxt === 'apps_script_timeout';
  res.status(busy ? 429 : 502).json({
    error: busy ? 'apps_script_busy' : 'apps_script_bad_reply',
    retryable: busy,
    elapsed_ms: Date.now() - started,
    detail: String(lastTxt).slice(0, 160)
  });
}
