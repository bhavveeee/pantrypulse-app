#!/usr/bin/env python3
"""Push the full PantryPulse codebase to GitHub for the tech team to review.
Organizes source files under src/ and writes a README. Uses the git Trees API to
commit everything in one atomic commit. Run standalone, or import push_codebase()
to chain it onto every board push so the code view stays current daily."""
import base64,json,urllib.request,importlib.util,os,time
spec=importlib.util.spec_from_file_location('pp','/mnt/user-data/outputs/pp_git_push.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
API=f"https://api.github.com/repos/{m.OWNER_REPO}"
HDR={"Authorization":"Bearer "+m.TOK,"Accept":"application/vnd.github+json","User-Agent":"pp-codebase"}

# map: local path -> repo path under src/
SRC={
 "/home/claude/igho-engine.js":"src/engine/igho-engine.js",
 "/home/claude/igho-tab.js":"src/engine/igho-tab.js",
 "/home/claude/igho_matcher.js":"src/engine/igho-matcher.js",
 "/home/claude/igho_hovhelpers.js":"src/engine/igho-hovhelpers.js",
 "/home/claude/igho_route.js":"src/api/igho-route.js",
 "/home/claude/menuplan.js":"src/api/menuplan.js",
 "/home/claude/recipes.js":"src/api/recipes.js",
 "/home/claude/handover_xlsx.js":"src/api/handover-xlsx.js",
 "/home/claude/next.config.js":"src/next.config.js",
 "/home/claude/srv.py":"src/server/srv.py",
 "/home/claude/pp_guard.py":"src/ops/pp_guard.py",
 "/home/claude/pp_git_push.py":"src/ops/pp_git_push.py",
 "/home/claude/push_asset.py":"src/ops/push_asset.py",
 "/home/claude/perish_ow.py":"src/ops/perish_ow.py",
 "/home/claude/setonly2.py":"src/ops/setonly2.py",
 "/mnt/user-data/outputs/ppsplit.js":"src/engine/ppsplit.js",
 "/mnt/user-data/outputs/pp_rows.py":"src/ops/pp_rows.py",
 "/mnt/user-data/outputs/pp_snapshot.py":"src/ops/pp_snapshot.py",
}
# igho recipe-needs assets
IGHO_DIR="/home/claude/igho_assets"
if os.path.isdir(IGHO_DIR):
    for f in os.listdir(IGHO_DIR):
        if f.endswith('.js') or f.endswith('.json'): SRC[os.path.join(IGHO_DIR,f)]=f"src/engine/needs/{f}"


# spec pack (product/feature specs) -> docs/specs/
import glob as _glob
for _f in _glob.glob('/mnt/user-data/outputs/pp_spec/*.md'):
    SRC[_f]=f"docs/specs/{os.path.basename(_f)}"
# the live deployed app (single self-contained file) -> app/pantrypulse.html
if os.path.exists('/mnt/user-data/outputs/pantry-pulse_2026-08-17_EOD.html'):
    SRC['/mnt/user-data/outputs/pantry-pulse_2026-08-17_EOD.html']='app/pantrypulse.html'

def _get_json(url):
    return json.load(urllib.request.urlopen(urllib.request.Request(url,headers=HDR),timeout=120))
def _post(url,body):
    return json.load(urllib.request.urlopen(urllib.request.Request(url,data=json.dumps(body).encode(),method="POST",headers={**HDR,"Content-Type":"application/json"}),timeout=300))
def _patch(url,body):
    return json.load(urllib.request.urlopen(urllib.request.Request(url,data=json.dumps(body).encode(),method="PATCH",headers={**HDR,"Content-Type":"application/json"}),timeout=300))

README="""# PantryPulse — Codebase

Source of the PantryPulse multi-household kitchen-inventory & meal-prep operating system.
This mirror is updated on every production push so the tech team always sees current code.

## Layout
- `src/engine/`   IGHO engine: dish splitter, ingredient matcher/resolver, hov helpers, per-need recipe assets
- `src/api/`      Server routes: menu-planner proxy, live recipe bake, handover Excel export, igho asset route
- `src/ops/`      Operational tooling: write-guard (duplicate/unit-twin prevention), push/publish pipeline, snapshot writer, perishable-overwrite + set helpers, header-aware row iterator
- `src/server/`   Dev server
- The deployed app itself is the single self-contained file at `private/pantrypulse.html` (dataset embedded, auth-gated).

## Key modules
- **igho-engine / igho-matcher** — four-tier fuzzy dish lookup, synonym + product-family + form + distinct-qualifier guards.
- **pp_guard** — the integrity layer: canonical row resolution (no g/pc twins), conservative merge, push-time duplicate audit, shelf-stable protection.
- **menuplan / recipes** — read-only, credentialed pulls from the meal planner and the live recipe sheet (keys held server-side).
- **pp_git_push / push_asset** — versioned publish: build-id stamp, board snapshot, boot test, atomic upload.

## Full model contents
- `app/pantrypulse.html`  the deployed application (dataset embedded, auth-gated)
- `src/`   all source (engine, api, ops, server)
- `data/ledgers/`   orders, deductions, meals, history, change_log, inventory_checks (full audit trail)
- `data/reference/`   index, master_fnv (2,022-SKU catalogue), sku_knowledge, dishes_library, shelf_life_rules, conversions, ingredient_map, deduction_method, subscriptions
- `data/households/`   every household board (current stock)
- `data/snapshots/`   board_snapshots (immutable historical boards)
- `docs/specs/`   product & feature specs (deduction logic, portion calibration, PP Ask, Master FnV, snapshots, freshness, use-priority, handover, recipe fetching)

_Last synced: %s_
""" % time.strftime("%Y-%m-%d %H:%M IST", time.gmtime(time.time()+19800))

def push_codebase(extra_msg=""):
    # 1) latest commit + base tree on branch
    ref=_get_json(f"{API}/git/ref/heads/{m.BRANCH}")
    head_sha=ref["object"]["sha"]
    base_commit=_get_json(f"{API}/git/commits/{head_sha}")
    base_tree=base_commit["tree"]["sha"]
    # 2) create blobs
    tree=[]
    for local,repo in SRC.items():
        if not os.path.exists(local): continue
        raw=open(local,'rb').read()
        blob=_post(f"{API}/git/blobs",{"content":base64.b64encode(raw).decode(),"encoding":"base64"})
        tree.append({"path":repo,"mode":"100644","type":"blob","sha":blob["sha"]})
    # exported data (ledgers, reference incl Master FnV, per-household boards, snapshots)
    try:
        import subprocess as _sp2
        _sp2.run(["python3","/home/claude/pp_export_data.py"],capture_output=True,timeout=300)
    except Exception as _e:
        print("data export skipped:",_e)
    _DATA="/tmp/pp_data"
    if os.path.isdir(_DATA):
        for _root,_dirs,_fs in os.walk(_DATA):
            for _fn in _fs:
                _lp=os.path.join(_root,_fn); _rp="data/"+os.path.relpath(_lp,_DATA)
                _raw=open(_lp,"rb").read()
                _bl=_post(f"{API}/git/blobs",{"content":base64.b64encode(_raw).decode(),"encoding":"base64"})
                tree.append({"path":_rp,"mode":"100644","type":"blob","sha":_bl["sha"]})
    # README
    rb=_post(f"{API}/git/blobs",{"content":base64.b64encode(README.encode()).decode(),"encoding":"base64"})
    tree.append({"path":"src/README.md","mode":"100644","type":"blob","sha":rb["sha"]})
    # 3) new tree on top of base (preserves private/pantrypulse.html etc.)
    new_tree=_post(f"{API}/git/trees",{"base_tree":base_tree,"tree":tree})
    # 4) commit + move ref
    msg="chore: sync codebase for tech-team review"+((" — "+extra_msg) if extra_msg else "")
    commit=_post(f"{API}/git/commits",{"message":msg,"tree":new_tree["sha"],"parents":[head_sha]})
    _patch(f"{API}/git/refs/heads/{m.BRANCH}",{"sha":commit["sha"]})
    print(f"CODEBASE PUSHED: {len(tree)} files -> {commit['sha'][:10]}")
    return commit["sha"]

if __name__=="__main__":
    import sys
    push_codebase(sys.argv[1] if len(sys.argv)>1 else "")
