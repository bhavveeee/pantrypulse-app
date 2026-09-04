# PantryPulse — Handoff to Cowork

**Owner:** Bhavya Agarwal (bhavya@curiousinc.com), Curious Inc., Bengaluru / IST
**State at handoff:** build `v21_621` / `MASTER_665`, closed through **Tue 25 Aug 2026 (W35)**
**Read this file first in any new session before touching anything.**

---

## 1. What PantryPulse is

A multi-household food inventory and meal-planning system covering **9 households**. Three moving parts:

1. **The master workbook** (`PantryPulse-MASTER_*.xlsx`) — the source of truth. One sheet per household plus 19 system sheets.
2. **The app** (`pantry-pulse_*.html`) — a single self-contained HTML file with the workbook embedded as base64. Deployed to Vercel.
3. **The integrations** — Emergent (meal plans), Recipe Master Google Sheet (8,144 dishes), Rasoi (recipe fallback), Tequila (order history).

### Households

| id | Board sheet name | People | Notes |
|---|---|---|---|
| h1b | `Shunyam & Ishan - latest` | 2 | plan key drops the "- latest" |
| h2 | `Soozy & Munz` | 2 | Emergent key is **`Munz & Soozy`** (reversed) |
| h3 | `Disha & Anirudh` | 2 | |
| h4 | `Kartik & Dhara` | 2 | |
| h5 | `Rahul & Radhika` | 3 | incl. Skye |
| h7 | `Paxal & Sana` | 2 | |
| h8 | `Pratik & Sakshi` | 2 | Emergent key is **`Sakshi & Pratik`**. **COUNT-DRIVEN** |
| h10 | `Yash & Manik` | 2 | Tequila id `ed8dd224-05ed-4fbe-acca-3c28133690fc` |
| h11 | `Padmaja & Rohan` | 2 | onboarded 24-Aug. Tequila id + methodology **PENDING** |

h6 and h9 exist historically but are **not maintained**.

**Name mapping is a recurring bug source.** Board sheet name ≠ Emergent plan key for h2, h8 and h1b. The app resolves via `hovKeyName()` + `HOV_NAME`.

---

## 2. The core loop (a "close")

Every day, per household, in this order:

1. **Book orders first** — anything that arrived before the meals were cooked.
2. **Then deduct the day's meals**, dish by dish, one ledger line per SKU.
3. **Log the close** in the `Meals` sheet with a plain-English summary.
4. **Rebuild** — re-embed the workbook into the HTML, bump the build number, push, regenerate the tracker.

### Deduction rules (non-negotiable)

- `need = portion_per_person × eaters × dish_intensity`; `deduct = min(need, available)`.
- **Plan-stated grams always beat recipe estimates.** If the plan says "chicken 200g", use 200g.
- **Never deduct a zero-stock SKU** — flag it instead.
- **Never fabricate quantities.** Flag rather than guess.
- Floor at zero, never negative.
- Split across variants proportionally (e.g. capsicum colours).
- Use perishables fully and generously.
- Every ingredient is either deducted **or** flagged — never silently skipped.
- **h8 (Pratik & Sakshi) is count-driven**: no deductions, ever. Physical counts are the truth.

### Portion norms (2 pax, grams per meal)

onion 150 · tomato 150 · potato 150 · capsicum 150 · ginger 25 · garlic 25 · green chilli 15 · spinach/palak 250 · parwal 250 · mushroom 200 · sweet potato 200 · beetroot 150 · paneer 200 · cucumber 100 · lemon 30 · kala chana 180 · edamame 80 · coriander/mint 20 · curry leaves 5 · spice powders 5–8 · cooking oil 25ml · butter 15 · greek yoghurt 100 · milk 150ml · berries 60 · cashew 20

**Dry dal/legume: 50 g dry per person per meal** (100 g for 2). Corrected 24-Aug — the old 180g-for-2 figure was wrong.

MoH thresholds: fresh < 5, and onion/tomato/potato/capsicum < 10.

### Household-specific standing rules

- **h2** — milk −700 ml and greek yogurt −4 pots **on cook days only**. Prawns 350 g/meal. Every smart list carries the 14-item ★ ALWAYS IN STOCK block.
- **h4** — Kartik paneer max 100 g/meal, 1 pax per meal.
- **h5** — greek yogurt **= skyr** for this house. Never order lemon (home tree). Radhika dislikes chicken breast → use thigh. No green capsicum. Mutton from Bamburies on Thursdays. Chicken thigh cadence **150 g lunch / 500 g dinner — but only on days that actually have a meat dish**.
- **h7** — Paxal: **never pre-cut coconut into chunks** (Sana dislikes coconut).
- **h8** — ghee always kept. ★ ALWAYS-CHECK block on every smart list: salt, sugar, ghee, eggs, mushroom, spinach. Tracked in `Staples par — P&S`.
- **All houses** — **paneer is categorised as Meat**, never Dairy. Oat/almond milk counts as Dairy.
- **Never break down** "rainbow meal", "leftover", "assorted", "mixed veg plate" into ingredients.

---

## 3. Files and what they do

| File | Purpose |
|---|---|
| `PantryPulse-MASTER_2026-08-17_EOD.xlsx` | **Source of truth.** Boards + 19 system sheets |
| `pantry-pulse_2026-08-17_EOD.html` | The app. Workbook embedded as base64 |
| `pp_git_push.py` | Deploy: pushes the HTML to GitHub → Vercel auto-deploys |
| `make_tracker.py` | Regenerates the searchable items tracker. **Has a hardcoded household list — update it when adding a house** |
| `pp_deduct.py` | The deduction engine. Resolves SKUs, respects units, writes the ledger |
| `RecipeMaster_AppsScript_v2.gs` | The Google Apps Script bridge (v2, cached — ~2 s per lookup) |

### System sheets in the workbook

`Index` (household registry) · `Orders` · `Deductions` (itemised ledger) · `Meals` (close records) · `Checks` / `Check notes` · `History` (audit log) · `Master FnV` (1,511-SKU shelf-life reference) · `SKU Knowledge` (~2,700 rows: aliases + never-match guards) · `Shelf-life rules` · `Deduction method` · `MoH data` · `Dishes library` · `Subscriptions` · `Staples par — P&S` · `AI Handover`

### Build protocol — follow exactly

1. Edit the workbook.
2. Re-embed: base64 the xlsx into `window.__EMBEDDED_WB_B64__`, then **assert the embedded bytes equal the file on disk**.
3. Bump `::v21_<n>` **and** `BUILD='v21_<n>'`; bump `MASTER_<n>` whenever the xlsx changed.
4. Assert the HTML ends with `</html>` and has exactly 3 `<script` / 3 `</script>`.
5. `node --check` the main script (stub the base64 blob out first) **before** pushing.
6. `python3 pp_git_push.py <html> "<message>"`
7. Regenerate the tracker.
8. Present the files.

---

## 4. Live integrations

**App:** `https://pantrypulse-app-chi.vercel.app/private/pantrypulse.html`
Behind Google SSO scoped to `@curiousinc.com` (NextAuth). Vercel **Pro**, company account.
Repo: `bhavveeee/pantrypulse-app`, path `private/pantrypulse.html`, branch `main`.

**Serverless proxies** (repo `api/`, same-origin so no CORS). Durations set in `vercel.json`.

| Route | Does |
|---|---|
| `/api/emergent?house=<plan name>` | current-IST-week meal plan; merges next week at a week boundary |
| `/api/recipe?dish=<name>` | fuzzy match against Recipe Master. `?probe=1` returns config health |
| `/api/recipeadd` | appends a new recipe (append-only, dupe-guarded) |
| `/api/rasoi` | recipe fallback. **Requires exactly `{query}`** — extra fields cause 422 |
| `/api/sheet` | CSV read of the recipe sheet |

**Env vars** (Vercel → Settings → Environment Variables; bind at build time, so **redeploy after changing**):
`GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `NEXTAUTH_SECRET` · `NEXTAUTH_URL` · `APPS_URL` · `APPS_KEY` · `RECIPE_SHEET_ID`

**Recipe Master sheet:** `10Is88IFuTVdSYjjZLlFB2uXRJ43bGLqVFmJhMM0hKDY` — 8,144 dishes / 81,714 rows.
Columns: `Dish | Ingredient | Per adult (qty) | Unit | Class` (Hero/Base/Base-Optional/Fat/Garnish/Optional). Quantities are **raw, per ONE adult**.
**Only two people have access. Do not damage this sheet.** Writes are append-only, duplicate-guarded, class-whitelisted, capped at 40 rows, and never touch other tabs.

**Umami recipe sheet:** `13xim-o6uZMDiIHkp2CnFXwnYq8wNKS_Y5lsHxeCg__Q` — weekly tabs, per-household dish list with a **Notes / Special Instructions** column. Those notes override recipes (e.g. "no corn in the mushroom salad", "no sugar in Thai basil chicken").

**Emergent:** meal plans. **Emergent is the whole truth** — when a plan changes, no message to the household is needed; the app live-syncs.

**Tequila** (`app.tellm.co`): household chats and cart images = order history. Recognition rule: **newest cart + explicit placement confirmation = a booked order**, dated to the placement day. No confirmation, no order.

---

## 5. Hard-won lessons — read before writing any code

These caused real errors. Do not repeat them.

1. **Never use anchored `^` patterns to find SKUs.** Boards use branded, prefixed names: *Quaker oats*, *Skimmed milk*, *Dhaniya powder*, *Peeled garlic*. `^oats` finds nothing and produces a false "0 on board". **Search unanchored, and consult `SKU Knowledge` aliases.**
2. **Check units before deducting.** Rows may be `g`, `ml`, `pc`, `packet`, `jar`. Passing "50 g" into a piece-unit onion row deducted 6 whole onions. `pp_deduct.py` handles this — **use it instead of hand-rolled scripts.**
3. **First match is often the wrong match.** `^rajma` hit *Rajma masala powder*; `^rice` hit *Rice bran oil*; `masoor` hit *Sona masoori rice*. Apply the never-match guards.
4. **A zero on a board usually means "never counted", not "actually absent"** — especially for staples like garlic, salt, a dal. Say "couldn't match — verify" rather than asserting a gap.
5. **Read back what you wrote.** Print the value from the *saved file*, not the value you intended to write. A row was created as "Blueberry" while the log said "Blackberry".
6. **Never leave a shelf life blank** in `Master FnV` — blanks fall back to a fresh-perishable default, which is how besan ended up at 6 days. Class defaults: spices/oils/sauces/dals/dried 365 d · flours/grains/nuts/dried fruit 180 d · salt/sugar/honey 730 d · frozen 120 d · sprouts 3 d.
7. **Apps Script allows ~30 concurrent executions per Google account.** Recipe lookups pass through a global gate capped at 2 in flight. Do not remove it.
8. **Verify visually before shipping UI changes.** Headless Chromium is available; render the HTML and screenshot it.

---

## 6. Deliverable formats

**Smart list** — locked format, four sections, one page, in this order. Do not redesign it.

```
<Household> — Smart List
Check <date> for <day date> · residents (n) · <stock basis> · MoH fresh <5, pool <10 · SKU-level
<Day>: B ... · L ... · D ...

ORDER — not in stock for <day> (n pax) · <count>      [Item | Need | Have | For]
LOW after <prev day> (fresh) · <count>                [Item | Need | Have | For]
NEGATIVE — <day> cannot be cooked as planned · <count> [Item | Have | <Day> need | Issue]
★ ALWAYS-CHECK · <count>       (h8 and h2 only)       [Item | Current | Status]

<footer: stock basis, key blockers, build version>
```

Smart lists **forward-project**: deduct the in-between days' meals first, then map the target day against the resulting stock.

**Slack** — draft alerts as text only. **Never post.** Bhavya pushes manually to `#inventory-alerts`.

---

## 7. Working style

Terse, directive, correction-oriented. Expects immediate execution, every judgement call flagged transparently, **zero fabrication**, and no pushback on corrections. When told a value is wrong, change it and move on. Own mistakes plainly and explain the root cause.

---

## 8. Open items at handoff

- **h11 Padmaja & Rohan** — need Tequila household id, and confirmation of deduction-driven vs count-driven, plus any standing rules.
- **h11** — clarify: instruction said "chana 500 g → kala", but the generic chana row is 350 g and the 500 g legume is *Chole*. The 350 g row was renamed **Kala chana**; confirm whether Chole was meant.
- **Rotate the Apps Script secret** — currently `pp`, and it sits in git history on a company-visible repo. Change `SECRET` in the v2 script, redeploy the web app, update `APPS_KEY`.
- **Order capture depends on dictation.** Shunyam's chicken breast went to 0 because the 25-Aug order list supplied didn't include it. Reading Tequila carts directly at close time would catch this.
- **P&S has five zero-value paneer rows** and several duplicate legume rows — worth consolidating.
- **Move every close onto `pp_deduct.py`** instead of one-off scripts. This eliminates the whole class of alias/unit errors in §5.

---

## 9. First session in Cowork — suggested opening

1. Put this file plus the master xlsx, the app HTML, and the `.py` helpers in one folder.
2. Cowork → Projects → **+** → **"Use an existing folder"** (not "Import a project") → point it at that folder.
3. Add a standing project instruction: *"Always read `PANTRYPULSE_HANDOFF.md` first if you haven't already this session."*
4. First task: *"Read the handoff doc and the master workbook, then tell me the current build, which households are closed through when, and what's open."* Sense-check the answer before doing real work.


## DATA-CAPTURE WORKFLOW (mandatory from 4-Sep-2026)

Every change to any board goes through a tool that writes to the **Change Log** sheet. No exceptions, no hand-edits.

| Change | Tool | Change Log `kind` | `source` |
|---|---|---|---|
| Order booked | `book.py` | order | Bhavya-dictated order list / Tequila cart read |
| Physical count / overwrite | `apply.py` | board-overwrite | Bhavya overwrote — smart-list check result |
| Meal deduction | `pp_deduct.py` | deduction | pp_deduct engine (Emergent plan) |
| Correction / reversal | `pp_changelog.log()` directly | correction / reversal | Claude correction (with the reason) |
| New rule | `pp_changelog.log()` | rule | Bhavya |

**Change Log columns:** when · household · hid · kind · sku · field · old · new · delta · unit · source · reason · build · ref.
`ref` points at the exact sheet row. `reason` must be a full sentence with pax, norm and plan reference.

**Reason standard (every deduction line):** date (weekday) · household · meal and dish · SKU −qty (before→after) · pax · basis/norm · source · flags (SHORT / NO STOCK / NO ROW / CORRECTED) · close-note excerpt. The 4-Sep enrichment pass brought all 1,224 historical lines to this standard; `pp_deduct.py` now writes it automatically.

**Overwrite standard:** any value set from a count is labelled *"Bhavya overwrote — smart-list check result"* on the board row, in History, and in the Change Log. A short list is set-these-values-only; a full overwrite never removes the everyday-aromatics set (green chilli, curry leaves, coriander, mint, ginger, garlic, onion, potato).

**PP assistant** reads Change Log + Orders + Deductions + History per item, so every "why" question is answered from these records. If PP says "not recorded", the workflow was bypassed — fix the workflow, not the answer.

**Hard rules the tools enforce:** one (household, date, dish, SKU) deduction only; confusable-family guards (methi/coriander forms, fresh vs sauce/dried/snack); never-match guards on combined and look-alike rows; Yash & Manik at one-third of the 2-pax norm.
