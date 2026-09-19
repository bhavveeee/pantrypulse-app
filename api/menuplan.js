// /api/menuplan?household=NAME&week=YYYY-Www  →  Menu Planner /api/v1/plans
// The planner is now behind auth (401 "sign in with your @curiousinc.com address", 19-Sep). Send whatever the
// planner team issues: PLANNER_KEY as a Bearer token AND as x-api-key, plus an optional PLANNER_COOKIE.
const BASE = "https://menu-planner-omega-ten.vercel.app/api/v1";
// SERVER-SIDE ONLY. Prefer Vercel env PLANNER_KEY; the literal below is the fallback so the board works before env is set. Move to env and delete the literal.
const KEY = String(process.env.PLANNER_KEY || "8IGg-fwcLIau4A70Dm0bi5YUNmdvAznLFvTBBUFhIKk").trim();
export default async function handler(req, res) {
  const { household, week } = req.query || {};
  if (!household) { res.status(400).json({ error: "household required" }); return; }
  const url = BASE + "/plans?household=" + encodeURIComponent(household) + (week ? "&week=" + encodeURIComponent(week) : "");
  const headers = { accept: "application/json" };
  headers["X-Api-Key"] = KEY; headers.authorization = "Bearer " + KEY;
  if (process.env.PLANNER_COOKIE) headers.cookie = process.env.PLANNER_COOKIE;
  try {
    const r = await fetch(url, { headers });
    const body = await r.text();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "private, max-age=300");
    if (r.status === 404) { res.status(404).json({ error: "noweek", detail: body.slice(0, 200) }); return; }   // 404 = no such plan (next week not built yet) — not an error
    if (r.status === 401 || r.status === 403) { res.status(r.status).json({ error: "planner auth", upstream: body.slice(0, 200) }); return; }
    res.status(r.status).send(body || "{}");
  } catch (e) { res.status(502).json({ error: "planner unreachable", detail: String(e && e.message || e) }); }
}
export const config = { maxDuration: 60 };
