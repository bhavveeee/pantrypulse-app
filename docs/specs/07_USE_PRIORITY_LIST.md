# PantryPulse — "Use Priority" List (complete specification)

> The view that ranks a household's perishables by *how soon they must be used*, so the cook uses the right thing first and nothing spoils. Extracted from `priorityView`, `_ppOrderMatch`, `openedOn`, `shelfOf`, `ageInfo`, `urgency`, and the `OPENED` / `LONGSHELF` / `FRIDGELIFE` tables as of 17 Sep 2026.

---

## 0. What the user sees

A card titled **Use priority** for the selected household, with four sections in this order:

1. **Overdue · n** — days-to-use ≤ 0 (shown as "now", red)
2. **Use in 2 days · n** — 0 < d ≤ 2 (orange)
3. **This week · n** — 2 < d ≤ 5 (yellow)
4. **Fine · n** — d > 5 (green)

Each row: **Item** (with bucket tag, and `sealed` / `verify` chips where relevant) · **Qty** · **Age** (with its source) · **Safe** (safe days) · **Days to use** (bar + number). Rows are sorted ascending by days-to-use within and across sections.

Header actions: **➤ Shadow** (mirror this list to a shadow board), **➕ Slack batch** (queue items for the team channel), **⬇ image** (export the card as PNG).

---

## 1. Which items qualify

An item is included when **all** of:

- `qty > 0` (from board rows and, for legacy households, the `perish` list with `onhand > 0` and `status !== 'out'`);
- its bucket is perishable: `Fruit, Fruits, Vegetable, Vegetables, Meat, Meat & protein, Meat & fish, Dairy, Dairy & Breads, Bread & bakery, FnV`
  (bucket = `BUCKET[name]` override → row's kind/category);
- deduplicated by normalised name (first occurrence wins).

Empty result → *"No fruit / veg / dairy / bread / meat in stock."*

---

## 2. Shelf life per item (`shelfOf`)

Precedence (first hit wins):

```
1. opened-item life          if the item is open-and-use and an opened date is known → OPENED[name] (e.g. 4 d)
2. name says dried/dry       → 180 d
3. name says frozen          → 150 d
4. LONGSHELF[name]           → in-code overrides: mozzarella 60 · cheddar block 60 · parmesan 120 · feta 45 ·
                                 hard cheese 90 · dried shiitake 180 · olives (any) 60
5. it.sh                     → per-row shelf if the sheet carried one
6. ppShelf(name, S.date)     → Master FnV lookup (seasonal-aware wrapper)
7. SHELF[name]               → generated Master FnV map
8. fridgeLife(name)          → FRIDGELIFE regex table (mirrors Master FnV produce classes; see FnV spec §3 step 5)
9. default                   → 7 d
```

`OPENED` is a name → days map for open-and-use items: plant milks (Alt Co almond/oat), lactose-free milk, buttermilk, coconut milk/cream, cream cheese spreads, packaged creams — all **4 d** once opened. Sealed, they run on pack expiry (Master FnV).

---

## 3. Age per item (`ageInfo`) — the heart of the ranking

The single most important design decision in this view: **a stock count proves presence, never freshness.** So age is derived from evidence of *acquisition* or *opening*, in strict priority:

| Priority | `src` | How the date is found | Displayed as |
|---|---|---|---|
| 1 | `opened` | For `OPENED` items: explicit `Opened on` (row field `openedOn`) wins; else **inferred** = the first meal on/after the latest order that used this SKU (`openedOn(it)` scans orders ≤ today for the latest matching order, then meals ≥ that order whose `lines` name the SKU; earliest such meal = opened date). | `<age>d opened DD/MM` (+ "· no order on record" if inferred without an order) |
| 2 | `sub` | **Subscription items** restocked daily: `eggs` (exact word), plain `milk` (not coconut/almond/oat/soy/badam), `tender coconut`. | `daily · subscription`, age 0 |
| 3 | `order` | `_ppOrderMatch(h, name)` — latest order ≤ today whose name matches (see §4). Age = today − order date. | `<age>d ordered DD/MM` (tooltip shows the matched order line) |
| 4 | `capture` | Fallback only: the **oldest** of `Last entered` / `Last checked`. Oldest, because counts must never reset age. | `<age>d first seen MM-DD · no order record` (grey, explicitly flagged as unreliable) |
| 5 | `none` | no date at all | `? ⚠ no date on record` (red) |

**Stale-date alarm:** `if age > max(14, 2 × shelf)` → append **⚠ check age** ("Age Nd is more than twice this item's Md shelf life — the date on record is probably stale. Physically check and re-date it.")

---

## 4. Matching an item to its order (`_ppOrderMatch`)

Order names rarely equal SKU names ("Curry leaves (pack 2)" vs "Curry leaves"; "Chicken breast (boneless)" vs "Chicken (FreshtoHome)"). Matching is **tiered by score**, and among equal scores the **latest date** wins:

| Score | Test |
|---|---|
| **4** | normalised names identical |
| **3** | one contains the other **and** `shorter/longer length ≥ 0.6` (so "Spring onion" does **not** match "Onion") |
| **2** | ≥ 2 shared significant words (`_ppWords` — stopwords and pack/size words removed), **or** exactly 1 shared word that is the **head noun of both** ("Chicken breast" ~ "Chicken (FreshtoHome)") |
| 0 | otherwise — no match |

Only orders dated **≤ today** count (future-dated cart proposals are ignored). Result `{date, via, score}` or `null`.

> Why one shared word isn't enough: that rule once matched *green chilli* to a *red chilli* order and gave the wrong age.

---

## 5. Days-to-use and urgency

```
BUFFER      = 0.9
safe_days   = opened ? opened_life : round(shelf × BUFFER)      // use before 90 % of nominal life
days_to_use = safe_days − age                                    // age null → treated as 0

urgency(d): d ≤ 0 → red | d ≤ 2 → orange | d ≤ 5 → yellow | else green
bar width   = clamp((d + 4) / 24 × 100, 6 %, 100 %)
```

`danger` (used for badges elsewhere) = items with `d ≤ 5`. `flagged` = count of items whose age came from `capture` (i.e. unreliable), shown as a footnote so the cook knows how much of the list is on solid evidence.

---

## 6. Row rendering details

- **Bucket tag** after the name (Vegetable / Fruit / Dairy / …).
- **`sealed`** chip: item is in `OPENED` but has **no** opened date yet → it is running on pack life, not the 4-day clock.
- **`verify`** chip: the row's verify flag is set (needs a human look).
- **Age cell** varies by source exactly as in §3, with colour cues: opened = brown bold; subscription = teal "daily"; capture = grey with "no order record"; none = red "?".
- **Safe** column = `safe_days` + "d".
- **Days to use** = bar + bold number (`now` when ≤ 0).

---

## 7. Interplay with other features

| Feature | Relationship |
|---|---|
| **Master FnV** | supplies the base shelf life (`SHELF` / `ppShelf`) — fix shelf values there, not here |
| **Orders ledger** | supplies age for most items — an item bought without an order line will show as "first seen" and rank unreliably |
| **Meals ledger** | supplies the *opened* inference for open-and-use items |
| **Board chip tint** (`boxColour`) | same shelf lookup but **nominal** life and `left ≤ 3 / ≤ 6` thresholds — red/yellow/green on the board is a coarser view of the same clock |
| **Smart List** | forward-looking (what the next day's plan needs); Use priority is backward-looking (what will spoil). Together they answer "what to order" and "what to cook first" |
| **Snapshots** | not used; the view always reflects the live board |
| **Assistant `age` intent** | answers "how old is X" from the same resolver |

---

## 8. Known behaviours worth preserving (and the incidents behind them)

1. **Counts never reset age.** Taking the *oldest* stamp in the capture fallback is deliberate — a physical count of yesterday's paneer must not make it look fresh today.
2. **Subscriptions are age 0.** Without this, daily-delivered milk and eggs permanently topped the Overdue list.
3. **Length-overlap ≥ 0.6 on containment matches.** Added after "Spring onion" inherited "Onion"'s order date.
4. **Head-noun rule for single shared word.** Lets "Chicken breast" match a "Chicken (FreshtoHome)" order while still rejecting green-vs-red chilli.
5. **Opened inference from the meals ledger.** Users don't record when they open a carton; the first dish that used it is a good proxy, and an explicit `Opened on` still overrides.
6. **⚠ check age at 2× shelf.** Catches stale dates early instead of letting an item sit "overdue" for weeks.

---

## 9. Recommendations for the new model

- Keep the **age-source hierarchy** exactly — it encodes hard-won distinctions between *present*, *bought*, and *opened*.
- Store **order → SKU links at booking time** (an `sku_key` on each order row) so `_ppOrderMatch` becomes a lookup instead of fuzzy matching.
- Record **`Opened on`** explicitly when a pack is opened (a one-tap action on the chip) instead of relying on inference.
- Move `LONGSHELF` and `OPENED` into **Master FnV** columns (`Opened shelf-life (d)` already exists) so there is one place to edit.
- Expose `days_to_use` to the **Handover** so tomorrow's dish suggestions can prefer near-expiry stock.
