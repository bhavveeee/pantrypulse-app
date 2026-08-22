// PantryPulse — Emergent Meal Planner proxy. GET /api/emergent?house=<name>[&week=YYYY-Www]
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
    if (!Array.isArray(plans) || !plans.length) { res.status(404).json({ error: 'no plans' }); return; }
    // current ISO week in IST
    function istWeek() {
      const now = new Date(Date.now() + 5.5 * 3600e3);
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day);
      const y = d.getUTCFullYear();
      const wk = Math.ceil((((d - Date.UTC(y, 0, 1)) / 86400000) + 1) / 7);
      return y + '-W' + String(wk).padStart(2, '0');
    }
    const want = req.query.week || istWeek();
    let plan = plans.find(p => p.week === want);
    if (!plan) { plans.sort((a, b) => String(b.week).localeCompare(String(a.week)));
      plan = plans.find(p => String(p.week) <= want) || plans[0]; }
    const r2 = await fetch(base + '/api/plans/' + plan.id);
    if (!r2.ok) throw new Error('plan ' + r2.status);
    const full = await r2.json();
    res.status(200).json({ week: plan.week, updated_at: full.updated_at, weekly_menu: full.weekly_menu });
  } catch (e) { res.status(502).json({ error: String(e && e.message || e) }); }
}
