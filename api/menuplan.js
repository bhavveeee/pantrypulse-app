// /api/menuplan?household=NAME&week=YYYY-Www  →  Menu Planner /api/v1/plans (read-only, no auth upstream).
// Same-origin proxy so the IGHO tab never depends on the planner's CORS policy, and the planner's
// ~30 s cold start is absorbed here (maxDuration 60). Never parses `text`; passes the JSON through.
const BASE = "https://menu-planner-omega-ten.vercel.app/api/v1";
export default async function handler(req, res) {
  const { household, week } = req.query || {};
  if (!household) { res.status(400).json({ error: "household required" }); return; }
  const url = BASE + "/plans?household=" + encodeURIComponent(household) + (week ? "&week=" + encodeURIComponent(week) : "");
  try {
    const r = await fetch(url, { headers: { accept: "application/json" } });
    const body = await r.text();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "private, max-age=300");
    res.status(r.status).send(body || "{}");
  } catch (e) {
    res.status(502).json({ error: "planner unreachable", detail: String(e && e.message || e) });
  }
}
