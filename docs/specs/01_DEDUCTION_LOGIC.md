# PantryPulse — Deduction Logic (complete specification)

> Source of truth for how ingredients come off a household's board when a meal is cooked. Extracted from the live codebase (`pp_deduct.py`, the app's `ppResolveAll` / `ppSkuCandidates` / `ppBestRow`, and the `Deduction method` sheet) as of build v21_713 / MASTER_902, 17 Sep 2026. Nothing here is aspirational — every rule below is what the current system actually does.

---

## 0. What a deduction is

A deduction is a **calculation with a stated reason**, never a guessed round number. For each dish cooked on a day, for each ingredient in that dish, the engine:

1. Works out how much is **needed** (see the Portion / Factor spec — `02_SKU_PORTION_FACTOR_CALIBRATION.md`).
2. **Resolves** the ingredient name to one physical row on the household's board.
3. **Takes** `min(need, available)` from that row — never more than is there, never below zero.
4. Writes a **ledger line** with before/after and the reason.
5. Refuses to do the same `(household, date, dish, SKU)` twice.

Everything else in this document is detail on those five steps.

---

## 1. The formula (from the `Deduction method` sheet — authoritative)

```
1) need   = portion_per_person × eaters × dish_intensity
2) deduct = min(need, available)                         — NEVER exceed what is in stock
3) if (available − deduct) <= orphan_threshold(role):
       deduct = available                                — use it all, don't leave a useless scrap
4) if available == 0:
       deduct = 0  and  FLAG                              — item not present; do not invent it
5) if several interchangeable variants exist (e.g. 3 capsicum colours):
       split need across them PROPORTIONALLY to availability so they deplete evenly
```

### Hard rules (verbatim from the sheet)
- **A)** Log **dish-wise** — each dish gets its own ingredient breakdown line, never one lumped slot line.
- **B)** Cap every line at available stock; **never deduct a zero-stock SKU**.
- **C)** Use fresh perishables fully and generously, especially veg bought within ~1 day for that dish (Indian home-cooking norm).
- **D)** Split across the variants actually in the fridge (all pepper colours etc.), proportional to availability.
- **E)** Match the **real SKU that was bought** (e.g. millet noodles, not atta noodles).
- **F)** Every deduction carries a one-line reason: *role × eaters × intensity*, plus any capped/cleanup note.

---

## 2. Resolving an ingredient name to a board row

This is where most of the intelligence lives. A plan says "tomato"; the board might have `Tomato`, `Tomato (g)`, `Cherry tomato`, `Tomato ketchup`, `Tomato paste`. The resolver must pick the right one — and refuse the wrong ones.

### 2.1 Canonicalisation (`_canon` / `ppNorm`)
```
lowercase → strip anything in parentheses → keep only [a-z0-9 space] → collapse whitespace → trim
```
`"Tomato (hybrid + desi)"` → `"tomato"`. `"Chicken breast (Licious)"` → `"chicken breast"`.

### 2.2 Plural / spelling forms tried (`_forms` / `_pl` / `_var`)
For a term `t`, the engine tries all of: `t`, `t` without trailing `s`, `t + "s"`, `…ies → …y`, and spelling variants `dried↔dry`, `chilly→chilli`, `chili→chilli`, and `t` with the word `whole` removed.

### 2.3 The three-tier match, in strict priority order

Candidates are collected into three buckets and returned as **exact + alias + substring** (in that order — an exact hit always outranks an alias, which always outranks a substring).

| Tier | Test | Example |
|---|---|---|
| **1. Exact canon** | `row.canon == term` or same with spaces removed | `"green chilli"` → row `Green chilli` |
| **2. Alias** | term ∈ the row's `Aliases` set (pipe-separated in `SKU Knowledge`) | `"kothmir"` → row `Coriander` |
| **3. Guarded substring** | `len(term) >= 3` and (`term in canon` or `canon in term` or `last word of canon == term`) | `"chilli"` → row `Green chilli` |

Source rows come from the **`SKU Knowledge`** sheet (one row per board SKU per household): `Household | Sheet | Row | SKU | Category | Unit | CanonKey | Aliases | NeverMatch | UsageNote`. The `Row` column is the physical row number on that household's board, so resolution lands on a specific cell.

### 2.4 Guards that block a match (applied *before* the tier test)

**(a) Dead rows.** Any `SKU Knowledge` entry whose `UsageNote` contains `DO NOT USE` is skipped unconditionally.

**(b) Never-match words.** Each row carries a `NeverMatch` list (pipe-separated). If **any** never-match word appears in the term, that row is skipped. Also (app-side): if a never-match word appears in the row's own canon key but *not* in the term, skip. This is how `Coriander` (fresh) refuses the term "coriander powder".

**(c) Class-word discipline.** The class words are:
```
powder, masala, oil, sauce, paste, pickle, chutney, flour, syrup, ketchup, achaar, seeds
```
"Soft" class words (may be forgiven): `powder, masala, flour`.

Rule: compute the set of class words in the term and in the row's canon. If they **differ**:
- if the row has a *hard* extra class word (anything not in the soft set) → **reject**. A base ingredient never resolves to its oil / sauce / paste / pickle / chutney / syrup / ketchup form.
- if the only extras are soft (powder/masala/flour) → forgive **only** when the term is the *head* of the row's name (first word, or text before a `/`). So "dhaniya" may reach `Dhaniya powder` only if nothing better exists and dhaniya is the head — in practice the fresh row wins on tier 1 first.

**(d) BAD list (app-side resolver).** Processed / snack / derivative look-alikes are never the ingredient unless the term itself is one:
```
sauce|chips|snack|seasoning|masala mix|instant|premix|ready|namkeen|papad|pickle|achar|jam|syrup|essence|extract|candy|biscuit|cookie|chikki|popcorn|mojas|fries|wafer|hungritoes|latte|milkshake|laddu|ladoo|chocolate|pasta|noodle|bread|cake|flakes
```

**(e) Per-family EXCL (app-side resolver).** Family-specific words that mark a *different* ingredient sharing a token. The full table is in the code; the important ones:

| Family | Excluded words (row rejected if it contains these and the term doesn't) |
|---|---|
| `methi` (fresh) | kasuri, kasoori, kasturi, seed, dana, dried, dry |
| `kasuri methi` | leaves, fresh, hari, seed, dana |
| `methi seeds` | kasuri, kasoori, kasturi, leaves, fresh, hari |
| `coriander` / `dhaniya` (fresh) | powder, pwd, seed, whole, sabut, dana |
| `coriander powder` | seed, whole, sabut, leaves, fresh, hara |
| `coriander seeds` | powder, pwd, leaves, fresh, hara |
| `mushroom` | dried, dry, tea, powder, soup |
| `mint` / `pudina` | dried, tea, chutney, candy, masala, paste, sauce, spearmint |
| `blueberry` | yogurt, yoghurt, jam, syrup, muffin, cake, epigamia |
| `strawberry` | yogurt, yoghurt, jam, syrup, milkshake |
| `chana` | dal, masala, roasted, kala, kaala, black, brown, desi, besan, flour, frozen, peas |
| `kala chana` | dal, masala, roasted, kabuli, white, chole, frozen |
| `chana dal` | masala, kabuli, kala, kaala, chole, besan |
| `moong` | phali, peanut, dal (unless exact) |
| `moong dal` | whole, sabut, green, sprout |
| `moongphali` (peanut) | oil, butter, laddu, ladoo, chocolate, chikki, moong, sauce |
| `aloo` (potato) | sweet, chips, popcorn, mojas, fries, wafer |
| `chawal` (rice) | flour, atta, poha, bran, paper, vinegar, noodle, cake, puff, crisp |
| `doodh` (milk) | almond, coconut, oat, soy, soya, bread, shake, powder, maker, condensed, chocolate |
| `dahi` (curd) | gur, jaggery |
| `nariyal` (coconut) | oil, milk, cream, water, powder, sugar |
| `lehsun` (garlic) | oil, powder, paste, bread, sauce, chutney, pickle |
| `adrak` (ginger) | paste, powder, tea, garlic, ale, candy |
| `tamatar` (tomato) | ketchup, puree, paste, sauce, dried, cherry, soup |
| `pyaz` (onion) | powder, petals, fried, pickle |
| `hari mirch` / `mirch` | sauce, paste, pickle, powder |
| `nimbu` (lemon) | lemoneez, juice, tea, pickle, squash, grass |
| `kela` (banana) | chips, raw, flower, stem, wafer, milkshake |
| `anda` (egg) | eggplant, plant, less, coriander |
| `murgi` (chicken) | masala, stock, sauce, dog, pet, zoey |
| `machli` (fish) | sauce, oil, pickle |
| `kaju` | katli, barfi, sweet |
| `badam` | milk, oil, flour, butter |
| `chini` (sugar) | free, candy, cane |
| `namak` (salt) | lemon, chaat, pink |
| `til` (sesame) | oil |
| `jeera` | rice, aloo, masala, soda, water, biscuit, pulao |

**(f) Whole-token family check.** When a family is known, the row must carry a family word as a **whole token** (or a >4-char prefix match). This kills `patta → atta` and `anda → coriander` style false hits.

### 2.5 Families (`PP_SYN` — 163 groups)

The family dictionary maps Hindi / regional / English / brand variants to one group. The **first entry is the canonical key** (used for EXCL lookup and as the display fallback). Examples:

```
['jeera','zeera','cumin','cumin seeds','jeera powder','cumin powder']
['dhaniya','dhania','coriander','coriander leaves','cilantro','kothmir','kothamalli','hara dhaniya', …]
['coriander powder','dhaniya powder','dhania powder','coriander pwd', …]      ← separate family from fresh
['coriander seeds','dhaniya seeds','sabut dhaniya','whole coriander', …]      ← separate again
['methi','fenugreek','methi leaves','fresh methi','hari methi']
['kasuri methi','kasoori methi','kasturi methi','dried methi','dry methi']
['methi seeds','methi dana','fenugreek seeds','vendhayam']
['chawal','rice','sona masoori','basmati','matta rice','brown rice','arisi']
['idli rice','idli rava','idli dosa batter','dosa batter','idli batter']
['oats','rolled oats','oatmeal','quaker oats']
```

**Design point:** fresh / dried / seed / powder forms of the same plant are **different families**. That is deliberate — it is the mechanism that stops fresh methi from being consumed when a recipe wants kasuri methi.

`ppFamilyOf(term)` looks up: exact normalised term → tokenised term → singular → then the **longest family word contained in a multi-word term** (≥4 chars, whole-word). So "fresh coriander leaves" resolves to the `dhaniya` family via the contained word "coriander".

### 2.6 Choosing among several matching rows — `ppBestRow`

When a household has multiple rows for the same item (a very common real-world state: `Chicken breast`, `Chicken breast (Licious)`, `Chicken breast (older lot)`), the resolver picks one by:

1. **Live beats zero** — any row with `q > 0` outranks any row at 0.
2. **More recently checked beats older** (`Last checked` string compare) when both are live.
3. **Larger quantity beats smaller** as the final tiebreak.

Result: an empty skeleton row never shadows a live row of the same item.

> **Known gap (open as of 17 Sep):** the Python `Deductor._resolve` returns candidates in tier order but the *deduct* loop takes the first candidate with `q > 0` in that order — it does not re-sort by `ppBestRow`. In practice the exact-canon row is usually the live one, but this is why occasional "flagged 0 while a live same-item row existed" misses happened (e.g. Disha `Oats` 0 vs `Rolled oats` 300). **The new model should apply `ppBestRow` ordering inside the deduct loop, not just in the UI.**

### 2.7 Protein FIFO (from `Deduction method`)
A **generic** protein word in a plan ("fish", "chicken", "meat") must deduct from the **oldest-bought lot first**, not the first name-match. If several SKUs share a cut/species, draw them down in purchase-date order until the need is met. Vendor names within one cut are the same pile (`Chicken breast (Licious)` = `Chicken breast (older lot)`), but **different cuts / species are never merged** (breast ≠ thigh ≠ curry cut ≠ mince/keema; basa ≠ catla).

**Operator ruling (14 Sep):** when an item has an older lot *and* a fresh lot of the *same thing* (e.g. yesterday's tomatoes and today's 1 kg), consuming the **older lot first is correct** — do not redirect a deduction onto the new lot just because it arrived before cooking.

### 2.8 Chicken SKU normalisation (from `Deduction method`)
- Chicken breast is **one SKU per household** regardless of vendor; canonical name `Chicken breast (boneless)`.
- A physical count of "chicken" clears **all** breast rows, not just the one that matched (prevents phantom vendor rows surviving a count).
- Cuts never merge across each other.

---

## 3. Units

### 3.1 Convertible pairs (`CONV`)
```
kg → g  ×1000        g → kg  ×0.001
l  → ml ×1000        ml → l  ×0.001
```
Anything else is a **hard mismatch**: the candidate is skipped with the note `unit mismatch: asked X, row is Y`, and the engine moves to the next candidate. It **never** subtracts grams from a piece row or vice versa.

### 3.2 Piece ↔ gram estimation (`GPP`)
The UI holds a grams-per-piece table used for *display estimates and smart-list projection* (not for the ledger). Values in use:

| Item | g/pc | Item | g/pc | Item | g/pc |
|---|---|---|---|---|---|
| Apple | 150 | Avocado | 170 | Baby corn | 150 |
| Banana / Yellaki | 50 | Beetroot | 150 | Brinjal | 200 |
| Broccoli | 300 | Carrot | 70 | Cherry tomato | 100 |
| Cucumber | 200 | Garlic | 50 | Guava | 200 |
| Kiwi | 75 | Lemon | 50 | Lemongrass | 50 |
| Mandarin / Orange | 130 | Mango | 200 | Onion | 100 |
| Pear | 150 | Pomegranate | 200 | Potato | 150 |
| Radish | 100 | Spring onion | 100 | Sweet corn | 150 |
| Sweet potato | 150 | Tomato | 100 | Zucchini | 280 |
| Capsicum (any colour) | 125 | Litchi | 15 | Longan | 10 | Plums | 60 |

When a plan states grams and the only live row is in pieces, the *smart list* converts via GPP to judge sufficiency. The *deduction engine* does **not** convert — it flags `UNIT MISMATCH` and lets a human decide.

### 3.3 The grams-as-pieces bug and its guard
Historic bug: "40 g carrot" once deducted as 40 *pieces*. Two guards exist:
- **Engine:** unit mismatch is a hard skip (§3.1).
- **Deduction Audit (in-app + at build):** on every close, for any `pc`-unit produce item touched that day, `ceiling = max(2.0, 1.2 × pax)` pieces removable in one close. If `pieces_removed > ceiling`: a fractional remainder (e.g. `2.58 pc`) → **HIGH** (blocks the build, must fix); taken to exactly 0 → **REVIEW**; else → **REVIEW**. Additionally any `pc` item left at an odd fractional value (`0.05 < frac < 0.95`) on the close date is flagged as a probable g→pc over-deduction.

---

## 4. The ledger (`Deductions` sheet)

Every attempt — successful or not — writes one row:

```
Household | hid | date | dish | SKU | qty_taken | unit | before | after | reason
```

Reason conventions:
- Successful: the caller's `why` (e.g. `2 pax`, `Skye`, `0.5 person`) + `(converted 1kg -> g)` if a unit conversion happened + ` [SHORT: needed 350g]` if `take < need`.
- **`NO STOCK — <why>`**: all candidates were at 0. `qty_taken = 0`.
- **`UNIT MISMATCH — <why> — candidates skipped: A (asked g, row is pc); …`**: candidates existed but none was unit-compatible. `qty_taken = 0`.
- **`NO ROW — <why>`** (close scripts): nothing on the board matched at all.
- **Soak notes:** `deduct(..., qty=0, why='at soak')` or `Deductor.note()` records that an item was deliberately *not* deducted today.

### 4.1 The one-deduction rule (`_already_deducted`)
Before writing, the engine scans the ledger for an existing row with the same `(household, date, dish, SKU)` and `qty > 0`. If found, it **refuses** and reports `SKIP … refusing to double-deduct`. Origin: on 3 Sep 2026 a script ran twice and produced 53 double deductions across 8 households; this guard makes that class of error impossible. Re-running a close is therefore safe.

### 4.2 Board-row side effects on success
```
col 3 (Quantity)     = after   (integer if whole)
col 5 (Status)       = 'in' if after > 0 else 'out'
col 9 (Last checked) = date
col 11 (Note)        = 'DD-Mon: -<take><unit> <dish>'
```

---

## 5. Timing rules that decide *whether* something is deducted today

### 5.1 Soak-time discipline
Legumes, grains and nuts that are **soaked the day before** are deducted **at soak**, and **never again on the cooking day**. Applies to: moong (whole/split), rajma, kabuli chana / chole, kala chana, toor, urad, ragi, red rice / idli rice, almonds, oats (overnight), foxtail millet, tamarind. A plan note like `(soak rajma)` on day D means: deduct rajma on **D**, and on D+1 when the rajma dish is cooked, write a zero-quantity note `soaked — at soak`, not a second deduction.

### 5.2 Marinate-time
Same principle for proteins marked `(marinate chicken)` — the protein comes off when marinated, and the cooking day carries a note.

### 5.3 Order-before-cooking
When an order **arrives before the day's meals**, book the order **first**, then deduct. This changes outcomes for items that were at 0 before the delivery (the meal is no longer "short"). Per §2.7, it does **not** mean the meal must consume the new lot — older lot first is still correct.

### 5.4 Paused households
A paused household (currently Kartik & Dhara, Paxal & Sana) shows a banner and is **excluded from the daily close**. Convention in practice: their plan is still deducted "for the record" so the board stays truthful, but their flags are never reported as actionable gaps.

### 5.5 Blank plans
If Emergent has no text for a slot, nothing is deducted for that slot. If a whole day is blank for a household, the close is recorded as `orders-only / no meals`. **The operator can also override**: "Disha — nothing was cooked Monday" → all of that household's deductions for the day are **reverted** (quantities added back, ledger rows deleted, close note updated).

### 5.6 Weekday derivation
Close on the **actual weekday of the date**, never on the day label the operator used. (Two closes had to be redone after a Sunday/Monday and Sunday/Sunday misread. Derive `weekday = date.strftime('%a')` and read that row from Emergent.)

---

## 6. Order vs count (from `Deduction method`, added 6 Aug)

| Operation | Effect on the row |
|---|---|
| **ORDER** | `new = existing + ordered` — an order **adds**. |
| **COUNT** | `new = counted` — a count **overwrites**. |
| Order in a different unit | **Convert then add** (e.g. row 33 g + 1 capsicum ≈ 120 g = 153 g). Never swap the unit and overwrite. |
| Order in grams hitting a **piece** row | Create a separate `<Item> (g)` row rather than mixing units. (Then merge later when a count states one unit.) |
| Changing a row's unit | Only when a **count** states it in that unit. |

Applying an order as a replacement silently discards stock (5 Aug: lost 133 g of h4 capsicum).

---

## 7. Conversions — a processed form is NOT a new SKU (`Conversions` sheet)

| From | To | Same stock? | Handling |
|---|---|---|---|
| pomegranate | peeled pomegranate | yes | one row, don't duplicate |
| garlic | peeled garlic | yes | one row |
| coconut | grated coconut / coconut chunks | yes | one row |
| curd | hung curd | yes | one row |
| paneer | grated paneer | yes | one row |
| ginger | ginger-garlic paste | partial | ginger consumed *into* the paste |
| milk | curd / paneer | **consumes** | deduct milk, record output as a made item |
| cream | butter | **consumes** | deduct cream |
| tomato | tomato puree | **consumes** | deduct tomato |
| lemon | lemon juice | **consumes** | deduct lemon |

Never hold both the full raw quantity **and** its output from the same stock.

---

## 8. Overwrite protection — everyday aromatics (from `Deduction method`, 4 Sep)

A vegetable/fruit **count/overwrite must not auto-remove everyday aromatics** just because they are absent from the counted list:
```
green chilli, curry leaves, coriander, mint, ginger, garlic, onion, potato
```
Keep them at their existing value and **flag for confirmation** instead of zeroing. (Extended 16 Sep after dairy-weighted lists stripped staple veg on two households: a list clearly weighted to one category must not silently wipe staples in other categories.)

**Operator rule (16 Sep):** on a perishable overwrite, items not in the photo → 0, **except** items that still had a high quantity (≥250 g/ml, ≥3 pc, or a large pack) — keep those back, since they were unlikely to have been fully used.

---

## 9. Duplicate rows

Genuine duplicates (same product split across rows, typically `Tomato` 3 pc + `Tomato (g)` 1000 g after an order) are **merged into one row** — convert pieces at ~100 g/pc for aromatics when combining. Genuinely different products **stay separate**: brands (Del Monte vs Figaro olive oil, Nandini vs Akshayakalpa milk), people (Disha's vs Anirudh's protein powder), forms (whole vs split urad, hard vs soft tofu), flavours (millet-pancake variants). When a merge zeroes a row, **delete the empty row** rather than leaving a 0 skeleton, otherwise a stale cache can show two entries.

---

## 10. Per-household consumption overrides (see Factor spec for detail)

- **Yash & Manik (h10):** deduct at **0.5 person total** for the household regardless of plan pax. Multiply the per-person norm by 0.5 (not by pax). Plan-stated grams are also scaled by `0.5 / pax`. Whole items round **down**.
- **Paxal & Sana (h7):** 200 g paneer per paneer meal for 2 people.
- **Pratik & Sakshi (h8):** count-driven; lunch is 6 pax (2 family + 4 staff) — staff lines are deducted separately (`L staff …`).
- **Rahul & Radhika (h5):** 3 pax including Skye; Zoey (dog) chicken is a separate row, never touched by human meals (guard word `dog|pet|zoey`).
- **Guest counts** are read live from Emergent's per-slot pax (e.g. Munz 4 pax on 15–17 Sep, Piyush 4 pax on 17 Sep) and applied as the `eaters` multiplier.

---

## 11. Close-day pipeline (`close_day`)

```
for each household:
    plan = Emergent[week][weekday_of(date)]            # B / L / D text + per-slot pax
    for each dish in each slot:
        ingredients = recipe layer (Recipe Master / final-recipes sheet) → per-person rows
                      else text-derived via PP_SYN families
        for each ingredient:
            need = portion × eaters × intensity × household_factor
            Deductor.deduct(house, hid, date, "<slot> <dish>", [(term, need, unit, why)])
    write Meals row: "<house> — <Weekday> <date> CLOSED. <orders>. <blanks>. <pax notes>."
write History row summarising the day
snapshot boards → 'Board Snapshots' (see Snapshots spec)
rebuild HTML, boot-test, push
```

Flags surfaced after each close, in this order of importance: **wrong-row hits** (fix immediately), **genuine 0-stock gaps** (report to operator), **piece-row "SHORT" artefacts** (relabel as `piece row — not short`), **paused-household flags** (ignore).

---

## 12. Quick reference — what the engine will NOT do

- Deduct from a row at 0 (flags instead).
- Subtract grams from a piece row or vice versa.
- Go negative.
- Deduct the same (household, date, dish, SKU) twice.
- Resolve a base ingredient to its oil / sauce / paste / pickle / chutney / syrup / ketchup / snack form.
- Resolve fresh methi/coriander/mint to their dried / seed / powder forms (or the reverse).
- Touch a `DO NOT USE` row.
- Consume Zoey's chicken for a human dish.
- Deduct a soaked legume twice.
- Invent an ingredient that isn't on the board — it records `NO ROW` and moves on.
