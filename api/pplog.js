// /api/pplog — forwards PP questions to the Google Sheet (PP_LOG_URL), and reads them back for the admin view.
module.exports = async (req, res) => {
  const url = process.env.PP_LOG_URL, key = process.env.PP_LOG_KEY || 'pp-log';
  if (!url) return res.status(200).json({ ok: false, error: 'PP_LOG_URL not set — questions are kept in this browser only' });
  try {
    if (req.method === 'POST') {
      let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...b, key }), redirect: 'follow' });
      return res.status(200).json(await r.json());
    }
    const q = new URLSearchParams({ key, n: String(req.query.n || 100), household: String(req.query.household || '') });
    const r = await fetch(url + '?' + q.toString(), { redirect: 'follow' });
    return res.status(200).json(await r.json());
  } catch (e) { return res.status(502).json({ ok: false, error: String(e.message || e) }); }
};
