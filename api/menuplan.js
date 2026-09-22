// /api/menuplan?household=NAME&week=YYYY-Www  →  Menu Planner /api/v1/plans   (or ?list=1 → /households)
// Server-side only. Hard 9s timeout so the function NEVER hangs when the planner is slow/asleep — it
// returns 504 fast instead of holding the connection open (which looked like "the API not working").
const BASE = "https://menu-planner-omega-ten.vercel.app/api/v1";
const KEY = String(process.env.PLANNER_KEY || "8IGg-fwcLIau4A70Dm0bi5YUNmdvAznLFvTBBUFhIKk").trim();

export default async function handler(req, res) {
  const { household, week, list } = req.query || {};
  const url = list ? BASE + "/households"
                   : (household ? BASE + "/plans?household=" + encodeURIComponent(household) + (week ? "&week=" + encodeURIComponent(week) : "") : null);
  if (!url) { res.status(400).json({ error: "household or list required" }); return; }
  const headers = { accept: "application/json", "X-Api-Key": KEY, authorization: "Bearer " + KEY };
  if (process.env.PLANNER_COOKIE) headers.cookie = process.env.PLANNER_COOKIE;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);   // fail fast
  try {
    const r = await fetch(url, { headers, signal: ctrl.signal });
    clearTimeout(timer);
    const body = await r.text();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "private, max-age=300");
    if (r.status === 404) { res.status(404).json({ error: "noweek", detail: body.slice(0, 200) }); return; }
    if (r.status === 401 || r.status === 403) { res.status(r.status).json({ error: "planner auth", upstream: body.slice(0, 200) }); return; }
    res.status(r.status).send(body || "{}");
  } catch (e) {
    clearTimeout(timer);
    const aborted = e && (e.name === "AbortError" || /abort/i.test(String(e.message || e)));
    res.status(aborted ? 504 : 502).json({ error: aborted ? "planner timeout (>9s) — Menu Planner is asleep or down" : "planner unreachable", detail: String(e && e.message || e) });
  }
}
export const config = { maxDuration: 15 };
