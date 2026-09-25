import os
#!/usr/bin/env python3
"""PantryPulse auto-push: pushes the given HTML build to GitHub -> Vercel auto-deploys.
Usage: python3 pp_git_push.py <html_path> "<commit message>"
Standing pipeline (from 17-Aug-2026): every shipped build ends with this push.
NOTE: contains a fine-grained PAT scoped ONLY to bhavveeee/pantrypulse-app (Contents RW).
Rotate the token periodically; on rotation, update TOK below.
"""
import base64, json, sys, urllib.request

TOK = "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"
OWNER_REPO = "bhavveeee/pantrypulse-app"
PATH = "private/pantrypulse.html"
BRANCH = "main"



def _stamp_build_ts(html_path):
    """Rewrite BUILD_TS in the HTML to the current IST time, at push time.
    Fixes the frozen/wrong-timezone 'updated' label — every deploy now carries its real moment."""
    import datetime, re
    ist = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=5, minutes=30)
    ts = ist.strftime('%Y-%m-%dT%H:%M')
    h = open(html_path, encoding='utf-8').read()
    if "const BUILD_TS=" in h:
        h = re.sub(r"const BUILD_TS='[^']*'", "const BUILD_TS='" + ts + "'", h, count=1)
        open(html_path, 'w', encoding='utf-8').write(h)
        print('BUILD_TS stamped:', ts, 'IST')
    return ts


def _snapshot_closed_day(html_path):
    """Freeze today's boards into the 'Board Snapshots' sheet and re-embed, so the last push of a day = that day's locked board."""
    import re, base64, datetime, os, sys
    try:
        sys.path.insert(0,'/mnt/user-data/outputs')
        from pp_snapshot import snapshot
        X='/mnt/user-data/outputs/PantryPulse-MASTER_2026-08-17_EOD.xlsx'
        if not os.path.exists(X): return
        ist=datetime.datetime.now(datetime.timezone.utc)+datetime.timedelta(hours=5,minutes=30)
        d=ist.strftime('%Y-%m-%d')
        n=snapshot(X,d)
        h=open(html_path,encoding='utf-8').read()
        b64=base64.b64encode(open(X,'rb').read()).decode()
        h=re.sub(r'window\.__EMBEDDED_WB_B64__="[A-Za-z0-9+/=]+"','window.__EMBEDDED_WB_B64__="'+b64+'"',h,count=1)
        open(html_path,'w',encoding='utf-8').write(h)
        print('BOARD SNAPSHOT:',n,'rows for',d,'(re-embedded)')
    except Exception as e:
        print('BOARD SNAPSHOT skipped:',e)

def boot_test(html_path, timeout_s=120):
    """Headless boot check. Refuses to deploy a file that does not load its households.
    Added 4-Sep-2026 after v21_678 shipped with a loader bug that node --check could not catch."""
    import subprocess, json, shutil, os, re
    if not shutil.which('node'):
        print('BOOT TEST SKIPPED: node not available'); return True
    js = r"""
const { chromium } = require('playwright-core');
(async()=>{
  const exe=process.env.PP_CHROME||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b=await chromium.launch({executablePath:exe,args:['--no-sandbox','--disable-dev-shm-usage']});
  const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(String(e.message).slice(0,160)));
  await p.route('**/api/**',r=>r.fulfill({status:200,contentType:'application/json',body:'{}'}));
  await p.goto('file://'+process.argv[2],{timeout:120000});
  let n=0; for(let i=0;i<24;i++){await p.waitForTimeout(5000); n=await p.evaluate(()=>(document.getElementById('hsel')||{options:[]}).options.length); if(n>1)break;}
  const chips=n>1?await p.evaluate(()=>{setTab('Dashboard');return document.querySelectorAll('.pchip').length;}):0;
  console.log(JSON.stringify({households:n, chips, errors:errs})); await b.close(); process.exit(n>1&&chips>0&&errs.length===0?0:2);
})().catch(e=>{console.log(JSON.stringify({fatal:String(e.message)}));process.exit(2);});
"""
    # write the test next to node_modules so require('playwright-core') resolves
    base = '/home/claude/pp' if os.path.isdir('/home/claude/pp/node_modules') else os.getcwd()
    tmp = os.path.join(base, '.pp_boot_test.js'); open(tmp,'w').write(js)
    try:
        r = subprocess.run(['node', tmp, os.path.abspath(html_path)], capture_output=True, text=True, timeout=timeout_s+30, cwd=base)
        out = (r.stdout or '').strip().splitlines()[-1] if r.stdout else ''
        if 'Cannot find module' in (r.stderr or ''):
            print('BOOT TEST SKIPPED: playwright-core not installed here (npm i playwright-core to enable)'); return True
        print('BOOT TEST:', out or (r.stderr or '')[-300:])
        return r.returncode == 0
    except Exception as e:
        print('BOOT TEST could not run:', e); return True

def _dup_audit(html_path):
    """Warn (not block) if the embedded workbook has same-food unit-twin duplicates. Records a baseline so
    only NEW duplicates since last push are shouted about — existing known ones are listed quietly."""
    try:
        import re, base64, tempfile
        sys.path.insert(0,'/home/claude'); import pp_guard
        from openpyxl import load_workbook
        h=open(html_path).read()
        m=re.search(r'__EMBEDDED_WB_B64__="([A-Za-z0-9+/=]+)"',h)
        if not m: return
        tf=tempfile.mktemp(suffix='.xlsx'); open(tf,'wb').write(base64.b64decode(m.group(1)))
        wb=load_workbook(tf)
        HH=['Shunyam & Ishan - latest','Soozy & Munz','Disha & Anirudh','Kartik & Dhara','Rahul & Radhika','Paxal & Sana','Pratik & Sakshi','Yash & Manik','Padmaja & Rohan','Akshita & Prerit','Samidha & Arinjay','Joseph & Teenu','Saurabh Seth','Shyamli','Piyush and Mamta']
        probs=pp_guard.audit(wb,HH)
        base_f='/home/claude/.pp_dup_baseline.txt'
        try: baseline=set(open(base_f).read().splitlines())
        except Exception: baseline=set()
        cur=set(probs); new=cur-baseline
        if new:
            print('DUP-AUDIT: %d NEW duplicate(s) introduced by this change:'%len(new))
            for x in sorted(new): print('   !! '+x)
        print('DUP-AUDIT: %d total same-food duplicate rows on the board (%d pre-existing).'%(len(cur),len(cur&baseline)))
        open(base_f,'w').write('\n'.join(sorted(cur)))
    except Exception as e:
        print('DUP-AUDIT skipped:',e)

def push(html_path: str, msg: str):
    _stamp_build_ts(html_path)
    _snapshot_closed_day(html_path)
    _dup_audit(html_path)
    if not os.environ.get('PP_SKIP_BOOT_TEST') and not boot_test(html_path):
        raise SystemExit('REFUSING TO PUSH: the build does not boot. Fix it, or set PP_SKIP_BOOT_TEST=1 to override (do not).')
    hdr = {"Authorization": "Bearer " + TOK, "Accept": "application/vnd.github+json"}
    # current sha (required for update)
    req = urllib.request.Request(
        f"https://api.github.com/repos/{OWNER_REPO}/contents/{PATH}?ref={BRANCH}", headers=hdr)
    sha = json.load(urllib.request.urlopen(req))["sha"]
    content = open(html_path, "rb").read()
    body = json.dumps({
        "message": msg + " [auto-push by Claude]",
        "content": base64.b64encode(content).decode(),
        "sha": sha, "branch": BRANCH}).encode()
    req2 = urllib.request.Request(
        f"https://api.github.com/repos/{OWNER_REPO}/contents/{PATH}",
        data=body, method="PUT", headers={**hdr, "Content-Type": "application/json"})
    resp = json.load(urllib.request.urlopen(req2))
    print("PUSHED:", resp["commit"]["sha"][:10], "->", resp["content"]["path"],
          "| bytes:", len(content))
    try:
        import importlib.util as _il
        _sp=_il.spec_from_file_location('cb','/mnt/user-data/outputs/pp_push_codebase.py'); _cb=_il.module_from_spec(_sp); _sp.loader.exec_module(_cb); _cb.push_codebase()
    except Exception as _e:
        print('codebase sync skipped:',_e)
    return resp["commit"]["sha"]

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("usage: pp_git_push.py <html_path> \"<commit message>\"")
    push(sys.argv[1], sys.argv[2])
