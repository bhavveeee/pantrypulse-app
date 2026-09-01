# PantryPulse

Multi-household food inventory and meal-planning system. Tracks stock, meal plans and
consumption across **9 households**, breaks every planned dish down to ingredient level,
and produces the shopping cart the ops team works from.

Run by Curious Inc. (Bengaluru). Live app: `https://pantrypulse-app-chi.vercel.app/private/pantrypulse.html`
(Google SSO, restricted to `@curiousinc.com`).

---

## Where the code is

| Path | What it is |
|---|---|
| `private/pantrypulse.html` | **The application.** A single self-contained HTML file — UI, logic, and the master workbook embedded as base64. ~3.5 MB, no build step. |
| `pages/` | Next.js auth shell (NextAuth + Google SSO) that gates access to `private/`. |
| `api/` | Serverless proxies to the external services (see below). |
| `tools/` | Python tooling that maintains the data: deduction engine, tracker generator, deploy script. |
| `tools/RecipeMaster_AppsScript.gs` | Google Apps Script bound to the Recipe Master sheet; serves recipe lookups. |
| `docs/HANDOFF.md` | **Read this first.** Full operating manual: households, deduction rules, portion norms, standing rules, build protocol, known pitfalls. |
| `ops/` | Operational state — Tequila reading protocol and per-household read tracking. |
| `vercel.json` | Serverless function durations. |

**If someone asks "where is the codebase", the answer is this repo** — but note the
application itself is one large HTML file rather than a conventional source tree, and the
authoritative *data* lives in an Excel workbook embedded inside it. That is a deliberate
design choice (zero build, works offline, one artifact to deploy), not an accident.

---

## Architecture

```
Emergent (meal plans)  ──►  /api/emergent  ──┐
                                             │
Recipe Master sheet    ──►  /api/recipe   ───┤
  (8,144 dishes, Apps Script)                ├──►  pantrypulse.html  ──►  handover + cart
Rasoi (recipe fallback) ─►  /api/rasoi    ───┤
                                             │
Master workbook (embedded base64)  ──────────┘

Tequila (household chats / carts)  ──►  read manually per ops/TEQUILA_READING_PROTOCOL.md
```

### The external services

| Route | Talks to | Purpose |
|---|---|---|
| `/api/emergent` | Emergent | current-week meal plan per household |
| `/api/recipe` | Recipe Master (Apps Script) | fuzzy dish match → per-adult ingredient rows |
| `/api/recipeadd` | Recipe Master | append a new recipe (**currently disabled** — see below) |
| `/api/rasoi` | Rasoi | recipe fallback when the sheet has no match |
| `/api/sheet` | Google Sheets CSV | direct read of the recipe sheet |

### Data model

The master workbook holds one sheet per household plus system sheets:
`Index`, `Orders`, `Deductions` (itemised ledger), `Meals` (daily close records),
`History` (audit log), `Master FnV` (1,511-SKU shelf-life reference),
`SKU Knowledge` (~2,700 rows of aliases and never-match guards), and others.

`SKU Knowledge` is the important one: it maps what a recipe *asks for* to what a household
*actually stocks* — "coriander powder" → "Dhaniya powder", "gram flour" → "Besan" — with
guards preventing wrong matches like `rice` → `rice bran oil`.

---

## Environment

Set in Vercel (Settings → Environment Variables). Bound at build time, so **redeploy after changing**.

```
GOOGLE_CLIENT_ID       GOOGLE_CLIENT_SECRET
NEXTAUTH_SECRET        NEXTAUTH_URL
APPS_URL               APPS_KEY            RECIPE_SHEET_ID
```

For the deploy script: `export PP_GITHUB_TOKEN=...` — **never commit a token.**

---

## Deploying

```bash
export PP_GITHUB_TOKEN=...
python3 tools/pp_git_push.py <path-to-html> "commit message"
```

Pushes to `private/pantrypulse.html`; Vercel deploys automatically. Before pushing, the build
protocol in `docs/HANDOFF.md` must be followed — re-embed the workbook, verify the embedded
bytes match the file on disk, bump the version tag, and `node --check` the main script.

---

## Notes for anyone picking this up

- **Recipe Master write-back is deliberately OFF** (`PP_SHEET_WRITEBACK = false`). Nothing is
  added to that sheet without explicit sign-off. Unmatched dishes queue locally instead.
- **The cart never auto-orders.** It surfaces what is not available, short, or unknown; a
  human decides what to buy. That review step is the point, not a limitation.
- `docs/HANDOFF.md` has a "hard-won lessons" section listing failure modes that have actually
  caused bad data (anchored regex matching, unit mismatches, double deductions on soaked
  legumes). Read it before changing matching or deduction logic.
