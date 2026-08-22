// PantryPulse — Emergent Meal Planner proxy (same-origin for the app, no CORS pain).
// GET /api/emergent?house=<planner house name>[&week=2026-W35]
// Returns { week, updated_at, weekly_menu } for the requested (or latest) week.
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  const house = req.query.house;
  if (!house) { res.status(400).json({ error: 'house required' }); return; }
  const base = 'https://smart-meal-planner-40.emergent.host';
  try {
    const r = await fetch(base + '/api/plans/by-house?house=' + encodeURIComponent(house));
    if (!r.ok) throw new Error('by-house ' + r.status);
    const plans = await r.json();
    if (!Array.isArray(plans) || !plans.length) { res.status(404).json({ error: 'no plans for house' }); return; }
    let plan = null;
    if (req.query.week) plan = plans.find(p => p.week === req.query.week);
    if (!plan) { plans.sort((a, b) => String(b.week).localeCompare(String(a.week))); plan = plans[0]; }
    const r2 = await fetch(base + '/api/plans/' + plan.id);
    if (!r2.ok) throw new Error('plan ' + r2.status);
    const full = await r2.json();
    res.status(200).json({ week: plan.week, updated_at: full.updated_at, weekly_menu: full.weekly_menu });
  } catch (e) {
    res.status(502).json({ error: String(e && e.message || e) });
  }
}
