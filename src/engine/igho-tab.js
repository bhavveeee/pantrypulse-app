/* ============================================================================================
   IGHO — Ingredient Handover (new board), v21_715
   Faithful port of the Handover pack (build v21_1192, 17 Sep 2026) onto this single-file app:
     • plan source  : Menu Planner /api/v1 (pre-parsed dishes; date-carried; 4 slots incl. snacks)
     • engine       : the pack's own matcher (ppResolve + guards), splitter (ppsplit), recipe
                      table (PP_NEEDS), board simulation (hovSimDay) — loaded from /private/igho/
     • stock        : THIS app's board rows for the household (never the pack's estate data)
   Behaviours kept exactly: Rule 46 (pool shape), 126/126f (expired is not absent), 129/188/188b
   (whole pool, both layers), 191 (evening shift), 213 (pid picks the sheet), 216/217 (pieces vs
   people; "and" is one dish), §12 (empty breakdown is VISIBLE), the seven /api/v1 rules.
   ============================================================================================ */
var IGHO_BASE='https://menu-planner-omega-ten.vercel.app/api/v1';
var IGHO_ASSET='/private/igho/';
var IGHO={ready:false,loading:false,err:null,plans:{},sel:{},asOf:null,videos:null,shiftEvening:{}};

/* ---- planner household name: the SAME names Emergent used (verified on /api/v1/households 18-Sep) */
function ighoPlannerName(h){
  var n=String(h.name||'').replace(/\s*-\s*latest$/i,'').trim();
  try{ if(typeof HOV_NAME!=='undefined'&&HOV_NAME[n]) return HOV_NAME[n]; }catch(e){}
  return n;
}
function ighoPid(h){ return h.hid||h.id||h.name; }

/* ---- asset loading: 14.5 MB recipe table + 150 KB engine, fetched once, then cached by the browser */
function ighoLoadScript(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.async=true; s.onload=res; s.onerror=function(){rej(new Error('failed '+src));}; document.head.appendChild(s); }); }
function ighoEnsureEngine(){
  if(IGHO.ready) return Promise.resolve();
  if(IGHO.loading) return IGHO.loading;
  /* the engine's export line reads HOV and hovStock at load time — define both BEFORE it arrives */
  window.HOV=window.HOV||{days:[],closed:'',pname:{},pax:{},tab:{},shiftEvening:{}};
  if(typeof window.hovStock!=='function'){ window.hovStock=ighoStock; }
  IGHO.loading=ighoLoadScript(IGHO_ASSET+'igho-needs.js')
    .then(function(){ return ighoLoadScript(IGHO_ASSET+'igho-engine.js'); })
    .then(function(){ return fetch(IGHO_ASSET+'recipe-videos.generated.json',{cache:'force-cache'}).then(function(r){return r.ok?r.json():{};}).catch(function(){return {};}); })
    .then(function(v){ IGHO.videos=v||{}; IGHO.ready=true; })
    .catch(function(e){ IGHO.err=String(e&&e.message||e); IGHO.loading=null; throw e; });
  return IGHO.loading;
}

/* ---- stock pool from THIS app's board. Rule 46 shape: {n,k,qty,unit,expired,expQty}.
   Rule 126: a row past its shelf window is zeroed but its amount kept on expQty, so the board can say
   "EXPIRED — bin then buy" instead of "not available". Shelf + age come from this app's Master FnV. */
function ighoStock(h){
  var out=[],seen={};
  try{
    var rows=(typeof allStock==='function')?allStock(h):itemsOf(h);
    var today=istToday();
    rows.forEach(function(r){
      var n=String(r.n||r.name||'').trim(); if(!n||seen[n]) return; seen[n]=1;
      var q=(+r.qty||+r.q||0); if(!(q>0)) return;
      var u=r.unit||r.u||'g';
      var exp=false;
      try{ var sh=(typeof ppShelfG==='function')?ppShelfG(n):null; var age=(typeof ageOf==='function')?ageOf(r):null;
           if(sh&&age!=null&&age>sh) exp=true; }catch(e){}
      out.push({n:n,k:n.toLowerCase(),qty:(exp?0:q),unit:u,expired:exp,expQty:(exp?q:0)});
    });
  }catch(e){ try{console.error('ighoStock',e);}catch(_){} }
  return out;
}

/* ---- ISO week helpers (the API needs YYYY-Www; we never derive a day's date from it — Rule 4) */
function ighoISOWeek(d){ var t=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())); var dn=t.getUTCDay()||7; t.setUTCDate(t.getUTCDate()+4-dn); var y0=new Date(Date.UTC(t.getUTCFullYear(),0,1)); var w=Math.ceil((((t-y0)/86400000)+1)/7); return t.getUTCFullYear()+'-W'+String(w).padStart(2,'0'); }
function ighoAddDays(iso,n){ var d=new Date(iso+'T00:00:00'); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function ighoDow(iso){ return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date(iso+'T00:00:00').getDay()]; }
function ighoLabel(iso){ var d=new Date(iso+'T00:00:00'); return ighoDow(iso)+' '+d.getDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()]; }

/* ---- closed-through date for THIS household = latest Meals close on its ledger; window = 7 days after */
function ighoClosed(h){
  var mx='';
  try{ (h.meals||[]).forEach(function(m){ var d=String(m.date||'').slice(0,10); if(d>mx) mx=d; }); }catch(e){}
  if(!mx){ mx=ighoAddDays(istToday(),-1); }
  return mx;
}
function ighoDays(h){ var c=ighoClosed(h), out=[]; for(var i=1;i<=7;i++){ var iso=ighoAddDays(c,i); out.push([ighoDow(iso),ighoLabel(iso),iso]); } return out; }

/* ---- plan fetch: one call per ISO week the window touches; 24 h localStorage cache, stale-while-revalidate.
   The endpoint can take ~30 s cold — the UI shows a loading state and never blocks the rest of the app. */
function ighoPlanKey(name,week){ return 'igho_plan_'+name+'_'+week; }
function ighoFetchPlan(name,week){
  var k=ighoPlanKey(name,week), cached=null;
  try{ var raw=localStorage.getItem(k); if(raw){ cached=JSON.parse(raw); } }catch(e){}
  var fresh= cached && (Date.now()-(cached.__at||0) < 24*3600*1000);
  var p= fresh ? Promise.resolve(cached.plan) :
    fetch(IGHO_BASE+'/plans?household='+encodeURIComponent(name)+'&week='+encodeURIComponent(week),{cache:'no-store'})
      .then(function(r){ if(r.status===404) return null; if(!r.ok) throw new Error('planner '+r.status); return r.json(); })
      .then(function(j){ try{ localStorage.setItem(k,JSON.stringify({__at:Date.now(),plan:j})); }catch(e){} return j; })
      .catch(function(e){ if(cached) return cached.plan; throw e; });
  return p;
}
function ighoLoadPlans(h){
  var name=ighoPlannerName(h), days=ighoDays(h), weeks={};
  days.forEach(function(d){ weeks[ighoISOWeek(new Date(d[2]+'T00:00:00'))]=1; });
  /* the as-of (past night) view may need an earlier week too */
  if(IGHO.asOf) weeks[ighoISOWeek(new Date(IGHO.asOf+'T00:00:00'))]=1;
  var ws=Object.keys(weeks);
  return Promise.all(ws.map(function(w){ return ighoFetchPlan(name,w).then(function(p){ IGHO.plans[name+'|'+w]=p; }); }));
}
function ighoDayFromPlans(h,iso){
  var name=ighoPlannerName(h), w=ighoISOWeek(new Date(iso+'T00:00:00')), p=IGHO.plans[name+'|'+w];
  if(!p||!p.days) return null;
  for(var i=0;i<p.days.length;i++){ if(String(p.days[i].date)===iso) return {day:p.days[i],plan:p}; }   /* Rule 4: match by DATE */
  return null;
}

/* ---- slot text for the engine. The pack's splitter expects the WHOLE slot as one text (it handles
   "Disha: … / Anirudh: …" person tags and per-dish counts itself). For a `known:true` dish the name
   is already clean; for the rest we pass the typed line unchanged (Rule 1 says never re-parse `text`,
   but the splitter is what the planner's own /api/v1 pre-parse could not do for free-text estates). */
var IGHO_SLOT={breakfast:'B',lunch:'L',snacks:'S',dinner:'D'};
function ighoSlotEntries(meal){
  var lines=[], carry=[], prep=[];
  (meal.dishes||[]).forEach(function(d){
    var t=String(d.text||d.name||'').trim(); if(!t) return;
    /* Rule 3: people:0 is real data — a carry-over served but not cooked today. Show it; never price it. */
    if(+d.people===0){ carry.push(d); return; }
    if(d.known&&d.recipe&&d.recipe.prep_ahead&&d.recipe.prep_ahead.length){ d.recipe.prep_ahead.forEach(function(a){ prep.push({action:a.action,ingredient:a.ingredient,detail:a.detail,dish:d.name}); }); }
    /* a per-dish count wins over the meal count (Rule 2: `people` is already resolved) */
    var line=(d.known?d.name:t);
    if(d.people_from==='dish'&&+d.people>0&&+d.people!==+meal.people) line+=' x'+d.people;
    lines.push(line);
  });
  return {text:lines.join('\n'), carry:carry, prep:prep};
}

/* ---- Rule 191 evening shift: a shift household's board date is one cook's visit = D-1 dinner (+snack) + D breakfast/lunch */
function ighoShiftOn(h,iso){ var from=IGHO.shiftEvening[ighoPid(h)]||IGHO.shiftEvening[h.name]; return !!(from&&iso>=from); }

/* ---- build slots for one board date, then simulate against `sim` (mutated — the week carries forward) */
function ighoBuildDay(h,iso,sim){
  var pid=ighoPid(h), out={B:[],L:[],D:[],S:[]}, meta={B:null,L:null,D:null,S:null}, missing=[];
  var srcDay=ighoDayFromPlans(h,iso), dinnerSrc=srcDay, shift=ighoShiftOn(h,iso);
  if(shift){ dinnerSrc=ighoDayFromPlans(h,ighoAddDays(iso,-1)); }
  if(!srcDay&&!dinnerSrc) return {slots:null,meta:meta,missing:[iso]};
  var meals=[];
  if(srcDay) srcDay.day.meals.forEach(function(m){ if(m.slot==='breakfast'||m.slot==='lunch'||(!shift&&(m.slot==='snacks'||m.slot==='dinner'))) meals.push(m); });
  if(shift&&dinnerSrc) dinnerSrc.day.meals.forEach(function(m){ if(m.slot==='dinner'||m.slot==='snacks') meals.push(m); });   /* the snack moves WITH the dinner, and is removed when D-1 carries none */
  meals.forEach(function(m){
    var sl=IGHO_SLOT[m.slot]; if(!sl) return;
    var e=ighoSlotEntries(m);
    meta[sl]={name:m.name,people:m.people,planned:m.planned,night_before:m.night_before||'',carry:e.carry,prep:e.prep,dishes:m.dishes||[]};
    if(!m.planned||!e.text) return;
    try{ out[sl]=hovSlotDishes(e.text, +m.people||h.people||1, pid); }catch(err){ out[sl]=[{dish:e.text,rows:[],gap:true}]; }
  });
  var res=hovSimDay(out,sim);
  return {slots:res.slots,buy:res.buy,meta:meta,missing:[]};
}

/* ---- recipe video: the API's own link first (Rule 6: guard every recipe field), else the pack's table by dish name */
function ighoVideo(dishName,meta){
  try{
    var dn=String(dishName||'').toLowerCase();
    if(meta&&meta.dishes){ for(var i=0;i<meta.dishes.length;i++){ var d=meta.dishes[i]; if(d&&d.recipe&&d.recipe.video_url&&String(d.name||'').toLowerCase().indexOf(dn)>=0) return d.recipe.video_url; } }
    var v=IGHO.videos||{}; if(v[dn]) return v[dn]; if(v[dishName]) return v[dishName];
    for(var k in v){ if(k.toLowerCase()===dn) return v[k]; }
  }catch(e){}
  return null;
}

/* ---- status → chip class / word (same four words as the pack's Excel) */
function ighoStatusWord(st){ return st==='ok'?'Available':st==='short'?'Low':st==='unit'?'Unit clash':'Not available'; }
function ighoStatusCls(st){ return st==='ok'?'igho-ok':st==='short'?'igho-low':st==='unit'?'igho-unit':'igho-no'; }

/* ---- main view */
function ighoView(){
  var h=cur(); if(!h) return '<div class="card"><h2>IGHO</h2><div class="note">Pick a household.</div></div>';
  var name=ighoPlannerName(h);
  if(!IGHO.ready){
    if(!IGHO.err){ ighoEnsureEngine().then(function(){ return ighoLoadPlans(h); }).then(function(){ paint(); }).catch(function(){ paint(); }); }
    return '<div class="card"><div class="eyebrow">'+esc(h.name)+' · IGHO</div><h2>Ingredient handover</h2>'+
      (IGHO.err?'<div class="note" style="color:#c0392b">Engine failed to load: '+esc(IGHO.err)+' — check that /private/igho/ assets are deployed. <button class="btn" onclick="IGHO.err=null;paint()">Retry</button></div>'
              :'<div class="note">Loading the recipe engine (≈15 MB, first time only) and this week\'s plan from Menu Planner… the planner can take up to 30 s to wake.</div>')+'</div>';
  }
  var days=ighoDays(h), needPlans=false;
  days.forEach(function(d){ if(!ighoDayFromPlans(h,d[2])&&!IGHO.plans.hasOwnProperty(name+'|'+ighoISOWeek(new Date(d[2]+'T00:00:00')))) needPlans=true; });
  if(needPlans){ ighoLoadPlans(h).then(function(){paint();}).catch(function(e){ IGHO.planErr=String(e&&e.message||e); paint(); }); }

  /* day selection: default = the first open day; quick picks */
  var sel=IGHO.sel[h.id]||{}; if(!Object.keys(sel).length){ sel[days[0][2]]=1; IGHO.sel[h.id]=sel; }
  var selDays=days.filter(function(d){return sel[d[2]];});

  /* as-of (past night): render the ledger for that date instead of a simulation */
  if(IGHO.asOf){ return ighoAsOfView(h,IGHO.asOf,days); }

  /* simulate ALL 7 days in order on one pool (Rule: each meal eats what the last one left), render only the selected */
  var sim=ighoStock(h), byDay={}, cart={}, anyMissing=[];
  days.forEach(function(d){
    var r=ighoBuildDay(h,d[2],sim); byDay[d[2]]=r; if(r.missing.length) anyMissing=anyMissing.concat(r.missing);
    if(sel[d[2]]&&r.slots){ (r.buy||[]).forEach(function(b){ var k=b.n.toLowerCase(); if(!cart[k]) cart[k]={n:b.n,q:0,u:b.u,days:{}}; cart[k].q+=b.q; cart[k].days[d[0]]=(cart[k].days[d[0]]||0)+b.q; }); }
  });

  var html='<div class="card"><div class="eyebrow">'+esc(h.name)+' · IGHO · planner: '+esc(name)+'</div><h2>Ingredient handover</h2>';
  html+='<div class="note">how much is needed · how much is here · what is it for — built from Menu Planner <code>/api/v1</code> and this board. Closed through <b>'+esc(ighoClosed(h))+'</b>; the seven days after are open and simulated in order.</div>';
  /* day strip */
  html+='<div class="hovdays" style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0">';
  days.forEach(function(d){ var has=!!ighoDayFromPlans(h,d[2]); html+='<button class="chip '+(sel[d[2]]?'on':'')+'" style="'+(has?'':'opacity:.55')+'" onclick="ighoToggle(\''+h.id+'\',\''+d[2]+'\')" title="'+(has?'planned':'no plan on the planner for this date')+'">'+esc(d[1])+(has?'':' · —')+'</button>'; });
  html+='<button class="btn ghost" onclick="ighoPick(\''+h.id+'\',\'today\')">Today</button><button class="btn ghost" onclick="ighoPick(\''+h.id+'\',\'tomorrow\')">Tomorrow</button><button class="btn ghost" onclick="ighoPick(\''+h.id+'\',\'all\')">All 7</button>';
  html+='<label class="note" style="margin-left:auto">as at 23:30 on <input type="date" value="" onchange="ighoSetAsOf(this.value)" style="font:inherit"></label></div>';
  if(IGHO.planErr) html+='<div class="note" style="color:#c0392b">Planner: '+esc(IGHO.planErr)+' (showing cached plan if any)</div>';
  if(anyMissing.length) html+='<div class="note" style="color:#b7791f">No plan on the planner for: '+anyMissing.map(ighoLabel).join(', ')+' — left blank, loudly, rather than filled from the wrong week.</div>';
  html+='<div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"><button class="btn" onclick="ighoExportXlsx()">⬇ Export to Excel</button><button class="btn ghost" onclick="ighoCopyCart()">Copy cart</button><button class="btn ghost" onclick="ighoRefresh()">⟳ Refresh plan</button></div>';
  html+='</div>';

  /* per-day boards */
  selDays.forEach(function(d){
    var r=byDay[d[2]];
    html+='<div class="card"><div class="eyebrow">'+esc(d[1])+(ighoShiftOn(h,d[2])?' · evening shift (D-1 dinner + D breakfast/lunch)':'')+'</div>';
    if(!r||!r.slots){ html+='<div class="note">No plan on the planner for this date.</div></div>'; return; }
    [['B','Breakfast'],['L','Lunch'],['S','Evening Snacks'],['D','Dinner']].forEach(function(sl){
      var m=r.meta[sl[0]], entries=r.slots[sl[0]]||[];
      html+='<h3 style="margin:14px 0 4px">'+sl[1]+(m&&m.people?' <span class="note">· '+m.people+' people</span>':'')+(m&&!m.planned?' <span class="note">· not planned</span>':'')+'</h3>';
      if(m&&m.night_before) html+='<div class="note" style="background:#fffaf0;border:1px solid #f0d9a8;padding:6px 8px;border-radius:6px">🌙 Night before: '+esc(m.night_before)+'</div>';
      if(m&&m.prep&&m.prep.length){ html+='<div class="note">Prep ahead: '+m.prep.map(function(p){ return '<span class="chip">'+esc(p.action)+(p.ingredient?' '+esc(p.ingredient):'')+(p.detail?' · '+esc(p.detail):'')+'</span>'; }).join(' ')+'</div>'; }
      if(m&&m.carry&&m.carry.length){ m.carry.forEach(function(c){ html+='<div class="note">↩ <b>'+esc(c.name)+'</b>'+(c.note?' · '+esc(c.note):'')+' — carry over, served not cooked today (not priced)</div>'; }); }
      if(!entries.length){ if(m&&m.planned) html+='<div class="note">(nothing priced)</div>'; return; }
      entries.forEach(function(e){
        var yt=ighoVideo(e.dish,m);
        /* the cook's remark (note) sits next to the dish — Rule: it is instruction, not decoration */
        var note=''; try{ (m.dishes||[]).forEach(function(d){ if(d.note&&String(d.name||'').toLowerCase().indexOf(String(e.dish).toLowerCase())>=0) note=d.note; }); }catch(_){}
        html+='<div style="margin:8px 0 2px"><b>'+esc(e.dish)+'</b>'+(note?' <span class="chip" style="background:#fff3cd">'+esc(note)+'</span>':'')+(yt?' <a href="'+esc(yt)+'" target="_blank" rel="noopener" title="recipe video">▶</a>':'')+(e.gap?' <span class="chip" style="background:#f8d7da">No recipe — nothing priced</span>':'')+'</div>';
        if(!e.rows.length) return;
        html+='<table class="igho"><thead><tr><th>Ingredient</th><th>Need</th><th>Status</th><th>On the shelf as</th></tr></thead><tbody>';
        e.rows.forEach(function(x){ html+='<tr><td>'+esc(x.n)+(x.opt?' <span class="note">('+esc(x.opt)+')</span>':'')+'</td><td>'+esc(hovQ(x.q,x.u))+'</td><td><span class="chip '+ighoStatusCls(x.st)+'">'+esc(ighoStatusWord(x.st))+'</span> <span class="note">'+esc(x.lab||'')+'</span></td><td class="note">'+esc(x.via||'')+'</td></tr>'; });
        html+='</tbody></table>';
      });
    });
    html+='</div>';
  });

  /* cart */
  var ck=Object.keys(cart).sort();
  html+='<div class="card"><div class="eyebrow">Cart · '+ck.length+' items · '+selDays.map(function(d){return d[0];}).join(', ')+'</div><h2>To buy</h2>';
  if(!ck.length) html+='<div class="note">Nothing to buy for the selected days.</div>';
  else { html+='<table class="igho"><thead><tr><th>Item</th><th>To buy</th><th>By day</th></tr></thead><tbody>'; ck.forEach(function(k){ var c=cart[k]; html+='<tr><td>'+esc(c.n)+'</td><td><b>'+esc(hovQ(c.q,c.u))+'</b></td><td class="note">'+Object.keys(c.days).map(function(d){return d+' '+hovQ(c.days[d],c.u);}).join(' · ')+'</td></tr>'; }); html+='</tbody></table>'; }
  html+='</div>';
  IGHO._last={h:h,days:selDays,byDay:byDay,cart:cart};
  return html;
}

/* ---- as-of (past night): a closed day replays the LEDGER, never a re-simulation (pack §4.6) */
function ighoAsOfView(h,iso,days){
  var html='<div class="card"><div class="eyebrow">'+esc(h.name)+' · IGHO · as at 23:30 on '+esc(iso)+'</div><h2>Ingredient handover — closed day</h2>';
  html+='<div class="note">This date is closed. What came off the shelf is what the ledger says; re-simulating would not change it. <button class="btn ghost" onclick="ighoSetAsOf(\'\')">Back to open days</button></div>';
  var lines=[]; try{ (h.deductions||[]).forEach(function(x){ if(String(x.date||'').slice(0,10)===iso) lines.push(x); }); }catch(e){}
  if(!lines.length) html+='<div class="note">No ledger lines for this date on this board.</div>';
  else{ var by={}; lines.forEach(function(x){ var k=x.dish||'—'; (by[k]=by[k]||[]).push(x); });
    Object.keys(by).forEach(function(dish){ html+='<div style="margin:8px 0 2px"><b>'+esc(dish)+'</b></div><table class="igho"><thead><tr><th>Ingredient</th><th>Taken</th><th>Before → after</th><th>Reason</th></tr></thead><tbody>';
      by[dish].forEach(function(x){ html+='<tr><td>'+esc(x.sku||x.item||'')+'</td><td>'+esc(String(x.qty||0)+' '+(x.unit||''))+'</td><td class="note">'+esc(String(x.before||'')+' → '+String(x.after||''))+'</td><td class="note">'+esc(x.reason||x.why||'')+'</td></tr>'; }); html+='</tbody></table>'; }); }
  return html+'</div>';
}

/* ---- interactions */
function ighoToggle(hid,iso){ var s=IGHO.sel[hid]||(IGHO.sel[hid]={}); if(s[iso]) delete s[iso]; else s[iso]=1; if(!Object.keys(s).length) s[iso]=1; paint(); }
function ighoPick(hid,which){ var h=cur(), days=ighoDays(h), s={}; var t=istToday(), tm=ighoAddDays(t,1);
  if(which==='all') days.forEach(function(d){s[d[2]]=1;}); else if(which==='today'){ s[t]=1; } else { s[tm]=1; }
  if(!days.some(function(d){return s[d[2]];})) s[days[0][2]]=1; IGHO.sel[hid]=s; paint(); }
function ighoSetAsOf(v){ IGHO.asOf=v||null; if(v){ var h=cur(); ighoLoadPlans(h).then(paint).catch(paint); } paint(); }
function ighoRefresh(){ var h=cur(), name=ighoPlannerName(h); try{ for(var i=localStorage.length-1;i>=0;i--){ var k=localStorage.key(i); if(k&&k.indexOf('igho_plan_'+name)===0) localStorage.removeItem(k); } }catch(e){} IGHO.plans={}; IGHO.planErr=null; toast('Refreshing plan from Menu Planner…'); ighoLoadPlans(h).then(paint).catch(function(e){IGHO.planErr=String(e);paint();}); }
function ighoCopyCart(){ var L=IGHO._last; if(!L) return; var ck=Object.keys(L.cart).sort(); var txt=ck.map(function(k){var c=L.cart[k];return c.n+' — '+hovQ(c.q,c.u)+' ('+Object.keys(c.days).join(', ')+')';}).join('\n'); try{ navigator.clipboard.writeText(txt); toast('Cart copied ('+ck.length+' items)'); }catch(e){ prompt('Copy:',txt); } }

/* ---- Excel: the pack's exact columns/colours (handover-workbook.ts), one sheet per selected day */
function ighoExportXlsx(){
  var L=IGHO._last; if(!L||typeof XLSX==='undefined'){ toast('Nothing to export yet'); return; }
  var FILL={ok:'E8F0E8',short:'FBEFD6',no:'FBE3E0',unit:'EFF1EE'};
  var HEAD=['Status','Ingredient','Unit','Required','In kitchen','To buy','Built on','Past use-by','On the shelf as','For which dishes'];
  var wb=XLSX.utils.book_new();
  L.days.forEach(function(d){
    var r=L.byDay[d[2]]; var rows=[HEAD]; if(!r||!r.slots){ rows.push(['No plan','','','','','','','','','']); }
    else [['B','Breakfast'],['L','Lunch'],['S','Snacks'],['D','Dinner']].forEach(function(sl){ (r.slots[sl[0]]||[]).forEach(function(e){ e.rows.forEach(function(x){
      var have=(x.st==='unit')?'':( x.st==='ok'?x.q : (x.lab&&/have ([\d.]+)/.test(x.lab)? +RegExp.$1 : 0) );
      var toBuy=(x.st==='ok'||x.st==='unit')?'':(x.st==='short'?Math.round((x.q-(+have||0))*10)/10:x.q);
      var pastUse=(/EXPIRED/.test(x.lab||'')? (x.lab.match(/([\d.]+ ?\w+) on the shelf/)||['',''])[1] : '');
      rows.push([ighoStatusWord(x.st),x.n,(x.u==='pcs'||x.u==='pc')?'pc':(x.u||'g'),Math.round(x.q*10)/10,have,toBuy,d[2],pastUse,x.via||'',sl[1]+' · '+e.dish]);
    }); }); });
    var ws=XLSX.utils.aoa_to_sheet(rows); ws['!cols']=[14,30,7,10,11,10,9,12,34,52].map(function(w){return {wch:w};});
    ws['!autofilter']={ref:'A1:J'+rows.length};
    XLSX.utils.book_append_sheet(wb,ws,(d[1]).replace(/[\[\]:*?\/\\]/g,' ').slice(0,31));
  });
  XLSX.writeFile(wb,'Ingredient_handover_'+String(L.h.name).replace(/[^A-Za-z0-9]+/g,'_')+'_'+L.days.map(function(d){return d[0];}).join('-')+'.xlsx');
}
