// /api/menuplan?household=NAME&week=YYYY-Www  →  Menu Planner /api/v1/plans
// The planner is now behind auth (401 "sign in with your @curiousinc.com address", 19-Sep). Send whatever the
// planner team issues: PLANNER_KEY as a Bearer token AND as x-api-key, plus an optional PLANNER_COOKIE.
const BASE = "https://menu-planner-omega-ten.vercel.app/api/v1";
export default async function handler(req, res) {
  const { household, week } = req.query || {};
  if (!household) { res.status(400).json({ error: "household required" }); return; }
  const url = BASE + "/plans?household=" + encodeURIComponent(household) + (week ? "&week=" + encodeURIComponent(week) : "");
  const headers = { accept: "application/json" };
  if (process.env.PLANNER_KEY) { headers.authorization = "Bearer " + process.env.PLANNER_KEY; headers["x-api-key"] = process.env.PLANNER_KEY; }
  if (process.env.PLANNER_COOKIE) headers.cookie = process.env.PLANNER_COOKIE;
  try {
    const r = await fetch(url, { headers });
    const body = await r.text();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "private, max-age=300");
    if (r.status === 401 || r.status === 403) { res.status(r.status).json({ error: "planner auth", detail: "Menu Planner rejected the request — set PLANNER_KEY (and/or PLANNER_COOKIE) in Vercel env.", upstream: body.slice(0, 200) }); return; }
    res.status(r.status).send(body || "{}");
  } catch (e) { res.status(502).json({ error: "planner unreachable", detail: String(e && e.message || e) }); }
}
export const config = { maxDuration: 60 };
