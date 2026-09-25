# PantryPulse — Handover (complete specification)

> The daily meal-prep sheet: for the selected household and week, every dish in every slot broken into ingredients, each ingredient judged against **live stock consumed in sequence**, with a cart of what to buy and a one-click export in the operations team's own Excel layout. Extracted from `handoverView`, `hovPlanForWeek`, `hovPPQty`, `hovSuggest`, `hovExportXlsx`, `ppEnrich`, `HOV_SUBS`, `HOV_FAM`, `PCW` and the recipe bridge as of build v21_713, 17 Sep 2026.

---

## 0. What the user sees

For one household, a week strip (Mon–Sat, with a **week pointer** to step back/forward), and for each day three blocks — **Breakfast / Lunch / Dinner**. Each block lists the day's dishes; under each dish a table:

| Ingredient | Need | Status | Action |
|---|---|---|---|
| e.g. Chicken breast | 300 g | `Available · 800 g` / `Shortfall 150 g · have 150 g` / `Not available · 0 g` / `Don't know` | `ok` / **BUY** / **CHECK** |

Plus per dish: the **recipe link** (direct YouTube/source link from the recipe sheet; a "Find on YouTube" search fallback only if the sheet has no link), a copy-link button, and pax for that slot. At the top: **⟳ Sync meal plan**, **⬇ Export breakdown to Excel**, **🛒 Cart** (aggregated buy list, per selected day(s)), and a **Shadow / Slack batch** pair for pushing lines to the team.

Past days (already closed) render **locked**: every line shows `✓ done · consumed on the day` and `locked`, taken from the frozen breakdown of that day, so history doesn't shift when stock moves.

---

## 1. Inputs

| Input | Source | Notes |
|---|---|---|
| Weekly plan | Emergent (`/api/emergent?house=<name>&week=<ISO week>`) | per weekday: B/L/D text + `breakfast_people / lunch_people / dinner_people` |
| Household → Emergent name | `HOV_NAME` alias map | e.g. `Soozy & Munz → Munz & Soozy`, `Pratik & Sakshi → Sakshi & Pratik`, `Akshita & Prerit → Akshita & Prerik`, `Saurabh → Saurabh Seth`, `Piyush & Mamta → Piyush and Mamta` |
| Recipe breakdown | recipe bridge (`/api/recipe` → Apps Script v4 on the **"final recipes"** sheet: *Dish breakdown* tab `dish, link, source, ingredient, qty for 1 person`) | fuzzy dish match; returns per-person rows + the exact link |
| Live stock | the household's board rows (`itemsOf(h)`) **including rows at zero**, plus legacy `perish` rows | zero rows are kept so an emptied item reads "Not available" rather than "Don't know" |
| Household pax | `hovPax(name)` — plan's per-slot pax; falls back to `Index.People` | guests come through here |
| Per-household consumption norms | `PP_QTY[canon] = [qty, unit]` per person + household factor (see Factor spec) | `hovPPQty(canon, unit, pax)` returns `qty × pax` when units agree (g/ml treated as interchangeable) |
| Locked past days | `hovLockOf(house)[day].data` — frozen breakdown HTML rows saved at close | |
| Closed dates | `h.meals[].date` | a day whose date is in `Meals` is treated as closed |

---

## 2. Plan retrieval and sync (`hovPlanForWeek`, `ppFetchWeek`, `hovSyncPlans`)

1. On opening the Handover, the app fetches the pointed week for the household (`ppFetchWeek(week)`), storing into `window.LIVEPLANS[house]`.
2. **Precedence:** an operator override (`S.hovOverride[house].plan`) → live Emergent plan → the last cached plan.
3. **Bug fixed 13 Sep (v21_700):** freshly-synced in-memory plans lacked a `__v` stamp and were being rejected as invalid, starving the Handover after every sync. Plans are now accepted with or without the stamp.
4. **⟳ Sync meal plan** re-fetches the week **and clears the enrichment cache** for that household/week, so any dish cached before a recipe-sheet fix is re-enriched (this is how stale "Find on YouTube" links are replaced by direct links).
5. Each slot's text is parsed (`hovParseSlot`) into dishes: split on `+`, newlines, `|`, `;`, and named-person prefixes (`Munz:`, `Soozy:`, `All:`, `Kids`, `Staff (4):`); bracketed prep notes `(soak …)`, `(thaw …)`, `(marinate …)` are kept as **prep** lines, not dishes.

### 2.1 Junk-line filter
A "dish" is skipped (rendered as a grey junk row, no ingredients) if it: starts with `(`; contains `kcal`; looks like a numeric prefix `12 -`; starts with `soak / thaw / cut / pack / post / snack / inform`; or contains `rainbow meal / rainbow bowl / leftover / left over`.

### 2.2 Enrichment (`ppEnrich`)
Runs per day in the background (staggered 90 ms apart, current day first). For each dish: query the recipe bridge → on a match, store `{ingredients:[{name, canon, qty_per_person, unit, class}], link, source}` in the enrichment cache keyed `ppbk5_<house>|<week>|<day>|<dish>`. Cache key prefix is **bumped** (`ppbk4_ → ppbk5_`) whenever the recipe source changes, and old keys are purged on boot. Dishes with no recipe match get `__none` and are shown with a "no recipe" note.

---

## 3. The simulation — sequential consumption of a mutable ledger

This is the core idea and why the Handover is trustworthy for planning: **it does not compare each dish to the current board independently.** It clones the board into a **ledger `L`** and consumes it in order — **Mon → Sat, B → L → D, dish by dish, ingredient by ingredient** — so Tuesday's dinner sees what Monday and Tuesday-lunch already used.

```
L = clone of board { lowercase name → {n, q, u, checked} }, merging duplicates with ppBestRow
for day in [Mon..Sat]:
    if day is closed/past → render locked rows, skip simulation
    for slot in [B, L, D]:
        pax = plan pax for that slot
        for dish in slot:
            for ingredient in dish:
                req = hovPPQty(canon, unit, pax)  ?? recipe qty × pax
                st  = res(ingredient)                       # resolve to a ledger row (§4)
                decide state (§5); if state==ok or short → st.q -= used   # consume
                cart accumulates any non-OK line (§6)
```

**Ledger merge:** when the board has several rows for one name, `ppBestRow` picks the live/most-recently-checked/largest one — so a zero skeleton never hides live stock.

---

## 4. Resolution inside the Handover (`res(disp, canon)`)

Order of attempts (first hit wins):

1. **Exact lowercase name** in the ledger.
2. **SKU Knowledge candidates** (`ppSkuCandidates(house, name)`) — household aliases + never-match guards. Prefer a candidate with `q > 0`; else any candidate.
3. **HOV_SUBS rule** for the canon (an include/exclude word list per ingredient family) — e.g. a rule that lets "rice" resolve to `sona masoori | basmati | matta` but not `rice flour | poha`. Prefer live rows; take a zero row only on the last include word.
4. **Containment** — canonical name contains or is contained by a ledger key; largest quantity wins.
5. **Token cover** — every token of the ingredient appears in the ledger key; largest quantity wins.
6. `null` → **Don't know**.

`hovCanon` strips brackets, punctuation and pluralisation; `hovTok` splits into tokens ≥ 3 chars.

---

## 5. The four honest states (v21_644 — "no substitution guessing, no optional layer")

| State | Condition | Chip | Cart | Consumes ledger? |
|---|---|---|---|---|
| **AVAILABLE** | row found and `haveC ≥ reqC` | green `Available · <have> <unit>` (+ `≈ N g` if converted) | no | yes, `reqC` |
| **SHORTFALL** | row found, `0 < haveC < reqC` | amber `Shortfall <reqC−haveC> · have <have>` | **BUY** `reqC − haveC` | yes, all of `haveC` |
| **NOT AVAILABLE** | row found and `haveC == 0` | red `Not available · 0 <unit>` | **BUY** `reqC` | no |
| **DON'T KNOW** | no row at all | violet `Don't know — never captured in inventory` | **CHECK** `reqC` | no |

`haveC / reqC` are the have/need after unit reconciliation (§5.1). A `using: <row name>` sub-note appears whenever the resolved row's name differs from the ingredient text, so the cook sees exactly which SKU was matched.

**Why four states and not "substitute":** an earlier version guessed substitutes (e.g. red capsicum for green) and quietly marked lines OK; cooks were surprised in the kitchen. Since v21_644 every non-AVAILABLE line goes to the cart and **a human decides**. The only "suggestion" left is the **prep-line replace hint** (§5.2).

### 5.1 Unit reconciliation (`PCW` — pieces-to-grams for the Handover)
When the row unit differs from the recipe unit:
- row in `pc`, need in `g/ml` → `haveC = have × PCW[canon]`
- row in `g/ml`, need in `pc` → `reqC = req × PCW[canon]`

`PCW` (g per piece, Handover's own table): carrot 65 · onion 120 · tomato 80 · potato 120 · lemon 55 · cucumber 130 · beetroot 100 · zucchini 200 · capsicum 100 · avocado 150 · muskmelon 900 · orange 120 · apple 150 · pear 150 · kiwi 75 · banana 100 · cherry tomato 15 · green chilli 5 · spring onion 15 · eggs 50 · **default 100**.

> Note: these differ slightly from the dashboard `GPP` table (e.g. carrot 65 vs 70, onion 120 vs 100). Both are estimates; the new model should unify them into Master FnV `g / piece`.

Consumption is written back in the **row's** unit (`back = used / PCW` when the row is in pieces).

### 5.2 Prep lines (`class === 'p'`)
Lines that are preparation for a *later* meal (soak, thaw, marinate) are **checked for availability only — never consumed** (the consumption happens when the dish is cooked, per the soak-time rule). States: `OK · <have>` / `SHORT n · have x` / `Out` / `Not available` + a `↔ replace with: <name>` hint from `hovSuggest` when nothing matches. `hovSuggest` scores live ledger rows by shared tokens **or** shared `HOV_FAM` family (gochujang/schezwan/chilli-paste; vinegar; soy/tamari; honey/jaggery/sugar; curd/yogurt/skyr/greek/hung; cheeses; pasta/noodles; ghee/butter; plant milks).

---

## 6. The Cart

`CART[key]` (key = resolved row name, else canon) accumulates across the simulated days:

```
{ disp, ask, unit, state, have, haveUnit, need, order, byday:{Mon:n,…}, for:["Tue|Tue 16 Sep Lunch · Chicken curry", …], rows:[…] }
```
- `byday[day]` = quantity **to order** for that day (`reqC − haveC` for shortfall, `reqC` for none/unknown).
- `state` is the **worst** state seen for that item (`ok < short < none < unknown`).
- `for` lists every dish that needs it, so the cook can see why.
- **Day filter:** `HOV_CARTDAYS` (toggled by clicking day headers) selects which days feed the cart; default is the current handover day.
- **Copy cart** (`hovCartCopy`) produces a plain-text list `Item — qty unit (for: …)` for pasting into a grocery app or Slack.
- `__HOV_OK` collects lines that were fine, so the smart list can show "Enough ✓".

---

## 7. Export to Excel (`hovExportXlsx`) — mirrors the operations team's "Ingredient handover – Umami" sheet exactly

One workbook, **one sheet-tab per selected day**, named by weekday. Layout per tab (verified against the Umami reference, gid 1776106857):

```
row 1 : "<weekday> - <date>"                                   (merged A1:K1)
row 2 : Breakfast | | | | Lunch | | | | Dinner | |             (merged A2:C2, E2:G2, I2:K2)
row 3 : Ingredients | Availability | Status | | Ingredients | Availability | Status | | Ingredients | Availability | Status
row 4+: per meal block (3 cols + 1 spacer col): dish name on its own row (bold), its ingredients below,
        one blank row between dishes
```
Column widths: 26 / 26 / 18 / 3 repeated.

**Availability** (cols B/F/J) is **pre-filled** with the app's call, mapped: `ok → Available in inventory`, `short → Low`, `none → Not available in inventory`, `unknown → Don't know`. Every ingredient cell carries a dropdown with exactly those four values.

**Status** (cols C/G/K) is left blank with a dropdown of the team's cart list:
`Blinkit, Swiggy Instamart, Zepto, FirstClub, Fresh2Home, Licious, Big Basket, OOS, Amazon, Can Skip, Check with Staff`.

Dish-header rows are bold and carry **no** dropdowns. File name: `Ingredient_handover_<house>_<week>.xlsx`. Requires the Handover to be open on a day with a plan (`__HOV_BREAK` populated); otherwise a toast says so.

---

## 8. Locking closed days

When a day's date appears in `Meals` (i.e. it was closed) — or it is in the past and a lock snapshot exists — the Handover **does not re-simulate it**. It renders `hovLockOf(house)[day].data[slot]` (the frozen breakdown rows saved at close) with `✓ done · consumed on the day` / `locked` chips, or, if no lock data exists, the plan's dishes with the same chips and no state calls. This keeps the historical handover stable regardless of later stock changes, and prevents a past day from consuming the ledger that today's planning needs.

---

## 9. Recipe links

- The recipe bridge returns the **exact link** from the sheet for every matched dish (the v4 script fixed a bug where the link column was never returned, so everything fell back to search).
- UI shows a direct **▶ Recipe** link when present; only when the sheet has no link does it show **Find on YouTube** (a search URL built from the dish name).
- **Copy YT** copies the link; **Copy all** copies the day's links as a list.
- Because enrichment is cached, a dish enriched *before* a sheet fix keeps its old (link-less) entry until **⟳ Sync meal plan** clears the cache.

---

## 10. Relationship to the other features

| Feature | Link |
|---|---|
| **Deduction logic** | The Handover is a *forecast* of exactly the deductions the close will make — same resolver (`ppSkuCandidates`), same norms (`PP_QTY` × pax × factor), same soak/prep discipline. The close writes the ledger; the Handover previews it. |
| **Portion / factor** | `hovPPQty` applies the household factor; Yash's 0.5-person rule flows through here. |
| **Smart List** | Reuses `__HOV_OK` and the cart to build "Need to order for sure / Genuinely low / Enough". |
| **Use priority** | Independent today; recommended to feed `days_to_use` into dish ordering hints. |
| **Snapshots / locks** | Closed days render from lock data, not from live stock. |
| **Chatbot `need` intent** | "enough for X for 4?" runs the same state logic for one dish. |

---

## 11. Recommendations for the new model

1. **Unify `PCW`, `GPP` and Master FnV `g / piece`** into one table.
2. Keep the **four honest states** and the human-decides cart; do not reintroduce silent substitution.
3. Persist the **lock breakdown** as structured rows (not HTML) so the Excel export can be regenerated for past days.
4. Store enrichment with a **recipe-sheet version** rather than a manual cache-prefix bump.
5. Let the cart export **per-day quantities** (it already tracks `byday`) into the Excel `Status`/notes column.
