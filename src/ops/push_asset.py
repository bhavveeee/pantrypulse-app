import base64,json,urllib.request,importlib.util,sys
spec=importlib.util.spec_from_file_location('pp','/mnt/user-data/outputs/pp_git_push.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
hdr={"Authorization":"Bearer "+m.TOK,"Accept":"application/vnd.github+json"}
def push(local,repo_path,msg):
    content=open(local,'rb').read()
    sha=None
    try:
        r=urllib.request.urlopen(urllib.request.Request(f"https://api.github.com/repos/{m.OWNER_REPO}/contents/{repo_path}?ref={m.BRANCH}",headers=hdr)); sha=json.load(r).get('sha')
    except Exception: pass
    body={"message":msg,"content":base64.b64encode(content).decode(),"branch":m.BRANCH}
    if sha: body["sha"]=sha
    req=urllib.request.Request(f"https://api.github.com/repos/{m.OWNER_REPO}/contents/{repo_path}",data=json.dumps(body).encode(),method="PUT",headers={**hdr,"Content-Type":"application/json"})
    r=json.load(urllib.request.urlopen(req,timeout=600))
    print(f"PUSHED {repo_path} ({len(content):,} bytes) -> {r['commit']['sha'][:10]}")
if __name__=='__main__': push(sys.argv[1],sys.argv[2],sys.argv[3])
