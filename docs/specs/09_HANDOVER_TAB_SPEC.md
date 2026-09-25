# Handover tab — complete build specification

Hand this whole file to Claude. It contains everything needed to build the **Handover** board:
the three inputs it requires, the data model, every rule that decides a number, the exact UI, and
the mistakes that will otherwise be made.

---

## 0. Read this first — what this file does and does not give you

**It fully specifies the Handover tab**: the layout, every label, the five status states, the
week-in-order simulation, the filters, the Excel export, the clipboard format. Build from it and you
get a faithful Handover board.

**It does not contain the engines underneath it.** In the original the tab is ~1,800 lines sitting on
top of ~11,000 lines that decide the *numbers*:

| what it does | size |
|---|---|
| dish name + headcount → ingredients and grams | ~2,700 lines |
| recipe ingredient → the shelf row that satisfies it (pooling, aliases, guards) | ~2,700 lines |
| splitting a planner line into dishes | ~1,800 lines |
| unit conversion, pieces ↔ weight | ~600 lines |

So: **the board will look and behave identically. The numbers will be yours, not the original's.**
That is fine and expected — you supply the three inputs in §1 from your own system.

If the goal is to reproduce another installation's numbers exactly, this file is not enough and no
reasonable document would be; those engines are hundreds of individually-measured rules.

---

## 1. The three inputs you must supply

Implement these against your own data. Everything else in this file is then fully determined.

```ts
/** 1. What is planned. Seven days from `start`, in date order. */
getWeekPlan(householdId: string, start: string): Promise<{
  date: string;                 // '2026-09-20'
  planned: boolean;             // false when the planner has nothing for this day
  slots: { slot: 'B'|'L'|'D'|'S'; dishes: string[] }[];
  pax: number;                  // people eating that day
}[]>

/** 2. What a dish needs, already scaled to `pax`. Return [] when you cannot price it —
 *     that is a real answer and the board renders it specially. Never guess. */
getRecipe(dish: string, pax: number): Promise<{
  name: string;                 // ingredient, as the recipe says it
  qty: number;
  unit: 'g' | 'ml' | 'pcs';
  hero: boolean;                // the dish is built on this one
}[]>

/** 3. What the kitchen holds, now. One entry per FOOD, already pooled across shelf rows. */
getStock(householdId: string): Promise<{
  name: string;
  unit: 'g' | 'ml' | 'pcs';
  qty: number;                  // usable
  expiredQty: number;           // past use-by — NOT usable
  spoiledRows: string[];        // shelf rows past use-by, for "bin first"
  unitNote?: string;            // set when shelf and recipe units cannot be compared
  rows: string[];               // the shelf rows this was pooled from
}[]>
```

**Two warnings about `getStock`, both learned the hard way.**

*Pool by food, not by spelling.* `Bell pepper` and `Red bell pepper` are one food and must return as
one entry. If they come back as two, each measures its gap against the same underlying shelf row and
**both report covered** while the kitchen has enough for one.

*Never convert units you are unsure about.* If the shelf holds pieces and the recipe asks grams and
you have no reliable weight, set `unitNote` and let the board show `Check unit`. A wrong conversion
is silent; a `Check unit` is a question a human answers in three seconds.

---

## 2. The non-negotiable idea: the week is SIMULATED IN ORDER

This is what makes the board correct, and what a naive build gets wrong.

**Breakfast eats before lunch does.** Carry a running copy of the shelf across the whole week: each
dish deducts what it takes and the next dish sees what is left. The same 200 g of paneer cannot
satisfy Monday lunch *and* Wednesday dinner.

Check each day independently against today's stock instead, and every day reports "in stock" — the
board tells the cook they are covered on Thursday using paneer Monday already ate. That is worse than
having no board, because it is believed.

```
shelf = getStock()                       // one mutable copy for the whole week
for each day in date order:
    if day.date <= closedThrough: continue          // history — see below
    for slot of ['B','L','D','S']:                  // this order
        for dish of day.slots[slot]:
            rows = getRecipe(dish, day.pax)
            if rows.length === 0: mark dish.gap = true; continue
            for r of rows:
                took = min(r.qty, shelf[r.name].qty)
                shelf[r.name].qty -= took
                shortfall = r.qty - took             // -> the cart
```

### Days already settled are HISTORY and are never simulated

Your ledger has a `closedThrough` date. Days on or before it were cooked and the stock was really
deducted. Re-simulating them invents a shortfall for food that was eaten. Render them as
**“Closed & deducted”** with one line of explanation and no tables.

---

## 3. Data model

```ts
type Slot = 'B' | 'L' | 'D' | 'S';          // Breakfast, Lunch, Dinner, Evening snacks

interface HovRow {                           // one ingredient inside one dish
  n: string; q: number; u: string;
  st: 'ok' | 'short' | 'no' | 'unit';        // measured against the RUNNING shelf
  via?: string;                              // the shelf row it matched, when named differently
  lab?: string;                              // greyed note at the end of the row
}

interface HovDish { dish: string; rows: HovRow[]; gap: boolean }

interface HovNeed {                          // one ingredient, summed across a day
  n: string; q: number; u: string;
  dishes: { dish: string; hero: boolean }[];
}

interface HandoverDay {
  day: { key: string; label: string; date: string };   // 'Sun', 'Sun 20 Sep', '2026-09-20'
  locked: boolean;                           // on or before closedThrough
  planned: boolean;
  slots: Record<Slot, HovDish[]>;
  needs: HovNeed[];
  buyTotal: { n: string; q: number; u: string }[];
}

interface Handover {
  closedThrough: string; week: string | null; pax: number | null;
  missingWeeks: string[];
  days: HandoverDay[];                       // exactly 7
  have: Stock[];
}
```

---

## 4. Status: five states, and why not three

```ts
type Status = 'green' | 'yellow' | 'red' | 'expired' | 'unit';

function statusOf(required: number, have: Stock | undefined): Status {
  if (!have) return 'red';
  if (have.unitNote) return 'unit';
  if (have.qty <= 0) return have.expiredQty > 0 ? 'expired' : 'red';
  return have.qty >= required ? 'green' : 'yellow';
}

// worst first, then by how much is missing — the order you would walk a shop in
const RANK = { red: 0, expired: 1, unit: 2, yellow: 3, green: 4 };
```

`expired` and `unit` sit **outside** red/amber/green deliberately. Collapsing them into red destroys
the only information that says what to do: *expired* means there is stock but bin it; *unit* means
the board cannot honestly compare and a human must look.

| status | background | text | label |
|---|---|---|---|
| green | green tint | `#185a2b` | Available |
| yellow | amber tint | amber-dark | Short |
| red | `#FBE9E7` | `#8E2F28` | Not available |
| expired | `#FBE9E7` | `#8E2F28` | Expired |
| unit | amber tint | amber-dark | Check unit |

**Colour only the small status pill.** An earlier version washed each row in its status colour; a
normal week looked like an emergency and people stopped reading it.

Inside the per-dish table use the shorter set: `Have / Short / None / Unit`.

---

## 5. The screen, top to bottom

### 5.1 `As at …` banner — only when viewing a past night
Amber card. The seven nights *after* that date, simulated against the shelf the ledger says was
there. State plainly that **the recipes are today's** — a card edited since then prices at its
current numbers. That is the one thing about a past view that misleads.

### 5.2 `No recipe · N dishes` — only when N > 0
Amber card, **above** the board. Chips only, no prose: `dish · day · meal`, each linking down to the
day. This is the one thing the board cannot show inside itself, so it cannot sit below it.

### 5.3 The combined card — `Ingredient handover`
The working surface; what people shop from.

- **Quick pick** — one chip per open day (`Fri 18 Sep`), multi-select, **defaults to the first open
  day only**. Opening on all seven puts 120+ ingredients on screen and reads as noise. `All 7` chip
  selects everything.
- **Availability** filter chips with live counts, plus `Clear`.
- **Menu decision** — dishes that cannot be built as planned.
- Columns: **Ingredient · Required · For which dishes · In kitchen**
  - `★` before an ingredient that is the Hero of at least one dish below
  - `On the shelf as <name>` beneath the ingredient when the shelf row is named differently
  - sorted by `RANK`, worst first
- **Capped at 25 rows** with *show all*. A week runs to 120-odd rows; the tail is single grams of spice.
- **Export to Excel** — returns a real `.xlsx`, and **recomputes** from the same source rather than
  serialising the rendered rows, so the file cannot disagree with the board.
- **Copy cart** — plain text:

```
Buy for Fri 18 Sep, Sat 19 Sep:
* Paneer — 260 g          <- '*' marks a hero
  Onion — 70 g
  nothing — everything is covered      <- when there is nothing to buy

Bin first (past use-by):
  Curd (500 ml pack)
```

### 5.4 One card per day, seven of them

Header: day label, then **one** tag on the right:

| condition | tag |
|---|---|
| `locked` | `Closed & deducted` (neutral) |
| `buyTotal.length > 0` | `N to buy` (red) |
| has dishes | `All in stock` (green) |

Body, in order:

1. `locked` → one grey line: *“The ledger has settled this day, so it is history rather than a plan —
   never re-simulated.”* Nothing else.
2. `!planned` → *“No meals planned.”*
3. no dishes → *“Nothing recorded for this day.”*
4. otherwise:
   - **`Short for this day · N items`** — peach panel, a chip per shortfall: `Onion **70 g**`
   - each slot that has dishes, in the order **B, L, D, S**, headed
     `Breakfast / Lunch / Dinner / Evening snacks`

### 5.5 A dish

```
Chicken Biryani  [▶]        <- video badge when the recipe has a link
```

Then one row per ingredient, columns in this order:

| status pill | ★ name + “On the shelf as …” | quantity | note |
|---|---|---|---|

**A dish with no recipe** is tinted whole — `#fffaf0` on a `#e0b34d` border — with a `No recipe` tag
and this line:

> Nothing is priced for this dish, so it adds nothing to this day's shopping — whatever it needs is
> missing from the board rather than in stock.

That sentence matters: an unpriceable dish contributes no ingredients, so a day whose only problem is
that dish still reads “All in stock” — true of everything the board can see, silent about what it
cannot.

---

## 6. Quantity formatting

```ts
function q(n: number, u: string) {
  const v = Math.abs(n) < 1 ? Math.round(n * 100) / 100 : Math.round(n * 10) / 10;
  if ((u === 'g' || u === 'ml') && v >= 1000)
    return `${Math.round(v / 100) / 10} ${u === 'g' ? 'kg' : 'l'}`;
  return `${v} ${u === 'pcs' || u === 'pc' ? 'pc' : u || 'g'}`;
}
```

Two decimals below 1, one above, **kg/l above 1000** — `1.2 kg`, never `1240 g`.

---

## 7. Twelve things that are wrong in the obvious implementation

Every one of these was built the wrong way first, then fixed.

1. **Checking each day against today's stock.** The week must be simulated in order, or the same
   paneer covers three days. §2.
2. **Re-simulating closed days.** Invents shortfalls for food that was actually cooked.
3. **Opening on all seven days.** 120 ingredients before anyone has read a word. Default to the
   first open day.
4. **Collapsing `expired` and `unit` into red.** Destroys the only information that says what to do.
5. **Tinting whole rows by status.** A normal week looks like an emergency. Colour the pill only.
6. **One line per spelling.** `Bell pepper` and `Red bell pepper` are one food — otherwise each line
   measures its gap against the same shelf row and both read as covered.
7. **Serialising rendered rows into the Excel export.** Recompute; a file that *can* disagree with
   the board eventually does.
8. **Letting a wide table push the page sideways.** Wrap each dish table in its own scroll container,
   or a phone reads the layout as broken.
9. **Explaining the no-recipe case in prose.** Chips, each linking to the day.
10. **Treating an unpriceable dish as “in stock”.** It prices nothing, so it is absent from the
    totals. Say so, above the board.
11. **Rendering the `S` slot unconditionally.** Most households have no evening snack and their card
    must look exactly as it did before. Render `S` only when it exists — and keep it last.
12. **Filling a missing planner week from the wrong week.** Leave it blank and say so: *“No plan on
    the planner for: Mon 21 Sep … — left blank, loudly, rather than filled from the wrong week.”*
    Silently showing last week's menu is the worst failure this board has.

---

## 8. Server shape

```
handoverFor(householdId, { asOf? }) -> Handover
```

- normal: the seven-day window from today, `closedThrough` from the ledger
- `asOf` set: the seven nights **after** that date, `closedThrough` becomes that night, and the shelf
  is the one the ledger can prove for that evening

Keep the simulation in **one** function used by both the page and the Excel export. Two
implementations of “what does this week need” will diverge, and the first sign will be a cook
believing the wrong one.

---

## 9. Build order

1. `statusOf`, `RANK`, `q()` — pure; unit-test them first
2. the in-order week simulation, with `locked` days skipped
3. one day card, one slot, one dish table
4. the seven-day page
5. the combined card: quick pick → filters → sort → cap
6. Copy cart, then Excel export
7. the two amber banners — `No recipe`, and `As at`

**Stop after step 4 and check one day's numbers by hand against your own data.** Everything above
step 4 is presentation; everything at or below it is correctness, and presentation built on wrong
numbers is just a more convincing error.
