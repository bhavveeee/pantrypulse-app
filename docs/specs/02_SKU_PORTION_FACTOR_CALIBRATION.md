# PantryPulse — SKU Consumption Portion & Factor Calibration

> How the system decides **how much** of an ingredient a dish consumes, and how that number is tuned per household over time. This is the most correction-sensitive part of PantryPulse: every operator "make X" correction after a close is, implicitly, a calibration signal. Extracted from `Deduction method`, `Index`, the smart-list `slNorm`, the handover enrichment path, and the standing rules as of 17 Sep 2026.

---

## 0. The core equation

```
need  =  portion_per_person(role)  ×  eaters  ×  dish_intensity  ×  household_factor
```

| Term | Where it comes from |
|---|---|
| `portion_per_person(role)` | Recipe layer (per-person grams from the recipe sheet) if the dish is matched; otherwise the **role-based portion table** (§2) |
| `eaters` | Emergent's per-slot pax for that day (`breakfast_people`, `lunch_people`, `dinner_people`) — this is where guests appear |
| `dish_intensity` | Multiplier by dish type (§3) |
| `household_factor` | Per-household override from `Index.Effective eaters` / `Deduction method` (§5) — **this is the calibration knob** |

Then `deduct = min(need, available)`, with the orphan-threshold and zero-stock rules from the Deduction spec.

---

## 1. Layer 1 — recipe-stated quantities (preferred)

When a dish matches a row in the recipe source (currently the **"final recipes"** Google Sheet, *Dish breakdown* tab: `dish | link | source | ingredient | quantity for 1 person`), the ingredient list and **per-person grams come from there**. The Apps Script bridge (`RecipeMaster_AppsScript_v4.gs`) parses the quantity cell:

| Cell text | Parsed as |
|---|---|
| `40 g`, `40g`, `40 gm` | 40 g |
| `1` (bare number) | 1 pc |
| `3-4` (range) | **upper bound** → 4 pc |
| `a pinch` | 1 pinch |
| `100 ml` / `1 l` | 100 ml / 1000 ml |
| `2 nos`, `2 pcs`, `2 pieces` | 2 pc |

Recipe grams are **per person**, so the app multiplies by `eaters`. Everything in this layer is then subject to the sanity clamps in §4.

Fuzzy dish matching: the bridge scores `inter / max(len_dish_tokens, len_query_tokens) + 0.05 × inter` after dropping descriptor words (`homemade, dhaba, style, easy, quick, simple, authentic, restaurant, healthy, special, classic, best, tasty, instant, traditional, famous, desi, veg, the, and, with`). Top 3 matches are returned; the app takes the best.

---

## 2. Layer 2 — role-based portion table (fallback)

Used when the recipe layer gives no row for an ingredient, or when a dish is derived from plan text alone. From the `Deduction method` sheet — **base grams per person, by the ingredient's ROLE in that dish**:

| Role in dish | g / person |
|---|---|
| Hero veg (dish main) | 100–130 |
| Secondary veg | 25–40 |
| Leafy / bulk veg | 40–60 |
| Onion (aromatic base) | 15–25 |
| Ginger / Garlic | 3–5 each |
| Green chilli | 2–4 |
| Herb / garnish | 5–10 |
| Protein hero | 80–120 |
| Dairy in dish | 40–60 |
| Grain / noodle (dry) | 60–70 |
| **Dry dal / legume** (corrected 24 Aug) | **50 g dry per person per meal** (2 pax = 100 g). Applies to chana dal, toor, moong, masoor, rajma, kabuli chana. Cooked weight ≈ 2.5×. The earlier 180 g-for-2 estimate was too high — do not use. |

### 2.1 The class norms actually coded (`slNorm`) — used by the Smart List and as the text-derived fallback

These are the concrete per-person numbers the app applies when it derives ingredients from dish text:

| Class (regex on ingredient name) | Per person |
|---|---|
| eggs | **2 pc** |
| whole fruit (apple, banana, kiwi, orange, pear, guava, pomegranate, avocado, dragon, mango, peach, plum, muskmelon, watermelon, papaya, pineapple, chikoo) | **1 pc** |
| count-veg when board row is in pc (lemon, corn cob, cucumber, beetroot, carrot, capsicum, onion, tomato, potato, brinjal, zucchini, lauki, pumpkin) | **1 pc** |
| protein (chicken, mutton, fish, prawn, paneer, tofu, keema, mince, basa, rohu, salmon, steak, beef) | **150 g** |
| dal / legume (dal, chana, rajma, lobia, moong, urad, masoor, toor, chole, kabuli; *not* green/french beans) | **50 g** |
| bread / sourdough / toast / tortilla / wrap | **60 g** |
| grains (rice, quinoa, millet, poha, oats, couscous, noodle, pasta, vermicelli, dalia, sooji, rava, atta, flour, besan, roti, dosa, idli, batter) | **80 g** |
| milk / curd / yogurt / skyr / buttermilk | **150 ml** |
| fresh herbs (coriander, mint, basil, parsley, dill, curry leaves, rosemary, thyme, oregano, methi leaves, spring onion) | **15 g** |
| garlic / ginger / chilli | **10 g** |
| spices (masala, powder, jeera, haldi, hing, seeds, pepper, cinnamon, clove, cardamom, kasuri, dried) | **3 g** |
| fats/condiments (butter, cheese, cream, mayo, sauce, paste, ketchup, honey, jam, jaggery) | **20 g** |
| nuts & seeds (almond, cashew, walnut, pista, peanut, seed mix, chia, flax, pumpkin seed) | **10 g** |
| **generic vegetable (anything else)** | **75 g** |

**Garnish rule:** for text-derived ingredients in the garnish classes (spices, seeds, nuts, herbs, salt, sugar, oil, ghee, butter, cheese, cream) the norm is applied **once per dish, not × pax** — a pinch of jeera does not scale with headcount.

---

## 3. Dish intensity multiplier (from `Deduction method`)

| Dish type | × factor |
|---|---|
| Veg-heavy (manchurian, sabzi, thoran, stir-fry) | 1.1 – 1.2 |
| Standard curry / rice bowl | 1.0 |
| Veg-light (dal, soup, khichdi) | 0.6 – 0.8 |
| Salad / raita | 1.0 |

---

## 4. Sanity clamps (v21_700, after a bad-norm incident)

The recipe / fallback layer once produced "675 g eggs", "225 g cinnamon", "450 g tofu" (a generic 75 g × pax fallback applied to the wrong class). These clamps run **after** aggregation, on every ingredient line:

1. **Count items must be in pieces.** If the class norm says `pc` but the recipe gave grams → override to `norm × pax` pieces (eggs 2/person, fruit 1/person).
2. **Garnish never balloons.** If the class norm is ≤ 20 g/person and the aggregated need exceeds `2 × norm × pax` → clamp to `norm × pax`. (Kills 225 g cinnamon.)
3. **Bread stays sane.** If a bread-class item exceeds `2 × 60 × pax` → clamp to `60 × pax`.
4. **Recipe-layer count items** (eggs, fruits) with a non-pc unit → force to pieces at the class norm.
5. **Spices from recipes** with > 30 g → cap at `5 × pax`. Herbs > 60 g → cap at `15 × pax`. Bread/tortilla > 200 g → cap at `60 × pax`.

**Also:** the resolver normalises Hindi family keys to English **before** the norm lookup (`slEnglish`: anda→egg, kela→banana, pyaz→onion, gajar→carrot, kheera→cucumber, tamatar→tomato, aloo→potato, adrak→ginger, lehsun→garlic, dhaniya→coriander, pudina→mint, doodh→milk, dahi→curd, badam→almonds, …) — otherwise "anda" fell through to the 75 g generic-veg norm and produced the 675 g egg bug.

---

## 5. Household factor — THE calibration knob

This is where per-household reality overrides the generic norms. Stored in two places that must agree:

- **`Index` sheet, column `Effective eaters`** — a number the app reads at load.
- **`Deduction method` sheet** — the human-readable rule and its evidence.

### 5.1 Current factors (17 Sep 2026)

| Household | id | People | Effective eaters | Rule |
|---|---|---|---|---|
| Shunyam & Ishan | h1b | 2 | — (uses plan pax; plan is 1 pax most days) | standard |
| Soozy & Munz | h2 | 2 | — | standard; **guests appear as plan pax** (3–4 on 15–17 Sep) |
| Disha & Anirudh | h3 | 2 | — | standard; plan often shows 1 pax when only one eats |
| Kartik & Dhara | h4 | 2 | — | **PAUSED**; when active, chef-cook days at 1 pax |
| Rahul & Radhika | h5 | 3 | — | 3 = Rahul, Radhika, Skye; Zoey (dog) separate |
| Paxal & Sana | h7 | 2 | — | **PAUSED**; **paneer 200 g per paneer meal** for 2 |
| Pratik & Sakshi | h8 | 2 | **9** | count-driven; lunch = 2 family + **4 staff** = 6, staff lines deducted separately; recorded 9 covers staff + kids' snacks days |
| **Yash & Manik** | h10 | 2 | **0.5** | **0.5 PERSON TOTAL for the household, regardless of plan pax** |
| Padmaja & Rohan | h11 | 2 | — | standard |
| Akshita & Prerit | h12 | 2 | 2 | standard |
| Samidha & Arinjay | h13 | 2 | 2 | standard; cut-fruit norm calibrated to **2 pc per cut-fruit breakfast** (was under-counting at 1) |
| Joseph & Teenu | h14 | 2 | 2 | standard |
| Saurabh (Seth) | h15 | 1 | 1 | standard |
| Shyamli | h16 | 1 | 1 | standard |
| Piyush & Mamta | h17 | 2 | 2 | standard; **guests as plan pax** (4 on 17 Sep) |

### 5.2 How the Yash & Manik factor was calibrated — the worked example

This is the template for calibrating any household.

**Step 1 — start at the default.** Yash & Manik, 2 residents → 2 pax standard norms.

**Step 2 — observe the corrections.** Over several closes the operator kept correcting Yash's board *upward* after deductions (okra, mushroom, milk, cucumber, beetroot, sweet corn were all "too low" after the app's deduction). That pattern — repeated same-direction corrections — is the calibration signal.

**Step 3 — measure.** 4 Sep, measured against the corrections for a 2-resident day:
- okra ≈ **80 g per meal** (norm would give ~250 g)
- mushroom ≈ **0–50 g**
- milk ≈ **100–150 ml total** for the day (norm cadence implied ~700 ml)
- cucumber / beetroot ≈ **0.5 pc**
- sweet corn ≈ **0.5 cob**

Conclusion: the household eats roughly a **third** of the 2-pax norm. Rule adopted: *use one-third of the standard 2-pax norm; round down on piece items; when a plan states grams explicitly, still halve at minimum.*

**Step 4 — re-measure and tighten.** 10 Sep, the operator ruled the third was *still* too high: **"make consumption 0.5 person in total."** Rule replaced: **deduct at 0.5 person total for the whole household regardless of how many the plan lists.** Multiply the per-person norm by 0.5 (not by pax); plan-stated grams × `0.5/pax`; whole items round down.

**Step 5 — encode in all three places.**
- `Index.Effective eaters` for h10 = `0.5`
- `Deduction method` row: *"Yash & Manik (h10): deduct at 0.5 PERSON TOTAL …"* with the date and evidence
- Smart-list factor: `thirds = 0.5 / max(1, pax)` so projections use the same basis as deductions

**Step 6 — watch for the opposite drift.** A very low factor means items linger and the smart list rarely flags them. The standing note says: *if this proves too aggressive after a few days, nudge it — the rule lives in one place.*

### 5.3 Signals that a household needs recalibration

| Signal | Likely fix |
|---|---|
| Operator repeatedly corrects the **same items upward** after closes | factor too high → lower it (Yash pattern) |
| Operator repeatedly corrects **downward** / items vanish faster than the board says | factor too low → raise it |
| A specific ingredient is always off (e.g. paneer) while others are fine | **item-level rule**, not a household factor (Paxal paneer 200 g/meal) |
| A cut-fruit / count item is consistently under-counted | class-norm fix for that household (Samidha cut fruit 1 → 2 pc) |
| Guest days | do **not** touch the factor — the plan's per-slot pax already carries guests |

### 5.4 What a factor does NOT change
- **Soak-time rules** — a soaked legume is still deducted once, at soak.
- **Orphan thresholds** — use-it-all logic is by item class, not household.
- **Order/count arithmetic** — factors only touch consumption.
- **Zoey's chicken** — dog food never scales with human factor.

---

## 6. Orphan threshold — leave-a-little vs use-it-up (from `Deduction method`)

After computing `deduct`, if the remainder `available − deduct` would fall below the class threshold, take **all** of it:

| Item class | Leftover < this → use it ALL |
|---|---|
| Cheap veg (onion, cabbage, cauliflower, capsicum) | 40–50 g |
| Herbs (coriander, mint, curry leaves) | 10–15 g |
| Costly / slow (paneer, exotics, berries) | lean to **leave** a usable remainder |
| Freshly bought **for this dish** (≤ 1 day old) | use fully, cap at available |

---

## 7. Proportional split across variants (rule 5 of the formula)

If several interchangeable rows are live (e.g. red 250 g, yellow 150 g, green 100 g capsicum for a "capsicum" need of 200 g), split the need **proportionally to availability**: 100 / 60 / 40 g. This keeps colours depleting evenly instead of one being drained while others sit.

---

## 8. Consumption-rate sanity — the assistant's `rate` intent

The PP assistant answers "how much X do we use per week" from the ledger: it sums `Deductions.qty` for the SKU over the window and divides by days/weeks. This is the cheapest way to **audit a factor**: if the ledger says a 2-person house "consumes" 700 ml milk/day while the operator's counts show 150 ml, the factor is wrong.

---

## 9. Calibration procedure for the new model (step-by-step)

1. **Default every household to `Effective eaters = People`.**
2. **Run closes normally for 3–5 days.** Record every operator "make X" correction that lands *after* a deduction on the same SKU.
3. **Compute the correction ratio per household**: `Σ(operator value − app value) / Σ(app deduction)` over the window, by item class (veg / protein / dairy / grains).
4. **If the ratio is consistently negative (app over-deducts) across classes** → the household eats less than pax suggests → lower `Effective eaters` (try `pax × 0.5`, re-measure).
5. **If one class is off** → change that class norm for that household (item-level rule), not the factor.
6. **Encode in three places** (Index, Deduction method with date + evidence, smart-list factor). Never in only one.
7. **Re-measure after 3 days.** Tighten or loosen. Log each change with the measured actuals that justified it — the Yash entries on 4 Sep and 10 Sep are the reference format.
8. **Guests never move the factor.** They enter via plan pax.

---

## 10. Reference values in one place

```
Per-person defaults:  eggs 2pc | fruit 1pc | protein 150g | dal 50g dry | grains 80g |
                      bread 60g | dairy 150ml | herbs 15g | garlic/ginger/chilli 10g |
                      spices 3g (once per dish) | nuts/seeds 10g | fats/condiments 20g |
                      generic veg 75g
Intensity:            veg-heavy 1.1–1.2 | standard 1.0 | dal/soup/khichdi 0.6–0.8 | salad 1.0
Household factors:    h10 Yash = 0.5 person total | h8 Pratik = 9 (staff) | h7 Paxal paneer 200g/meal |
                      everyone else = plan pax
Orphan:               cheap veg ≤40–50g → take all | herbs ≤10–15g → take all | costly → leave remainder
Legume:               50g dry/person/meal, cooked ≈ 2.5×
Piece estimates:      onion 100g | tomato 100g | potato 150g | carrot 70g | capsicum 125g | lemon 50g |
                      cucumber 200g | egg = 1pc | banana 50g | apple 150g
```
