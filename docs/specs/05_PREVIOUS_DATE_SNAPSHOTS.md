# PantryPulse — Previous-Date Board Snapshots (complete specification)

> How the app lets a user pick a past date and see exactly how a household's board looked at the end of that day. Extracted from `pp_snapshot.py`, the `_snapshot_closed_day` hook in `pp_git_push.py`, and the app-side `PP_SNAPS` / `ppSnapFor` / `ppSnapView` as of 17 Sep 2026.

---

## 0. The problem this solves

PantryPulse has no server running at midnight. Boards are mutable — orders add, deductions subtract, counts overwrite — so without a freeze there is no way to answer "what was on Disha's board on the 12th?" once the 13th's changes land. Snapshots give every day a **locked, read-only board** per household.

---

## 1. Storage — the `Board Snapshots` sheet

One sheet in the MASTER workbook. Header row 1, frozen pane at A2.

```
date | household | hid | category | item | qty | unit | status
```

- **One row per in-stock item per household per date.** Items at qty ≤ 0 are **not** stored — a snapshot is "what is ON the board", not the full row skeleton.
- `date` is ISO `YYYY-MM-DD` (IST).
- `household` is the sheet name (e.g. `Shunyam & Ishan - latest`), `hid` is the short id (`h1b`, `h2`, …) — the app keys on **hid**.
- `category` is the row's board category at that moment (so a later recategorisation does not rewrite history).
- Size (17 Sep): ~2 100 rows per day across 15 households; the sheet holds every day since snapshots began.

---

## 2. Writer — `pp_snapshot.py`

```python
snapshot(xlsx_path, date_iso, replace=True) -> rows_written
```

Algorithm:
1. Load workbook; read `Index` to get `(sheet, hid)` for every household.
2. Create `Board Snapshots` if missing (header + freeze pane).
3. If `replace`: **delete every existing row for `date_iso`** (bottom-up so indices stay valid). This makes the function **idempotent** — re-running for the same date replaces, never duplicates.
4. For each household sheet, rows 5→end: if the item has a numeric qty > 0, append `[date, sheet, hid, category, item, qty, unit, status or 'in']`.
5. Save. Return the count.

CLI: `python3 pp_snapshot.py <xlsx> [YYYY-MM-DD]` (defaults to today).

---

## 3. When snapshots are taken — the publish hook

Snapshots are **not** taken on a timer. They are taken **on every publish** by `pp_git_push.py → _snapshot_closed_day(html_path)`:

1. Compute today's date in **IST** (`UTC + 5:30`).
2. Call `snapshot(MASTER.xlsx, today)` — replaces today's rows with the current boards.
3. Re-embed the updated workbook into the HTML (`window.__EMBEDDED_WB_B64__`) so the published page carries the snapshot.
4. Print `BOARD SNAPSHOT: <n> rows for <date> (re-embedded)`; any failure prints `BOARD SNAPSHOT skipped: <err>` and **does not block the push**.

**Consequence — the key operational rule:**

> **The last push of a day = that day's locked board.**

Because every push re-snapshots *today*, intraday pushes just overwrite today's rows. Whatever the boards look like when the final push of the day goes out is what the date picker will show forever for that date. If a correction to yesterday's board is pushed today, it changes *today's* snapshot, not yesterday's — yesterday stays as it was at its last push.

Order in the push tool: **stamp BUILD_TS → snapshot & re-embed → syntax check → headless boot test → push**. The snapshot therefore always reflects the data that actually shipped.

---

## 4. Reader — app side

### 4.1 Parse at load (`parseWorkbookToApp`)
```js
window.PP_SNAPS = {};            // { 'YYYY-MM-DD': { hid: [ {n, q, u, cat, status}, … ] } }
for each row in 'Board Snapshots' (skipping header):
    PP_SNAPS[date][hid].push({ n: item, q: +qty, u: unit, cat: category, status: status || 'in' })
```
Failure → `PP_SNAPS = {}` (feature silently off, app still runs).

### 4.2 Deciding whether to show a snapshot (`ppSnapFor(h)`)
```js
today = istToday()
if (!S.date || S.date >= today) return null;        // current or future date → live board
d = PP_SNAPS[S.date]; if (!d) return null;          // no snapshot for that date → live board
return d[h.id] || d[h.hid] || null;                 // that household's frozen rows
```
So the snapshot view engages **only** when the selected date is strictly in the past **and** a snapshot exists for it. Otherwise the dashboard renders the live board as usual (which is also what a user sees for a past date that predates the first snapshot).

### 4.3 Rendering (`ppSnapView(h, rows)`)
- Groups rows by `cat`, orders categories with the standard board order (`Vegetable · Fruit · Meat · Meat & fish · Dairy · Bread & bakery · Frozen · Grains · Dals · Pasta · Spice · Condiment · Beverage · Staple · Pantry · Oil · Nuts & seeds · Herb · Other`), unknown categories last alphabetically.
- Shows a **banner** at the top:
  > 📸 **Saved board for <date>** — how <household>'s board looked at the end of that day. Read-only, for reference only. **[Back to today]**
- Renders the items as plain chips (name · qty unit). **No** edit controls, **no** deduction audit, **no** expiry badges — it is a historical record, not a live board.
- The "Back to today" button resets `S.date` to today and repaints the live board.

### 4.4 What else changes on a past date
- The **Handover**, **Smart List**, and **Use priority** views keep working against the live board — they are forward-looking tools; only the **Dashboard board** swaps to the snapshot.
- The **date picker** in the header is the entry point; picking any past date with a snapshot flips the dashboard.

---

## 5. Idempotency and correction semantics

| Scenario | What happens |
|---|---|
| Push three times on the 16th | Three snapshots for 2026-09-16, each replacing the last. Final state = last push. |
| On the 17th, fix a mistake on a board | 17th's snapshot reflects the fix. 16th's snapshot is untouched (it shows the mistaken state — which is *correct* history). |
| Need to re-freeze a past date deliberately | Run `python3 pp_snapshot.py MASTER.xlsx 2026-09-16` manually, then push. This **replaces** the 16th with the current board — only do this if the past date was never validly snapshotted. |
| A household is onboarded on the 15th | It appears in snapshots from the 15th's first push onward; earlier dates have no rows for it, and the picker shows its live board for those dates. |
| A household is paused | Still snapshotted (its board still exists). |

---

## 6. Interaction with other features

- **Deduction audit** compares pre- vs post-close boards *within a day*; it does **not** read snapshots.
- **Use priority** age fallback ("capture date") uses the row's own `Last entered / checked`, not snapshots.
- **Perishable-overwrite "keep back high quantity" rule** (16 Sep) *tried* to read yesterday's snapshot to recover pre-overwrite quantities and found name-key mismatches (snapshot `item` vs board name after renames). The reliable source turned out to be the operator log of the removal. **Recommendation for the new model:** store a `sku_key` (normalised name) column in snapshots alongside `item`, so historical quantities can be joined to current rows even after renames.

---

## 7. Recommendations for the new model

1. **Keep the "last push of the day = locked board" rule** — it is simple and has never needed a scheduler.
2. **Add `sku_key`** (normalised) to each snapshot row for reliable joins (see §6).
3. **Consider storing zero rows** only if you need "was it on the board at 0" history; today's design deliberately excludes them to keep the sheet small.
4. **Cap retention** or roll old dates into a compressed form once the sheet approaches Excel row limits (~1M) — at ~2 100 rows/day that is ~475 days, so not urgent, but plan for it.
5. **Never let a snapshot failure block a push** — current behaviour; keep it.
