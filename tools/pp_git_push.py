#!/usr/bin/env python3
"""PantryPulse auto-push: pushes the given HTML build to GitHub -> Vercel auto-deploys.
Usage: python3 pp_git_push.py <html_path> "<commit message>"
Standing pipeline (from 17-Aug-2026): every shipped build ends with this push.
NOTE: contains a fine-grained PAT scoped ONLY to bhavveeee/pantrypulse-app (Contents RW).
Set PP_GITHUB_TOKEN in the environment. Never commit a token.
"""
import os
import base64, json, sys, urllib.request

TOK = os.environ.get("PP_GITHUB_TOKEN", "")  # never hard-code; export PP_GITHUB_TOKEN
OWNER_REPO = "bhavveeee/pantrypulse-app"
PATH = "private/pantrypulse.html"
BRANCH = "main"

def push(html_path: str, msg: str):
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
