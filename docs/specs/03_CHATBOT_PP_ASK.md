# PantryPulse — "PP Ask" Chatbot (complete specification)

> The in-app assistant that answers questions about a household's board, orders, deductions, meal plan and change log. **Read-only.** Extracted from `ppcLive`, `ppcIntent`, `ppcTerms`, `ppResolveAll`, `ppListTable`, `ppStory`, `PPCONV` and `api/pp.js` as of build v21_713, 17 Sep 2026.

---

## 0. Design principles (these shape every decision below)

1. **Deterministic first, model second.** Stock, history, usage, list-check and category questions are answered *entirely client-side* from the parsed workbook. Only open-ended reasoning ("why", "is this correct", "should we") goes to a language model — and even then the model gets the exact records and is told to answer *only* from them.
2. **Never invent.** If the records don't contain the answer, say precisely what is missing ("no meal plan loaded for that day") rather than guess.
3. **Read-only.** If asked to change something, say it cannot and point to the board.
4. **The browser never holds a model key.** Model calls go through the same-origin serverless proxy `api/pp.js`, which holds `ANTHROPIC_API_KEY`.
5. **Conversational.** A short thread of topic + intent is kept so "and how much of that?" / "and tomorrow?" / "is that correct?" resolve against the previous turn.

---

## 1. Data the assistant reads

All from the parsed workbook already in memory (`S.houses[h]`):

| Source | Fields used |
|---|---|
| Household board rows | name, qty, unit, category, status, last checked / entered, note |
| `Orders` | date, item, qty, unit, note (source, ADD vs SET) |
| `Deductions` | date, dish, SKU, qty, unit, before, after, reason |
| `Meals` | per-day close records (what was cooked, flags) |
| `Change Log` | when, kind, SKU, old, new, delta, source, reason, ref — **the authoritative record** |
| `History` | system notes, rules adopted, RCAs |
| Live meal plan | `window.LIVEPLANS[house]` from Emergent (per weekday B/L/D text + per-slot pax) |
| `SKU Knowledge` | aliases + never-match guards for resolution |
| `PP_SYN` families | Hindi / regional / English synonym groups |
| Shelf-life resolver `ppShelfG` | for the `age` intent |

---

## 2. Pipeline for one message (`ppcLive`)

```
message
  → ppcIntent(q)                      # 1. classify
  → dish extraction (need intent)     # 2. "enough for <dish> for 4?"  → dish name
  → ppcTerms(h, q)                    # 3. extract ingredient terms (typo-tolerant)
  → continuation resolution           # 4. inherit topic/terms/window from PPCONV.topic
  → time-window resolution            # 5. "yesterday", "last week", "on 12 Sep", "that day"
  → quick renderer  (if intent has one)
      or needsModel = true            # 6. deterministic answer or hand to model
  → done(kind, html, usedModel)       # 7. render, update PPCONV.topic and PPBOT.hist
```

Every stage is wrapped in try/catch — a failure in one stage never kills the reply; the assistant degrades to the model or to a "couldn't match" note.

---

## 3. Intent classifier (`ppcIntent`) — 17 intents, priority order

The classifier runs regex tests **in this order** and returns the first hit. Order matters — e.g. `why` is tested before `cooked` so "why was chicken deducted yesterday" is a `why`, not a `cooked`. Hindi / Hinglish forms are first-class throughout.

| # | Intent | Triggers (abridged — full regexes in code) | Answered by |
|---|---|---|---|
| 1 | `greet` | `hi / hello / hey / namaste / good morning…` and ≤ 4 words | quick |
| 2 | `ack` | `thanks / ok / cool / got it / acha / theek hai / bye / 👍 / 🙏 …` (whole message) | quick |
| 3 | `source` | `source / which sheet / where does this come from / how do you know / kahan se` | quick |
| 4 | `help` | `help / what can you do / who are you / what is pp / commands / examples / kya kya pooch` | quick |
| 5 | `action` | starts with `add / set / update / change / order / buy / remove / delete / deduct / increase / decrease / make it / put / book / move` and is **not** a question word | quick (refuses — read-only) |
| 6 | `low` | `what should we order / shopping list / smart list / kya order / need to buy` **or** `low / running out / almost over / khatam / kam hai / nearly out` (not "low fat") | quick |
| 7 | `why` | `why / explain / rca / should / correct / wrong / mistake / compare / reason / how come / analy / happened / verdict / ok to / discrepanc / mismatch / doesn't add up / galat / sahi hai / kaise hua / kyu / make sense / suspicious / double-check / verify / audit / sure?` | **model** (with records) |
| 8 | `cooked` | `cooked / made / banaya / khaya / ate / had for / kya tha / closed` **and** a time reference (yesterday, kal, aaj, a date, a weekday, last week) | quick |
| 9 | `plan` | `plan / menu / meal plan / dinner / lunch / breakfast / banega / banana hai` **and** a time word, **not** `used / deduct / cooked / where / order / enough` | quick |
| 10 | `need` | `enough / sufficient / shortage / missing / chahiye / need / required / everything / don't have for / lack` **and** `for / ke liye / to make / guests / people / pax` | quick |
| 11 | `age` | `expir* / shelf life / how old / age of / purana / kharab / spoil / stale / gone bad / freshness / fresh / old / since when / kab se` (not "fresh methi/coriander/cream/paneer/mint/curd" which are item names) | quick |
| 12 | `rate` | `how much do we usually use / per week / per day / average / consumption / usage rate / burn rate / how fast / how often / kitna lagta` | quick |
| 13 | `changes` | `change log / changed / counted / count / last checked / physically counted / verified / kab check / overwrote / edited / modified / who set / badla / corrections / adjust / history of changes` (not "plan changed") | quick |
| 14 | `category` | `what / which / list / show / all / kya kya / kaun / do we have any / everything` **and** a category word (veg, sabzi, fruits, dal, spices, dairy, meat, snacks, staples, grains, oils, fridge, freezer, pantry, board, items, stock…) **and not** `for / order / deduct / used / cook / plan / menu / expir / low / change`; **or** a bare category word; **or** `a lot of / plenty / excess / too much / surplus / zyada` + `what/which/have/stock` | quick |
| 15 | `orders` | `order(s|ed) / came / arrived / delivered / aaya / purchase / kharid / bought / next order / last order / recent orders / what did we get` **and not** `where / which dish / used for` | quick |
| 16 | `deducts` | `deduct* / consum* / went out / used up / utilis* / usage / use` **and** `what / list / show / yesterday / today / this week / last week / recent / kal / aaj / all / total` **and not** `where / which dish / for` | quick |
| 17 | `story` | `where / which dish / what dish / in what / breakdown / ledger / story / history / used / deduct* / consum* / spent / went / gaya / track / kahan / kis dish / when…bought / how much…used` | quick |
| — | `lookup` | **default** — a stock question ("do we have onion", "kitna tomato hai") | quick |

---

## 4. Term extraction (`ppcTerms`) — finding the ingredients in a message

1. **Strip stopwords** (`PPC_STOP`, ~200 English + Hinglish function words, units, time words, verbs like have/need/use, and "house/board/fridge/pantry").
2. **Peel qualifiers** (`PPC_QUAL`): `canned, frozen, fresh, dried, raw, boiled, cut, sliced, whole, open, sealed, organic, red, green, white, black, yellow, powder, seeds, leaves, paste, oil, sauce, pickle, flour, whole wheat, greek, malai, kasuri, hara, lal, kala…` and brand names (`amul, nandini, akshayakalpa, milky mist, heritage, licious, epigamia, country delight, sid farm`). Qualifiers are kept aside and later used to **narrow** the matched rows (e.g. "fresh" filters out dried rows).
3. **Chunk** the remaining words into candidate phrases (1–3 words).
4. **Exact-family precedence** (`ppcFamExact`): a chunk that **is** a synonym-family member wins over one that merely *contains* one — "coriander seeds", "kala chana", "sweet potato" resolve to their own families, not to coriander / chana / potato.
5. **Resolve** each chunk via `ppResolveAll(h, chunk)` (see Deduction spec §2 — same resolver, same guards). Chunks with no board rows *and* no family are kept as **leftovers**.
6. **Typo recovery**: for a leftover chunk, compute **Damerau-Levenshtein** distance (transposition-aware; early-exit if length differs by > 2) against the household vocabulary (`ppcVocab` — every board item word + every family word, ≥ 4 chars). Distance ≤ 1 for words ≤ 5 chars, ≤ 2 for longer → treat as that word, mark `corrected=true`, and say so in the reply ("did you mean *onion*?").
7. **Multi-term**: several ingredients in one message each become a term; the reply handles up to 3 stories / lookups side by side, or a **list table** if the message is a list.

**List detection** (`ppIsList`): split on newline / comma / semicolon; if ≥ 2 lines and every line ≤ 5 words → treat as a list-check. Leading quantities (`500g`, `2 pc`) are stripped before resolution.

---

## 5. Conversation memory (`PPCONV.topic`, `PPBOT.hist`)

After every reply the assistant stores:

```js
PPCONV.topic = { intent, terms:[{asked, term, R}], when:{from,to,label,day}, dish, ts }
PPBOT.hist   = [...last 6 {q, a}]          // plain-text Q/A pairs for the model
```

### 5.1 Continuation rules (in order)

| Situation | Behaviour |
|---|---|
| Message has **pronouns / ellipsis** (`it, that, this, those, uska, iska, wo, and?, also?`) or a **continuation trigger** (`and, also, aur, then, what about, how about, ok and`) or is very **short** (≤ 2 tokens) with no time window and no new terms | inherit **terms** from the topic; mark them `inherited` |
| Qualifier words present but no new term ("the fresh one?") | apply the qualifier to inherited terms' rows |
| Intent-less follow-up after a non-lookup topic ("and how much of that?" after a story) | keep the topic's intent unless the words say `how much / kitna / have / hai` |
| Time-only follow-up ("and tomorrow?", "what about last week") after `cooked/plan/orders/deducts/changes/category` | keep that intent, replace the window |
| "and tomato?" after "where was onion used" | switch to **story** for tomato |
| `why` with no terms | inherit the topic's terms |
| `that day / same day / us din / that week / us hafte` | reuse the topic's window |
| `the day before that / pichle din` | window = topic.from − 1 day |

**Term-inheriting intents:** `lookup, story, age, changes, why, orders, need, rate`. Never inherited into: `greet, ack, help, category, cooked, plan, low, deducts`.

**Safety:** if the message is clearly a fresh, unrelated question (has its own terms and its own time reference), the topic is *not* applied.

---

## 6. Time-window resolution

Recognised: `today / aaj`, `yesterday / kal (past)`, `tomorrow / kal (future — disambiguated by verb tense)`, `parso`, `day before yesterday`, `last night / this morning`, `this week / last week / next week`, weekday names (returns the most recent such day), explicit dates `12/9`, `12 Sep`, `Sep 12`, `12th September`, and ranges. All resolved in **IST** via `istToday()`. A resolved window is `{from, to, label, day}` and is stored on the topic.

---

## 7. Quick renderers (deterministic answers)

| Intent | Renderer | What it shows |
|---|---|---|
| `lookup` | `ppListTable(h, terms)` | Per term: matched SKUs with qty/unit/category; status ✓ / ⚠ low / ✗ none; if nothing matched, up to 4 **near-misses** ("check these") from 4-char prefix overlap |
| `story` | `ppStory(h, term)` (+ `ppcUsedIn` if a window) | The item's ledger: orders in, deductions out by dish/date, counts, current qty — a usage story card |
| `age` | shelf resolver + last order/entered date | age in days, shelf-life class, days left, source of the date (order / capture / opened) |
| `low` | smart-list "Need to order for sure" + "Genuinely low" sections | items below class threshold (pc < 1, or < 50 g/ml) or needed by the next day's plan and short |
| `need` | dish → ingredients → resolver → sufficiency | for "enough for X for N?": each ingredient's need vs on-hand, colour-coded |
| `cooked` | `Meals` + `Deductions` for the window | dishes closed that day and what came off the board |
| `plan` | `LIVEPLANS` for the window | B/L/D text with per-slot pax |
| `orders` | `Orders` for the window | booked lines with qty/unit/note |
| `deducts` | `Deductions` for the window | ledger lines grouped by dish |
| `changes` | `Change Log` for the SKU/window | old → new, source, reason |
| `category` | board grouped by dashboard bucket | all items in that section with qty |
| `rate` | Σ `Deductions.qty` / days | per-day and per-week consumption for the SKU |
| `source` | static | which sheets feed which answers |
| `help` | static | example questions |
| `action` | static | "I'm read-only — change it on the board" |
| `greet` / `ack` | static | short acknowledgement |

**Low-stock thresholds** used everywhere: a row is "low" when `unit == 'pc' && qty < 1` or `unit != 'pc' && qty < 50`.

---

## 8. Model path (`why`, and unmatched free text)

### 8.1 When
- `intent === 'why'` → **always** model (a quick list table is rendered first so the model's verdict sits under the facts).
- Any message where no quick renderer applies **and** the message is more than 2 tokens or has a time window → model.
- ≤ 2 tokens with no match → *not* model; reply "I could not match **X** to any item on <house>'s board. Try the item name (Hindi or English), a list, or **help**."

### 8.2 What is sent
`POST /api/pp` with `{ system, question }`:

**System prompt (verbatim):**
> You are PP, the assistant inside Pantry Pulse, a household food-inventory system. Answer ONLY from the JSON records provided; never invent items, quantities or dates. The conversation so far is included: the current message may be a follow-up ('how much', 'and that one?', 'is that correct') — resolve pronouns and ellipsis from the previous turns. If it is unrelated to the previous turns, answer it fresh and ignore them. change_log is the authoritative record of every change (orders, deductions, board overwrites, corrections) with old/new values and source; 'Bhavya overwrote — smart-list check result' means a human physically checked and set the value. When asked why a quantity was deducted, quote the line (date, dish, quantity, before->after, pax, reason). When asked whether something was handled correctly, compare against the plan and the standing rules in the records and give a direct verdict. Cite the record's date whenever the record carries one. If the records do not contain the answer, say exactly what is missing (e.g. 'no meal plan loaded for that day') rather than guessing. Be concise: short lines or a compact list, no preamble, units as in the records. You are read-only: if asked to change something, say you cannot and point to the board.

**User content** = `Household: <name>` + `Today: <IST date>` + continuation hint (if any) + last 6 Q/A pairs + `Current question: …` + a JSON blob of **only the relevant records**: the matched SKUs' board rows, their orders, deductions, change-log lines, the plan for the window, and the standing rules that mention them. Records are filtered by term and window to keep the payload focused; the proxy caps `system` at 4 000 chars and `question` at 120 000.

**Server side (`api/pp.js`):** `POST` only → reads `ANTHROPIC_API_KEY` from env → forwards to `https://api.anthropic.com/v1/messages` with `model: claude-sonnet-4-6`, `max_tokens: 1000` → returns `{ text }` (joined text blocks) or `{ error }`. Non-POST → 405; missing key → 500 with a clear message; upstream error → passthrough status.

### 8.3 Rendering
The model's text is rendered under a **"Analysis"** eyebrow with the quick table above it, so the user always sees the raw records that the verdict was based on.

---

## 9. Reply chrome and logging

- Each reply carries a **kind label** (`lookup`, `story`, `why (model)`, …) and a **source line** naming the sheets used.
- **Thumbs / question log:** every Q/A can be posted to `/api/pplog` → an Apps Script web app (`PP_QuestionsLog_AppsScript.gs`) that appends `timestamp | household | question | intent | answer | usedModel` to a Google Sheet. Requires `PP_LOG_URL` + `PP_LOG_KEY` in Vercel. Failure is silent.
- **Busy state:** `PPBOT.busy` blocks a second send until the reply lands; a spinner shows.
- **Escaping:** all user text and record text goes through `ppbotEsc` before hitting the DOM.

---

## 10. Worked examples

| User | Intent | Path | Reply shape |
|---|---|---|---|
| "do we have onion" | lookup | resolver → `Onion 1100 g` | ✓ table |
| "kitna tamatar hai" | lookup | `tamatar` → family `tamatar` → EXCL rejects ketchup/puree → `Tomato 4 pc` | ✓ table |
| "onoin?" | lookup | leftover → Lev(`onoin`,`onion`)=1 → corrected | table + "did you mean onion?" |
| "onion, tomato, garlic, ginger" | lookup (list) | `ppIsList` → 4 rows | list-check table with ✓/⚠/✗ |
| "where was the paneer used" | story | `ppStory(paneer)` | orders in / deductions out card |
| "and tomato?" | story (inherited) | topic intent kept, term swapped | tomato story |
| "how much of that is left" | lookup (inherited terms) | topic terms, intent → lookup | tomato table |
| "what did we cook yesterday" | cooked | window = yesterday → `Meals` + `Deductions` | dishes + lines |
| "what's the plan for tomorrow" | plan | `LIVEPLANS[house][weekday]` | B/L/D with pax |
| "enough for chicken curry for 4?" | need | dish → ingredients → sufficiency | per-ingredient ✓/short |
| "why was 500g chicken deducted on 15th" | why | quick table + model with ledger lines | records + verdict quoting date/dish/before→after |
| "add 2 kg onion" | action | refused | "I'm read-only — use the board" |
| "what veggies do we have" | category | bucket = Vegetable | grouped list |
| "how much milk do we use per week" | rate | Σ deductions / 7 | per-day + per-week |
| "when was curd last counted" | changes | change log for curd | old→new, date, source |

---

## 11. Known limitations (as of 17 Sep 2026)

- The assistant answers for **one household at a time** (the one selected on the dashboard). Cross-household questions ("who has the most onion") are not supported.
- `need` dish extraction is regex-based; unusual phrasing may fail to isolate the dish name.
- `rate` uses ledger deductions only; it does not infer consumption from counts.
- Weekday resolution returns the **most recent** matching weekday; "next Monday" is treated as this coming Monday only if a future marker is present.
- The model path requires `ANTHROPIC_API_KEY` in Vercel; without it, `why` questions show the quick table plus a clear "assistant unavailable" note.
