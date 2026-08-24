// PantryPulse — recipe query proxy -> Apps Script on the Recipe Master sheet.
// Prefer Vercel env vars. Literals are a temporary fallback and will be removed
// once APPS_URL / APPS_KEY are set in Settings -> Environment Variables.
// Vercel Pro: allow a longer run — Apps Script can take 10-30s.
export const config = { maxDuration: 60 };
const APPS = process.env.APPS_URL || 'https://script.google.com/macros/s/AKfycbyw2-4MILZ-u-CjhTcoCmqZNiOJIaVgj7QDWRXTvgrsC1ME8Uqs43gTbzLq8wFtST6j9A/exec';
const KEY = process.env.APPS_KEY || 'pp';

// Google allows only ~30 concurrent Apps Script executions per account. When the
// enrichment sweep runs it can blow past that, and Apps Script answers with an
// HTML error page instead of JSON. Detect it and retry with backoff.
const BUSY = /too many scripts running simultaneously|Service invoked too many times|exceeded maximum execution time/i;
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
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
      if (BUSY.test(txt)) {                 // quota — wait and retry
        await sleep(700 * Math.pow(2, attempt) + Math.random() * 400);
        continue;
      }
      break;                                 // some other non-JSON reply
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
