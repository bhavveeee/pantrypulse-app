# PantryPulse — Manual Reload Button & Version-Freshness (complete specification)

> How the single-file app guarantees users see the newest code **and** the newest embedded data. Extracted from `ppReloadApp`, `verchkPoll` / `verchkRender` / `verchkSnooze`, `BUILD` / `BUILD_TS` stamping in `pp_git_push.py`, and the Vercel cache headers as of 17 Sep 2026.

---

## 0. Why this needs a feature at all

PantryPulse ships as **one HTML file with the entire dataset embedded** (base64 workbook). That means the data only changes when the *page* changes. Browsers, CDNs and the PWA-style cache all want to keep serving the old file. Every "I can still see the duplicate" or "the count I gave you isn't showing" report in operations has been a **stale client**, not stale data. This feature exists to make that impossible to miss and one tap to fix.

Three layers work together:

1. **Server never caches** the private page.
2. **A manual "↻ Reload app" button** does a cache-busting hard reload.
3. **A background freshness poll** detects a newer build and shows a banner with a one-tap refresh.

---

## 1. Build identity — `BUILD` and `BUILD_TS`

Every published file carries two constants near the top of the main script:

```js
const BUILD='v21_713';
const BUILD_TS='2026-09-17T21:36';   // IST, stamped at publish time
```

and an embed marker in the data section:

```js
/* PP_EMBED::MASTER_902::v21_713 */
```

- **`BUILD`** — the application code version. Bumped when code changes (`v21_NNN`).
- **`MASTER_NNN`** — the dataset version. Bumped on every data-only push.
- **`BUILD_TS`** — **auto-stamped by the push tool** (`_stamp_build_ts` in `pp_git_push.py`) with the IST time of publish. This is what the header shows the user ("updated 21:36") and what the freshness poll compares.

> **Deliberate trick used in ops (14 Sep):** when a data fix wasn't reaching a stubborn client, the *code* version was bumped (`v21_709 → v21_710`) with no code change purely so the freshness banner would fire on every open client. Both `BUILD` and `BUILD_TS` are compared, so either changing is enough.

The header displays `BUILD_TS` (human-formatted) and shows the build tag on hover.

---

## 2. Layer 1 — server cache headers (`vercel.json`)

```json
{
  "headers": [
    { "source": "/private/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate, max-age=0" }] }
  ]
}
```

`private/*` is served **no-store**. Every navigation to the page fetches the current file from origin. This alone is not sufficient — the browser's *memory* cache and a long-lived tab still hold the old parsed page — which is why layers 2 and 3 exist.

---

## 3. Layer 2 — the manual "↻ Reload app" button

Located in the header bar. Wired to:

```js
function ppReloadApp(){
  try{
    toast('Reloading to the latest version…');
    setTimeout(function(){
      var u = location.pathname + '?_r=' + Date.now();   // cache-busting query
      location.replace(u);                               // replace, not push (no back-button junk)
    }, 250);
  }catch(e){ location.reload(true); }
}
```

Behaviour:
- Appends a **unique `?_r=<timestamp>`** so no cache layer can serve a stored copy.
- Uses `location.replace` so the history stack isn't polluted.
- 250 ms delay lets the toast paint before navigation.
- Fallback `location.reload(true)` if anything throws.

This pulls **both** the newest code and the newest embedded workbook in one step — there is no separate "refresh data" action for the embedded path.

### 3.1 Related but different: "Refresh from sheet"
For users connected to a **published Google Sheet** instead of the embedded workbook, a second control (`refreshFromSheet → loadFromUrl(url)`) re-fetches the sheet with `cache:'no-store'`, re-parses (`parseWorkbookToApp`), replaces `S`, re-applies subscriptions, saves to `localStorage`, and repaints. This refreshes **data only**; it does not update code. In the current deployment everyone uses the embedded workbook, so **↻ Reload app** is the one button that matters.

---

## 4. Layer 3 — background freshness poll (`verchkPoll`)

### 4.1 Schedule
```js
setTimeout(verchkPoll, 8000);                   // first check 8 s after load
setInterval(verchkPoll, 90000);                 // then every 90 s
document.addEventListener('visibilitychange', () => { if(!document.hidden) verchkPoll(); });  // and whenever the tab regains focus
```
Skipped entirely on `file://` (local preview has nothing to poll).

### 4.2 What it does
```js
url = (location.pathname includes '/private/' ? location.pathname : '/private/pantrypulse.html') + '?_v=' + Date.now();
fetch(url, {cache:'no-store'}) → text
   latest   = /BUILD='(v21_\d+)'/  or  /::(v21_\d+)/          // live build tag
   latestTs = /const BUILD_TS='([^']*)'/                      // live timestamp
verchkRender()
```
It **re-downloads the live HTML** (cache-busted) and regex-reads the two constants out of it. No API, no version endpoint — the file is its own manifest. Network failure → silent (offline users are not nagged).

### 4.3 Decision (`verchkRender`)
```js
newer = ( latest   && _verNum(latest)   > _verNum(BUILD) )       // code bumped
     || ( latestTs && BUILD_TS && latestTs > BUILD_TS );         // or data re-published later
```
`_verNum` parses the numeric part of `v21_NNN`. `BUILD_TS` is ISO-ish so string comparison is chronological.

### 4.4 Banner
If `newer`, a fixed bottom bar `#verbar` slides up:

> ● **A newer version is live** — your app is out of date (updated <time>). Refresh to get the latest data and fixes.  **[Refresh now]**  [later]

- **Refresh now** → `location.reload(true)`.
- **later** (`verchkSnooze`) → hides the bar and **re-shows it in 10 minutes**. It cannot be dismissed permanently — a stale client is a data-integrity risk.
- If not newer → bar hidden/emptied.

Styling: green gradient bar, pulsing dot, max-width 1000 px, bottom-anchored, z-index 9800 so it sits above every view.

---

## 5. Publish-side guarantees (`pp_git_push.py`)

The push tool is the only way builds reach users. Its gate, in order:

1. **Stamp `BUILD_TS`** with IST now.
2. **Snapshot** the closed day's boards and re-embed (see Snapshots spec).
3. **Syntax check** the main script (`node --check` on the extracted JS).
4. **Headless boot test** (Playwright/Chromium): load the file, wait for the household selector to populate, open the dashboard, count rendered chips. **Fails** on `households ≤ 1`, `chips == 0`, or any uncaught page error. A failing build **does not push**.
5. **Push** to GitHub `main` → Vercel auto-deploys.

So a user who reloads always gets a file that at minimum boots with all households and renders boards.

---

## 6. Operator playbook — "I don't see the change"

1. Ask the user to hover the header and read the **build time**. If it is older than the last push, they are stale.
2. **↻ Reload app.** Fixes >95 % of cases.
3. If the app itself looks stale (button missing / very old build), **`Ctrl+Shift+R` / `Cmd+Shift+R`**.
4. If a push just went out and the banner hasn't appeared yet: Vercel deploys take ~30–60 s; the poll runs every 90 s. Wait or reload manually.
5. Only if the header shows the **current** build and the data is still wrong is it a real data/render bug.

**Anti-pattern to avoid:** treating "I can still see X" as a data bug and re-editing the sheet. Check the build time first.

---

## 7. Recommendations for the new model

- Keep **all three layers**; each covers a failure the others miss.
- Keep `BUILD_TS` **auto-stamped by the publisher**, never hand-edited — it is the freshness signal.
- Keep the banner **un-dismissable beyond a snooze**.
- Consider adding a lightweight `/api/version` endpoint returning `{build, ts, master}` so the poll doesn't download the full ~6 MB file every 90 s; today it does, which is fine on Wi-Fi but wasteful on mobile data.
- Consider surfacing **`MASTER_NNN`** in the banner too, so a data-only update reads as "new data" rather than "new version".
