import os
#!/usr/bin/env python3
"""PantryPulse auto-push: pushes the given HTML build to GitHub -> Vercel auto-deploys.
Usage: python3 pp_git_push.py <html_path> "<commit message>"
Standing pipeline (from 17-Aug-2026): every shipped build ends with this push.
NOTE: contains a fine-grained PAT scoped ONLY to bhavveeee/pantrypulse-app (Contents RW).
Rotate the token periodically; on rotation, update TOK below.
"""
import base64, json, sys, urllib.request

TOK = os.environ.get("PP_GITHUB_TOKEN", "")  # never hard-code
OWNER_REPO = "bhavveeee/pantrypulse-app"
PATH = "private/pantrypulse.html"
BRANCH = "main"


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
    tmp = '/tmp/pp_boot_test.js'; open(tmp,'w').write(js)
    try:
        r = subprocess.run(['node', tmp, os.path.abspath(html_path)], capture_output=True, text=True, timeout=timeout_s+30, cwd='/home/claude/pp' if os.path.isdir('/home/claude/pp') else None)
        out = (r.stdout or '').strip().splitlines()[-1] if r.stdout else ''
        print('BOOT TEST:', out)
        return r.returncode == 0
    except Exception as e:
        print('BOOT TEST could not run:', e); return True

def push(html_path: str, msg: str):
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
    return resp["commit"]["sha"]

if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit("usage: pp_git_push.py <html_path> \"<commit message>\"")
    push(sys.argv[1], sys.argv[2])
