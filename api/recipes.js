// /api/recipes — LIVE recipe table baked from the published "final recipes" sheet on every request (10-min cache).
// SINGLE SOURCE OF TRUTH (19-Sep-2026): no Rasoi, no text-derived breakdowns, no pack estate bake.
// Returns JavaScript that declares PP_NEEDS (engine shape), PP_RECIPE_META (video + prep flags), PP_SHEET_UOM_LIVE (pcs items).
const PUB = "https://docs.google.com/spreadsheets/d/e/2PACX-1vT3qoSEl31L3rAD-dTYqF3J-es2bDZ-K26WcZPaU_gMxw8vjKH4cOU_f0kAXTBKJb6gY4hW4Er21VRW/pub?single=true&output=csv&gid=";
const GID_OVERVIEW = "0", GID_BREAKDOWN = "1292717284";
const TTL = 10 * 60 * 1000; const PAX_MAX = 12;
let cache = { at: 0, body: "", dishes: 0, rows: 0 };

function parseCsv(t){ const rows=[]; let row=[], f="", q=false;
  for (let i=0;i<t.length;i++){ const c=t[i];
    if(q){ if(c==='"'){ if(t[i+1]==='"'){ f+='"'; i++; } else q=false; } else f+=c; }
    else { if(c==='"') q=true; else if(c===','){ row.push(f); f=""; } else if(c==='\n'){ row.push(f); rows.push(row); row=[]; f=""; } else if(c!=='\r') f+=c; } }
  if(f||row.length){ row.push(f); rows.push(row); } return rows; }
const SYN = {avacado:"avocado",panir:"paneer",biriyani:"biryani",tamato:"tomato",capsicdum:"capsicum"};
function singular(w){ return w.replace(/ies$/,"y").replace(/([^s])s$/,"$1"); }
function norm(dish){ return dish.toLowerCase().replace(/\(.*?\)/g," ").replace(/[^a-z0-9 ]/g," ").split(/\s+/).filter(Boolean).map(w=>SYN[w]||singular(w)).join(" ").trim(); }
const STOP = new Set(["the","and","with","of","fresh","dried","dry","powder","whole","chopped","sliced","grated","boneless","skinless","large","small","medium","red","green","yellow","white","black","raw","cooked","leaves","leaf","seeds","seed","paste","oil","for","or"]);
function keywords(label){ const w=String(label).toLowerCase().replace(/\(.*?\)/g," ").replace(/[^a-z ]/g," ").split(/\s+/).filter(x=>x.length>=3&&!STOP.has(x)); const out=[]; if(w.length){ out.push(w.join(" ")); w.forEach(x=>{ if(!out.includes(x)) out.push(x); }); } return out.length?out:[String(label).toLowerCase().trim()]; }
function role(cls){ cls=String(cls||"").toLowerCase(); if(cls.startsWith("hero")) return "hero"; if(cls.startsWith("fat")) return "fat"; if(cls.startsWith("garnish")) return "garnish"; return "base"; }
function isOpt(cls){ return /optional/i.test(String(cls||"")); }
function unit(u){ u=String(u||"g").trim().toLowerCase(); return u==="pcs"||u==="pc"||u==="piece"||u==="pieces"?"pcs":(u==="ml"||u==="l"?"ml":"g"); }

async function build(){
  const [ov,bd]=await Promise.all([fetch(PUB+GID_OVERVIEW).then(r=>r.text()), fetch(PUB+GID_BREAKDOWN).then(r=>r.text())]);
  const O=parseCsv(ov), B=parseCsv(bd);
  const video={}; for(const r of O.slice(1)){ if(r[0]&&r[1]){ const d=r[0].trim().toLowerCase(); video[d]=r[1].trim(); video[d.replace(/\(.*?\)/g," ").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim()]=r[1].trim(); video[norm(r[0])]=r[1].trim(); } }
  const hdr=B[0].map(x=>String(x).trim().toLowerCase()); const col=n=>hdr.indexOf(n);
  const cD=col("dish"), cI=col("ingredient"), cQ=col("per adult"), cU=col("unit"), cC=col("class"), cY=col("youtube video link"), cS=col("soaking"), cM=col("marination"), cR=col("resting"), cSrc=col("source of breakdown");
  const needs={}, meta={}, uom={}; let rows=0;
  for(const r of B.slice(1)){
    const dish=String(r[cD]||"").trim(); const ing=String(r[cI]||"").trim(); if(!dish||!ing) continue;
    const dkeys=[dish.toLowerCase(), dish.toLowerCase().replace(/\(.*?\)/g," ").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim(), norm(dish)];
    const q=parseFloat(String(r[cQ]||"").replace(/[^0-9.]/g,"")); if(!(q>=0)) continue;
    const u=unit(r[cU]); const cls=r[cC];
    const dks=[...new Set(dkeys)];
    for(const key of dks){
      if(!needs[key]) needs[key]={lines:[],q:[],units:[],_per:[]};
      needs[key].lines.push([ing, keywords(ing), role(cls), isOpt(cls)?"opt":null, false]);
      needs[key].units.push(u); needs[key]._per.push(q);
      if(!meta[key]) meta[key]={yt:(r[cY]||video[dks[0]]||"").trim(), soak:[], marinate:[], rest:[], src:String(r[cSrc]||"").trim()};
      if(/^yes/i.test(r[cS]||"")) meta[key].soak.push(ing); if(/^yes/i.test(r[cM]||"")) meta[key].marinate.push(ing); if(/^yes/i.test(r[cR]||"")) meta[key].rest.push(ing);
    }
    if(u==="pcs") uom[ing.toLowerCase()]="pcs";
    rows++;
  }
  for(const k in needs){ const n=needs[k]; n.q=[]; for(let p=1;p<=PAX_MAX;p++) n.q.push(n._per.map(v=>Math.round(v*p*100)/100)); delete n._per; }
  for(const k in video){ if(!meta[k]) meta[k]={yt:video[k],soak:[],marinate:[],rest:[],src:""}; else if(!meta[k].yt) meta[k].yt=video[k]; }
  const dishKeys=Object.keys(needs).filter(k=>k.indexOf("\u0001")<0);
  const body="/* live from final-recipes sheet · "+new Date().toISOString()+" · "+Object.keys(needs).length+" dishes · "+rows+" rows */\nvar PP_NEEDS="+JSON.stringify(needs)+";\nvar PP_RECIPE_META="+JSON.stringify(meta)+";\nvar PP_SHEET_UOM_LIVE="+JSON.stringify(uom)+";\nvar PP_DISH_KEYS="+JSON.stringify(dishKeys)+";\ntry{if(typeof PP_SHEET_UOM==='object')Object.assign(PP_SHEET_UOM,PP_SHEET_UOM_LIVE);}catch(e){}\n";
  return { body, dishes:Object.keys(needs).length, rows };
}
export default async function handler(req,res){
  try{
    if(Date.now()-cache.at>TTL || req.query.force==="1"){ const b=await build(); cache={at:Date.now(),...b}; }
    res.setHeader("Content-Type", req.query.format==="json"?"application/json; charset=utf-8":"application/javascript; charset=utf-8");
    res.setHeader("Cache-Control","private, max-age=300");
    res.setHeader("X-PP-Dishes",String(cache.dishes)); res.setHeader("X-PP-Rows",String(cache.rows));
    if(req.query.format==="json"){ res.status(200).send(JSON.stringify({dishes:cache.dishes,rows:cache.rows,at:cache.at})); return; }
    res.status(200).send(cache.body);
  }catch(e){ res.status(502).json({error:"sheet unreachable",detail:String(e&&e.message||e)}); }
}
export const config = { maxDuration: 60 };
