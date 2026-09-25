# Fetching recipes for the pilot households — the sheet, the lookup, and the brackets

Why your board says *No recipe*, and what to do about it. Pilot households only: **y26 y27 y30 y31
y32 y35 y40 y41**, reading `Final Recipes Sheet`, not the estate master.

Nearly every "no recipe" is one of three things, and they need different fixes:

| symptom | cause | fix |
|---|---|---|
| Dish is in the sheet, board can't find it | your lookup is exact-match only | §2 — there are **four** tiers |
| Found the dish, quantities wrong or a food missing | the bracket | §3 |
| Truly absent from the sheet | nothing to fetch | add a card |

**The largest single cause is #1.** The planner does not write dish names the way the sheet does, and
it never will. `Chicken Biryani` in the sheet arrives as `chicken biryani`, `Chicken biryani (less
spicy)`, `chicken biriyani`, or inside `Roti + chicken biryani`. An exact match finds none of them.

---

## 1. The sheet contract

Ten columns. Only the first five are load-bearing:

```
Dish, Ingredient, Per adult, Unit, Class, Youtube video link, Soaking, Marination, Resting, Source
```

One row per ingredient; a dish is the set of rows sharing a `Dish` value.

- **`Per adult` is per ONE adult.** Multiply by pax yourself. This is the most common factor-of-N bug.
- **`Unit`** is `g` or `ml`, occasionally `pcs`. A unit mismatch against your shelf is "unit clash",
  not "not available" — tell the cook which, because the food is there.
- **`Class`** is `Hero`, `Base` or `Fat`. Hero names what the dish is *built on*. It matters: a rule
  that lets a generic card stand in for a named ingredient uses this to refuse.

Fetch it as CSV (`newplan.EXPORT_URL`). Two refusals to copy, both real:

- **Header check.** Google returns HTTP 200 with a *login page* when a share setting changes. Without
  `'Dish,Ingredient' in first_line`, that reads as "every dish deleted".
- **Change cap.** More than ~60 cards changed at once is a re-authored sheet or a truncated read, not
  an edit. Refuse and keep what you have.

### The per-pax subsheet — you probably do not have this

Tab **`Per pax quantity`**, fetched **by tab name, not gid** (`newplan.PERPAX_URL`) — the master's own
gid has died twice when a tab was recreated; a name survives that.

```
Category, Ingredient, Per pax qty, Unit, Used in dishes, Lowest, Highest, Names this sheet uses
Vegetable, Onion, 50, g, 763, 30, 90, Onion
Vegetable, Cucumber, 60, g, 109, 25, 120, "Cucumber, Cucumbers"
```

This is the authority for **bracket quantities** (§3). Without it you must guess, and the guess — the
median across the master — disagrees on 50 of 294 ingredients.

Check the header. Google silently serves the **first tab** for a name it does not recognise, so a typo
reads as 294 ingredients turning into a list of YouTube links rather than as an error.

---

## 2. The lookup — four tiers, in order. This is what you are missing.

`recipe_sheet.py` → `RecipeSheet.lookup(name)` → `(dish, rows, tier)`. Port this or run it; do not
reinvent it.

1. **exact** — normalised (case, punctuation, spacing, a small synonym table: `avacado`→`avocado`,
   `panir`→`paneer`).
2. **plural** — singularised tokens. `rotis` → `roti`.
3. **modifier** — descriptive words dropped. `Chicken biryani (less spicy)` → `chicken biryani`.
4. **subset** — every token of the *sheet* dish appears in the query. `chicken biryani home style`
   finds `Chicken Biryani`.

Tier 4 is where the money is, and it carries two guards you must keep or it will hurt you:

**RULE 112 — break a tie on the RAREST word, never alphabetically.** `Cucumber, Tomato, Onion +
Beetroot Salad` tied two cards at four tokens each. The old code took whichever the set yielded
first, picked the one with **no beetroot**, and deducted no beetroot while 290 g sat on the shelf —
and could have chosen differently next run for no visible reason. Sum inverse document frequency:
`tomato` is in 2,441 dishes, `beetroot` in far fewer, so beetroot is what the planner was telling you
about. Alphabetical only as a last resort, so it is reproducible.

**RULE 112b — a subset match may not drop a food the planner named.** `Kadai chicken broccoli`
subset-matched `Kadai Chicken` and silently discarded the broccoli. If a candidate leaves a FOOD word
uncovered, refuse it and fall through. **A visible "no recipe" is worth far more than a plausible
wrong recipe** — the first sends someone to fix the sheet, the second quietly under-buys.

The food vocabulary is the sheet's own ~481 ingredient names, so it grows as the sheet does.

---

## 3. Brackets — the part causing your confusion

`Veg upma (with carrots, beans)`. The bracket is **not** part of the dish name and **not** a separate
dish. Get the order wrong and everything downstream is wrong.

### The rule, in one line

> **Fetch the dish first. Then add each bracket food, at its per-pax quantity, times the pax.**

We had this backwards for a long time — looking up "veg upma with carrots and beans" as a unit, which
only worked if that exact combination had been priced before. Four attempts at the inverted version
topped out at 84% with 48 over-buys in 400. The reordering fixed it in one rule.

```
Veg upma (with carrots, beans), 4 people
  1. lookup("Veg upma")          -> the Veg Upma card, per-adult rows
  2. multiply by pax             -> x4
  3. bracket: carrots, beans
       carrots -> Carrot 50 g per pax  -> 200 g
       beans   -> Beans  50 g per pax  -> 200 g
  4. add them to the SAME component, once each
```

### The five ways this goes wrong

**Adding a bracket food twice.** If the card already lists Potato and the bracket says potato, it is
**one** quantity, not the sum. Ours read 280 g (120 + 160) before the fix. Test the card-already-has-it
case explicitly.

**Plural and spelling.** `carrots` must match `Carrot`. Singularise and require **every** word of the
bracket term to be covered — substring matching pairs `peas` with `pear`.

**Treating a prep note as food.** `(thawed)`, `(grind to paste)`, `(clean and chop)`, anything with a
colon, multi-component parts — these are not ingredients. Refuse them. `dishkey._raw_parens` carries
the bracket *as written* and rejects these.

**Negation.** `(no onion)` must *remove*, not add. Both engines have to agree on that.

**The bare salad / juice case (RULE 219).** `Salad (cucumber, tomato)` with no card of its own: the
recipe is *only* the bracket foods. Do not fall back to a generic salad card — that substitutes foods
the planner did not ask for. Ask this question **first**, before any table lookup.

### Where the code is

- **JavaScript: `js/ppsplit.js`** — this is the one you want. `ppPlannerToDish`, `ppMealComponents`,
  `ppRawParens`, `ppBracketFoodsRaw`, `ppBracketAdd`, `ppBracketRefused`, `ppBareBracket`. It is the
  mirror of the Python and a gate proves the two agree on 1,460 live cases.
- **Python: `python/dishkey.py`** (splitting, `_raw_parens`) and `python/recipe_engine.py`
  (`pilot_bracket_foods`, `pilot_bracket_qty`, `pilot_apply`).

`ppsplit.js` expects a lookup table called `PP_NEEDS`. If you are reading the sheet live, replace
those lookups with your own sheet lookup from §2 — the splitting and bracket logic above it is what
you are actually borrowing.

---

## 4. Do not write a second copy of the arithmetic

`needspp_price.price_component()` was **moved** into its own module, not copied, so the nightly table
and the live path cannot drift. Its docstring warned that *"a second copy of this arithmetic is
exactly how the browser and the ledger came to disagree"* — written about a copy nobody had made yet.

If your app has both a server path and a client path, make them call one function.

---

## 5. Getting it working, in order

1. **Fetch the sheet and check the header.** Confirm the row count is in the thousands, not 1.
2. **Port the four-tier lookup** (§2), guards included. Test with a planner name that is *not* the
   sheet spelling — that is the real case.
3. **Fetch the per-pax subsheet** by tab name, check its header.
4. **Brackets last** (§3), in the stated order: dish, then bracket × pax.
5. **Test these five**, which is where ours broke:
   - `Veg upma (with carrots, beans)` — both foods added, per pax
   - a bracket food the card already lists — added **once**
   - `Salad (cucumber, tomato)` — bracket foods **only**
   - `(no onion)` — onion removed
   - `Chicken biryani (less spicy)` — finds `Chicken Biryani`

## What is not here

The ingredient matcher (~2,700 lines) — which *shelf row* a need lands on. That is against our
households' row names and would be wrong for yours. Everything in this pack is about getting from a
planner line to a correct ingredient list; matching that list to your shelves is yours.
