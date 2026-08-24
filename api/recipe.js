// PantryPulse — recipe query proxy -> Apps Script on the Recipe Master sheet.
// Credentials from Vercel env vars: APPS_URL, APPS_KEY. Duration set in vercel.json.
const APPS = (process.env.APPS_URL || '').trim();
const KEY = (process.env.APPS_KEY || '').trim();
const BUSY = /too many scripts running simultaneously|Service invoked too many times|exceeded maximum execution time/i;
const LOGIN = /accounts\.google\.com|ServiceLogin|signin\/v2|Sign in - Google/i;
const PER_TRY_MS = 45000;   // single generous attempt; vercel.json allows 60s

async function fetchWithTimeout(url, ms) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await fetch(url, { redirect: 'follow', signal: ac.signal }); }
  finally { clearTimeout(t); }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.query.probe) {
    let host = null, ok = false;
    try { const u = new URL(APPS); host = u.host + u.pathname; ok = /script\.google\.com$/.test(u.host) && /\/exec$/.test(u.pathname); } catch (e) {}
    res.status(200).json({ apps_url_set: Boolean(APPS), apps_url_host: host, apps_url_looks_valid: ok, apps_key_set: Boolean(KEY) });
    return;
  }
  if (!APPS || !KEY) { res.status(503).json({ error: 'config_missing' }); return; }
  const started = Date.now();
  const url = APPS + '?key=' + encodeURIComponent(KEY) + '&q=' + encodeURIComponent(req.query.dish || '');
  try {
    const r = await fetchWithTimeout(url, PER_TRY_MS);
    const txt = await r.text();
    if (txt && txt.trim().charAt(0) === '{') {
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(txt); return;
    }
    // Not JSON — say exactly what Google returned so the cause is unambiguous.
    const login = LOGIN.test(txt) || LOGIN.test(r.url || '');
    res.status(login ? 401 : (BUSY.test(txt) ? 429 : 502)).json({
      error: login ? 'apps_script_requires_login' : (BUSY.test(txt) ? 'apps_script_busy' : 'apps_script_bad_reply'),
      hint: login ? 'Apps Script deployment access is not set to "Anyone". Deploy > Manage deployments > edit > Who has access: Anyone.' : undefined,
      http_status: r.status, final_url: String(r.url || '').slice(0, 120),
      elapsed_ms: Date.now() - started,
      detail: String(txt).replace(/\s+/g, ' ').slice(0, 200)
    });
  } catch (e) {
    const to = e && e.name === 'AbortError';
    res.status(429).json({ error: to ? 'apps_script_timeout' : 'apps_script_error',
      retryable: true, elapsed_ms: Date.now() - started,
      detail: String((e && e.message) || e).slice(0, 200) });
  }
}
