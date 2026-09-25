# Handover — LIVE reference (pantrypulse-web-phi.vercel.app, build v21_1208, captured 19 Sep 2026)

Captured signed-in across all 29 households (10 with live boards: y24, y16, h9, y30, y27, y14, y41, y26, y31, y39). This is the ground truth the IGHO tab replicates.

## Page, top to bottom (y24 Karthik & Astha, 21-Sep selected)
1. **H1** household name.
2. **AS AT banner** (amber, only with `?asOf=`): "AS AT 23:30 ON 2026-09-15 — The seven nights after 2026-09-15, simulated against the shelf the ledger says was there and each day's own planner week — what this board would have shown you that evening. The shelf is what the ledger can prove, not a photograph. **The recipes are today's**: quantities come from the baked recipe table, so a card edited since then prices at its current numbers." Header has `as at 23:30 on [date] [Now]`.
3. **Combined card**: eyebrow `INGREDIENT HANDOVER · SUN 20 SEP — SAT 26 SEP` · H2 **What to buy** · sub "Tick the days you are cooking for. One list: what the recipes ask for, what the kitchen holds now, and which dishes each thing is for." · right: big number **159** "to buy this week" (rose card).
   - grey line: "Stock is the shelf as it stands now. The ledger is settled through **2026-09-19**, so those days are history and are not re-simulated · plan **2026-W38** · **4** eating"
   - **day chips** `Mon 21 Sep / 23 short` (selected = solid green), one per open day with a plan
   - **Quick pick**: Whole week · Next day · Next 3 days · Clear
   - **filter pills with counts**: ● 19 Not available · ● 1 Expired · ● 2 Low · ● 16 Available · ☐ Only what is short · [Copy] [Excel]
   - "38 of 38 ingredients shown · 1 day ticked"
   - **table**: AVAILABILITY | INGREDIENT | REQUIRED | IN KITCHEN | TO BUY | FOR WHICH DISHES. Row has a thin left border in status colour; pill in col 1; `★Curd (cooking)` + "On the shelf as Curd" (multi: "Cow Milk + Akshayakalpa Organic A2 Milk (pouch) + …"); IN KITCHEN red when 0; TO BUY bold; dish chips `★Cucumber raita · L · 360 g` (lilac tint).
   - cap 25 → button **"Show the remaining 13 — smaller amounts, further down the list"**
   - **MENU DECISION** card (rose): "6 dishes cannot be cooked as planned — ★ is the ingredient the Recipe Master says the dish is built on. Without it the dish is a different dish — so this is a menu decision, not a shopping one. Buying what is in the list above clears most of it." 2-col grid: `Cucumber raita  MISSING Curd (cooking)`.
4. **THE WEEK AT A GLANCE**: 7 tiles `Mon 21 Sep / 23 to buy` (rose), `Sun 20 Sep / Nothing recorded` (grey), `No meals`, `All in stock`.
5. **One card per day**: H2 `Mon 21 Sep` · **Short for this day** chip panel (`Whipped cream 5 ml`, `Eggs 4 pc`) · eyebrow BREAKFAST/LUNCH/DINNER/EVENING SNACKS · dish `Poha ▶` (red YouTube badge) · rows: pill Have/None/Short/Expired/Unit | `★Flattened rice` + "On the shelf as DeHaat Navsari Poha Thick" | `110 g` | grey "available/not available".
6. **Footer paragraph**: "The week is walked in order against ONE running copy of the shelf … Quantities come from the bake's recipe table (OUT_v21_1208.html) through the app's own splitter; stock is inventory(); the simulation is the app's own hovSimDay. Days up to 2026-09-19 are settled ledger history and are never re-simulated. A spoiled ingredient is reported as expired rather than missing (Rule 126)… Not built: the per-day cart checkboxes and Sync from the old board — those write, and this is read-only for now."
7. Empty states: "No open days with planned meals — the whole week is settled." · **NOT PLANNED YET** amber: "The planner has no menu for **2026-W39**, so those days are blank below — not stale. Add the week in the planner and this board fills in."

## Back end (observed)
- SSR Next.js page at `/h/<code>/handover[?asOf=YYYY-MM-DD]`; household codes y20…y46, h9, vs204, c204.
- Excel: `POST /api/handover/xlsx  {code, dates:[ISO…], shortOnly:bool, only:string|null}` → xlsx (generator = pack-1 `handover-workbook.ts`: Status · Ingredient · Unit · Required · In kitchen · To buy · Built on · Past use-by · On the shelf as · For which dishes; fills ok E8F0E8 / short FBEFD6 / no FBE3E0 / unit EFF1EE).
- Copy cart (exact):
```
Buy for Mon 21 Sep:
* Curd (cooking) — 600 g
Bottle gourd — 140 g
…
Bin first (past use-by):
  Milky Mist UHT Cream 190 ml

*  the dish is built on it
```
  (heroes first with `*`, then non-heroes; quantities via q(); "Bin first" from expired rows.)
- Numbers: recipe table PP_NEEDS (bake OUT_v21_1208) via `ppNeedsFor`; stock via `inventory()` pooled by food; simulation `hovSimDay` in order; closedThrough from ledger; per-household `pax` from the plan ("4 eating").

## Reference stats captured (all live boards, 19 Sep)
| code | settled | plan | eating | NA/Exp/Low/OK | shown | menu decision | no recipe |
|---|---|---|---|---|---|---|---|
| y24 | 2026-09-19 | W38 | 4 | 19/1/2/16 | 38 of 38 | 6 | – |
| y16 | 2026-09-19 | W38 | 2 | 8/–/3/20 | 31 of 31 | 2 | 2 |
| h9 | 2026-09-19 | W38 | 2 | 18/2/2/10 | 32 of 32 | 6 | 2 |
| y14 | 2026-09-19 | W38 | 2 | 16/5/1/14 | 36 of 36 | 3 | – |
| y41 | 2026-09-19 | W38 | 3 | 17/–/3/29 | 49 of 49 | 3 | – |
| y30 | 2026-09-19 | W38 | 1 | 1/–/1/23 | 25 of 25 | – | – |
| y39 | 2026-09-19 | – | – | settled, W39 not planned | – | – | – |
