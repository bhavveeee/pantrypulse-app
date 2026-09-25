function hovPax(pid){ return (typeof HOV !== 'undefined' && HOV.pax && HOV.pax[pid]) || 2; }
function hovDays(){ return (typeof HOV !== 'undefined' && HOV.days) || []; }
function hovClosed(){ return (typeof HOV !== 'undefined' && HOV.closed) || ''; }
function hovShiftFrom(pid){
  return (typeof HOV !== 'undefined' && HOV.shiftEvening && HOV.shiftEvening[pid]) || null;
}
function hovShiftOn(pid, iso){
  var f = hovShiftFrom(pid);
  return !!f && String(iso).slice(0, 10) >= f;
}
function hovPrevDay(iso){
  var d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - 1);
  var i = d.toISOString().slice(0, 10);
  return [HOV_DOW[d.getUTCDay()],
          HOV_DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + HOV_MON[d.getUTCMonth()], i];
}
function hovDayLabel(pid, d){
  if (!hovShiftOn(pid, d[2])) return d[1];
  return hovPrevDay(d[2])[1].replace(/\s+\w+$/, '') + ' – ' + d[1];
}
function hovSlotOrder(pid, iso){
  /* S LAST IN BOTH ORDERS. The evening snack is the last thing the visit produces, and the
     simulation is sequential (§12) — putting it after dinner means a snack draws on what the
     dinner left, which is the true order of the day. */
  return hovShiftOn(pid, iso) ? ['D','S','B','L'] : ['B','L','D','S'];
}
function hovTodayIdx(){
  var days = hovDays(), today = new Date().toISOString().slice(0, 10), cal = days.length, ci = 0;
  for (var i = 0; i < days.length; i++){ if (days[i][2] >= today){ cal = i; break; } }
  for (var j = 0; j < days.length; j++){ if (days[j][2] <= hovClosed()) ci = j + 1; }
  return Math.max(cal, ci);
}
function hovOptTag(t){
  if (!t) return '';
  var b='display:inline-block;font-size:9px;font-weight:700;border-radius:8px;padding:1px 6px;'
       +'margin-left:5px;vertical-align:middle;';
  if (t==='optional')      return '<span style="'+b+'background:#eae4f2;color:#5b4a7a">optional</span>';
  if (t==='base-optional') return '<span style="'+b+'background:#e6eef2;color:#3f6474">base-opt</span>';
  return '';
}
function hovWeekOf(iso){
  var d = new Date(iso + 'T00:00:00Z');
  var t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  var dn = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dn + 3);
  var first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  var wk = 1 + Math.round(((t - first) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7);
  return t.getUTCFullYear() + '-W' + (wk < 10 ? '0' : '') + wk;
}
function hovIcon(name, size, colour){
  var s = size || 14, c = colour || 'currentColor';
  var open = '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="' + c
           + '" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" '
           + 'style="vertical-align:-2px;flex:none">';
  var d = {
    sync:    '<path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    right:   '<path d="M9 6l6 6-6 6"/>',
    check:   '<path d="M20 6L9 17l-5-5"/>',
    alert:   '<path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
    cross:   '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    lock:    '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    cart:    '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
    copy:    '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    clock:   '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
  }[name] || '';
  return open + d + '</svg>';
}
function hovDayState(pid, iso, i, lockIdx, plan, pax, sim, snap){
  if (i < lockIdx){
    /* A day only locks once it is behind `today`, and the window starts at closed+1 -- so on a
       freshly baked board NOTHING is locked (lockIdx is 0) and this branch is unreachable. It is
       reached only when the build has been left to age past its own window, and a build cannot
       contain ledger history for days that were still in the future when it was made. `snap` was
       therefore empty in EVERY build ever produced (`snapshot 0 households, 0 locked days`), while
       handover.json's note promised locked days came from it. The promise is withdrawn: say the
       board is stale rather than drawing a convincingly empty day. */
    var s = (snap && snap[iso]) || {B:[],L:[],D:[],S:[]}, slots = {B:[],L:[],D:[],S:[]}, n = 0;
    ['B','L','D','S'].forEach(function(sl){
      (s[sl] || []).forEach(function(e){
        n++;
        slots[sl].push({dish: e[0], rows: (e[1]||[]).map(function(r){
          /* RULE 118b — a LOCKED day's deducted lines print the unit the food is priced in, not a
             hardcoded 'g'. The ledger now holds milk in ml and eggs in pcs (Rule 115), so stamping 'g'
             on every past line would show "500 g of milk" on a day that consumed 500 ml, and "2 g of
             egg" where two eggs were used. Found while checking the three views Jayant named. */
          return {n: r[0], q: r[1], u: ppUnit(r[0], null) || 'g', st: 'done', lab: 'deducted'};
          }), notes: e[2] || []});
      });
    });
    return {locked: true, slots: slots, buy: [], dishes: n, stale: (n === 0)};
  }
  /* RULE 191 — breakfast and lunch come from THIS date; for a shift household the dinner comes
     from the day BEFORE it, because that is the same cook's visit. Keyed by ISO date, not weekday. */
  var _iso = hovDays()[i][2];
  var raw = plan && plan[_iso];
  var rawD = hovShiftOn(pid, _iso) ? (plan && plan[hovPrevDay(_iso)[2]]) : raw;
  var built = {B:[],L:[],D:[],S:[]}, n2 = 0;
  ['B','L','D','S'].forEach(function(sl){
    /* S TAKES rawD, NOT raw — Rule 191 again. The evening snack is served at the visit that cooks
       the dinner, so for a shift household it comes from the day before along with it. */
    var src = (sl === 'D' || sl === 'S') ? rawD : raw;
    if (!src) return;
    built[sl] = hovSlotDishes(src[sl] && src[sl].t, (src[sl] && src[sl].p) || pax);
    n2 += built[sl].length;
  });
  var r = hovSimDay(built, sim);
  return {locked: false, slots: r.slots, buy: r.buy, dishes: n2};
}