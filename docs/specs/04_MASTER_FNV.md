# PantryPulse — Master FnV (Shelf-Life Reference) — complete specification

> The single source of truth for shelf life, dashboard bucketing, grams-per-piece and produce conditions. Extracted from the `Master FnV` sheet (2 025 rows), the `ppShelfG` resolver, `boxColour`, and the `Use priority` age model as of 17 Sep 2026.

---

## 0. What it is and why it exists

Before Master FnV, shelf life lived in scattered regexes and a hand-typed `SHELF` object that kept drifting from the board. On 24 Aug 2026 the reference was consolidated into **one sheet** and the app was changed to read it **first** for every lookup, falling back to class heuristics only when a SKU is genuinely absent. Every expiry badge, "days to use" value, Use-priority ranking, and the assistant's `age` intent derive from this sheet.

**Rule:** if a SKU's shelf life is wrong, fix it **in Master FnV** — never in code, never per household.

---

## 1. Sheet structure

One row per SKU (canonical or as-seen name). Header on row 1.

| Column | Meaning | Values / notes |
|---|---|---|
| **SKU** | item name as it appears on boards | free text; matched by normalised key (`lowercase, [a-z0-9] only`) |
| **Dashboard bucket** | which board section it renders in | `Vegetable, Fruit, Meat, Meat & fish, Dairy, Bread & bakery, Frozen, Herb, Grains, Dals, Spice, Condiment, Beverage, Staple, Pantry, Nuts & seeds, Pasta, Oils, Snacks, Non-food, Pet, Supplement, Exotic drinks, …` |
| **Staple sub-cat** | finer grouping for the Staple bucket | `Grains, Oils, Beverages, Spices, Condiments, Nuts, …` |
| **Leafy?** | yes/no | drives the leafy-veg logic in priority/smart-list |
| **Fruit?** | yes/no | |
| **g / piece** | grams per piece for count items | feeds `GPP` (see Deduction spec §3.2) |
| **Shelf-life (d)** | days from purchase/entry to "use by" | integer; **the primary value** |
| **Source** | provenance of the shelf-life number | `USDA FoodKeeper / SNAP ext`, `PantryPulse rule 31-Jul-2026`, `spice-industry guidance`, `clarified butter, shelf-stable`, `indefinite when dry; PP class 730`, etc. |
| **Seen-in-cats** | categories this SKU has appeared under on boards | audit aid for bucket drift |
| **Leaf class** | `thick / normal / none` | for leafy greens: thick (cabbage-type) keep longer than normal (spinach-type) |
| **Condition rule** | free-text override | e.g. `WHOLE uncut; once cut 7d, chunks 5d`, `SEASONAL: summer (Mar–Jun) 8d / monsoon (Jul–Sep) …`, `OPEN-AND-USE: sealed = per pack expiry; OPENED = 4d`, `Market-bought peeled cloves — 4d refrigerated` |
| **Opened shelf-life (d)** | days once the pack is opened | populated for open-and-use dairy/drinks (milks, creams, coconut milk, cream cheese …) — typically **4 d** |

---

## 2. Shelf-life classes in use (distribution across 2 025 rows)

| Days | Count | Typical members |
|---|---|---|
| **9999** | 17 | truly indefinite (some salts/sugars flagged as never-expire) |
| **730** | 57 | salt, sugar, jaggery, honey, black salt — "indefinite when dry; PP class 730" |
| **365** | 898 | spices, powders, masalas, oils, ghee, sauces, vinegars, pickles, chutneys, dals & pulses, tea/coffee, baking agents, protein powders |
| **180** | 476 | flours (atta, maida, besan), sooji, rice, quinoa, pasta, noodles, poha, oats, muesli, nuts & seeds, dried fruit, dry coconut → 90 |
| **120** | — | frozen items (parathas, kebabs, puff pastry) |
| **90** | 22 | dry coconut/desiccated, some sealed cheeses |
| **60** | — | garlic (whole), butter, olives, cheddar/mozzarella blocks |
| **45** | — | feta, soft cheeses |
| **30** | 49 | potato, onion, ginger, apple |
| **21** | 18 | carrot, beetroot, lemon/lime, eggs |
| **14** | — | cabbage, bok choy, kiwi, pomegranate, orange/mandarin |
| **12** | 16 | capsicum / bell pepper, beetroot (PP rule) |
| **10** | 57 | tomato, pear, grapes, curd/yogurt/skyr, tofu/tempeh, arbi/colocasia |
| **8** | — | cucumber, broccoli, cauliflower, zucchini, gourds, brinjal, okra, beans, baby corn, sweet corn, peas, edamame |
| **7** | 56 | cherry tomato, fresh herbs (coriander, mint, dill, basil, rosemary, curry leaves, spring onion, parsley), paneer, melons/papaya |
| **6** | 98 | mushroom, amaranth & similar leaves (PP rule 31-Jul) |
| **5** | 49 | spinach/palak/arugula/lettuce/greens, banana, avocado, berries, bread/pav/sourdough/wrap |
| **4** | 60 | milk, batters, basil (PP rule), **opened** milks/creams |
| **3** | 43 | sprouts, some fresh fish |
| **2** | 62 | chicken, prawn, fish, mutton, keema/mince (fresh raw protein) |

Sources are dominated by **USDA FoodKeeper / SNAP-Ed** for produce and pantry, with **PantryPulse house rules (31 Jul 2026)** for Indian-specific items (amaranth leaves, methi leaves, beetroot, basil) and **spice-industry guidance** for ground spices.

---

## 3. The resolver — how a board item gets a shelf life (`ppShelfG`)

Lookup order (first hit wins):

```
1. SHELF[normalised name]          ← generated from Master FnV — checked FIRST
2. LONGSHELF[normalised name]      ← small in-code override map (cheeses, dried shiitake, olives)
3. Fresh-leaf-herb rule            ← 7 d, never falls into the spice class
4. Dry-goods classes (regex)       ← sprout 3 · dry coconut 90 · frozen 120 · dried 365 · salt/sugar/jaggery/honey 730 ·
                                      oil/ghee 365 · spices/masalas 365 · sauces/pickles/condiments 365 ·
                                      dals/pulses 365 · tea/coffee 365 · baking agents 365 · protein/supplements 365 ·
                                      flours/grains/pasta/noodles/rice/poha/oats 180 · nuts/seeds/dried fruit 180
5. Fresh-produce table (regex, first match)  ← potato 30 · onion 30 · garlic 60 · ginger 30 · carrot 21 · beetroot 21 ·
                                      cabbage/bok choy 14 · capsicum 12 · cucumber 8 · cherry tomato 7 · tomato 10 ·
                                      broccoli/cauliflower 8 · spinach/lettuce/greens 5 · fresh herbs 7 · lemon/lime 21 ·
                                      apple 30 · banana 5 · pear 10 · kiwi 14 · avocado 5 · melons/papaya 7 · berries 5 ·
                                      grape 10 · mushroom 6 · gourds/brinjal/okra/beans/corn/peas 8 · paneer 7 ·
                                      curd/yogurt/skyr 10 · milk 4 · butter 60 · cheese 45 · eggs 21 ·
                                      chicken/prawn/fish/mutton/keema 2 · bread/wrap 5 · tofu/tempeh 10 · batter 4 ·
                                      pomegranate/orange 14
6. Default                          ← 7 d
```

**Guard in step 3:** the fresh-herb regex (`coriander|mint|methi|basil|parsley|dill|curry leaf|spring onion|leaves|saag|greens`) is applied only when the name does **not** also contain `powder|seed|dried|dry |masala|paste|sauce` — so `Coriander powder` correctly reaches the 365-day spice class.

**Generation:** the in-app `SHELF` object is **generated from Master FnV** at build time (`SKU → normalised key → Shelf-life (d)`), so the two never diverge. The regex classes in steps 4–5 exist only for SKUs not yet in the sheet.

---

## 4. Age — when does the clock start?

Shelf life alone is useless without an age. The **Use priority** view (which the badge logic mirrors) computes age per item in this strict order:

| Priority | Source | Rule |
|---|---|---|
| 1 | **Opened date** | For open-and-use items (in the `OPENED` map / column L): explicit `Opened on` in the sheet wins; else inferred as *the first meal on/after the latest order that used the SKU*. Age counts from opening; shelf = **Opened shelf-life** (usually 4 d). |
| 2 | **Subscription** | Eggs, plain milk (not plant milks), tender coconut are restocked daily → age **0**. |
| 3 | **Order history** (`_ppOrderMatch`) | The last time a similar SKU was actually bought. Matching is tiered: exact normalised name (score 4) → one contains the other with ≥ 60 % length overlap (3) → ≥ 2 shared significant words, or same head noun (2). One incidental shared word is **not** enough (that once matched green chilli to red chilli). Age = today − order date. |
| 4 | **Capture date** (fallback, flagged) | Oldest of `Last entered` / `Last checked`. A stock count proves presence, **not** freshness, so this is used only when there is no order at all, and the UI marks it *"first seen … · no order record"*. **Counts must never reset age** — that's why the *oldest* stamp is taken. |
| — | none | age unknown → shown as `?` with a red *"no date on record"* warning |

**Stale-date alarm:** if `age > max(14, 2 × shelf)`, the row gets **⚠ check age** — the date on record is almost certainly stale; physically check and re-date.

---

## 5. Turning shelf + age into a badge / a "days to use"

```
safe_days   = round(shelf × BUFFER)          BUFFER = 0.9   (use before 90 % of nominal life)
              (opened items: safe_days = opened shelf-life, no buffer)
days_to_use = safe_days − age
```

### 5.1 Board chip tint (`boxColour`) — uses nominal shelf, not buffered
```
left = shelf − age
left ≤ 3  → red    (rgba(224,138,106,.24), border #e08a6a)
left ≤ 6  → yellow (rgba(224,192,74,.22),  border #e0c04a)
else      → green  (rgba(107,191,107,.20), border #6bbf6b)
```

### 5.2 Use-priority urgency (`urgency(d)`) — uses buffered days_to_use
```
d ≤ 0  → red   "now"
d ≤ 2  → orange
d ≤ 5  → yellow
else   → green
```
Sections: **Overdue** (`d ≤ 0`) · **Use in 2 days** (`0 < d ≤ 2`) · **This week** (`2 < d ≤ 5`) · **Fine** (`d > 5`).

### 5.3 Stored Expiry date (column L on household boards)
Separately from all of the above, a household row can carry an explicit **Expiry** date (col L) and **Bought** date (col M). If present, the board shows it directly and flags **"expired"** when it is in the past. This is a manual override — and a known footgun: a restock does not clear an old expiry, so a freshly bought paneer can show "expired 28 Aug". **Rule adopted 16 Sep:** when a restock or count re-dates a row, **clear any past expiry date** on it. A one-off sweep cleared 7 stale dates across all households.

---

## 6. Condition rules (column K) — how they are meant to apply

These are human-readable modifiers that the new model should encode as logic:

| Rule text | Intended behaviour |
|---|---|
| `WHOLE uncut; once cut 7d, chunks 5d` (pumpkin, melon, coconut) | shelf = base while whole; on a "cut" qualifier or a made-item row (`Cut pumpkin`) use 7 d / 5 d |
| `SEASONAL: summer (Mar–Jun) 8d / monsoon (Jul–Sep) 5d / winter 12d` | pick the band from the current IST month |
| `OPEN-AND-USE: sealed = per pack expiry; OPENED = 4d` | if an `Opened on` date exists (or is inferred), switch to the opened life |
| `MARKET pack (preservatives) 60d once opened-refrig` | packaged version has a longer opened life than the homemade one |
| `Market-bought peeled cloves — 4d refrigerated` | peeled garlic is **4 d**, whole garlic 60 d — different rows, different lives |
| `FRESH peas — 7d` vs frozen peas 120 d | frozen wins when the name says frozen |

---

## 7. Bucketing — how Master FnV decides where an item shows on the board

`Dashboard bucket` is authoritative for the board section. The app additionally has a `BUCKET` name → bucket override map for items whose board category was mis-typed (e.g. `Dates → Staple`, `Walnut → Staple`, `Vankaya Original Singapore Taste → Condiment`, `Pudina (dried) → Spice`, `Dry chutney bhel → Condiment`). Precedence: **explicit override map → Master FnV bucket → the row's own Category column**.

Section render order on a board:
```
Vegetable · Fruit · Meat · Meat & fish · Dairy · Bread & bakery · Frozen · Grains · Dals · Pasta ·
Spice · Condiment · Beverage · Staple · Pantry · Oil · Nuts & seeds · Herb · Other
```

**Perishable set** (drives "perishable overwrite" and the Use-priority filter): `Vegetable, Fruit, Meat, Meat & fish, Dairy, Bread & bakery, Frozen, Herb, FnV`.

---

## 8. Maintenance rules

1. **New SKU appears on a board and isn't in Master FnV** → the app uses a class regex (§3 steps 4–6). Add the SKU to the sheet with its class, source, and g/piece if countable. The **Seen-in-cats** column tells you where it has been showing up.
2. **A shelf value looks wrong** → change **Shelf-life (d)** in the sheet, cite the source. Rebuild → `SHELF` regenerates.
3. **Never** add per-household shelf lives. Shelf life is a property of the food, not the fridge.
4. **Opened-life items** must have **Opened shelf-life (d)** filled, otherwise the open-and-use inference has no life to apply.
5. **g / piece** should be filled for every count item so pc↔g estimates in the smart list and the deduction audit are sane.

---

## 9. Reference — shelf lives the operator most often asks about

```
Chicken / prawn / fish / mince   2 d      Paneer                     7 d (vacuum-packed 7–15)
Milk (open)                      4 d      Curd / yogurt / skyr      10 d
Batters                          4 d      Tofu / tempeh             10 d
Bread / sourdough / wrap         5 d      Eggs                      21 d
Spinach / lettuce / greens       5 d      Butter                    60 d
Banana / avocado / berries       5 d      Cheese (block)         45–60 d
Mushroom                         6 d      Garlic (whole) 60 d · peeled 4 d
Fresh herbs / spring onion       7 d      Onion / potato / ginger   30 d
Cucumber / broccoli / beans      8 d      Carrot / beetroot / lemon 21 d
Tomato                          10 d      Capsicum                  12 d
Cabbage / kiwi / orange         14 d      Apple                     30 d
Flours / rice / pasta / oats   180 d      Spices / oils / dals / sauces 365 d
Salt / sugar / jaggery / honey 730 d      Frozen                   120 d
```
