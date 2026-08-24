// PantryPulse — recipe query proxy -> Apps Script on the Recipe Master sheet.
// Credentials from Vercel env vars: APPS_URL, APPS_KEY. Duration set in vercel.json.
// Env values are TRIMMED — a pasted trailing newline silently breaks the URL.
const APPS = (process.env.APPS_URL || '').trim();
const KEY = (process.env.APPS_KEY || '').trim();

const BUSY = /too many scripts running simultaneously|Service invoked too many times|exceeded maximum execution time/i;
const DEADLINE_MS = 40000;
const PER_TRY_MS = 12000;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchWithTimeout(url, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { redirect: 'follow', signal: ac.signal }); }
  finally { clearTimeout(t); }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // ?probe=1 -> config health WITHOUT revealing the secret
  if (req.query.probe) {
    let host = null, ok = false;
    try { const u = new URL(APPS); host = u.host + u.pathname; ok = /script\.google\.com$/.test(u.host) && /\/exec$/.test(u.pathname); } catch (e) {}
    res.status(200).json({
      apps_url_set: Boolean(APPS), apps_url_len: APPS.length, apps_url_host: host,
      apps_url_looks_valid: ok,
      apps_url_had_whitespace: APPS !== (process.env.APPS_URL || ''),
      apps_key_set: Boolean(KEY), apps_key_len: KEY.length,
      apps_key_had_whitespace: KEY !== (process.env.APPS_KEY || '')
    });
    return;
  }

  if (!APPS || !KEY) { res.status(503).json({ error: 'config_missing' }); return; }

  const started = Date.now();
  const url = APPS + '?key=' + encodeURIComponent(KEY) + '&q=' + encodeURIComponent(req.query.dish || '');
  let lastTxt = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (Date.now() - started > DEADLINE_MS - PER_TRY_MS) break;
    try {
      const r = await fetchWithTimeout(url, PER_TRY_MS);
      const txt = await r.text();
      lastTxt = txt;
      if (txt && txt.trim().charAt(0) === '{') {
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(txt); return;
      }
      if (BUSY.test(txt)) { await sleep(600 * Math.pow(2, attempt)); continue; }
      // non-JSON, not busy: surface the first line so we can see what Google said
      break;
    } catch (e) {
      lastTxt = (e && e.name === 'AbortError') ? 'apps_script_timeout' : String((e && e.message) || e);
      if (Date.now() - started > DEADLINE_MS - PER_TRY_MS) break;
      await sleep(400);
    }
  }
  const busy = BUSY.test(lastTxt) || lastTxt === 'apps_script_timeout';
  res.status(busy ? 429 : 502).json({
    error: busy ? 'apps_script_busy' : 'apps_script_bad_reply',
    retryable: busy, elapsed_ms: Date.now() - started,
    detail: String(lastTxt).replace(/\s+/g, ' ').slice(0, 200)
  });
}
