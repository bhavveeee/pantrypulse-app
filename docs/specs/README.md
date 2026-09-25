# PantryPulse — Feature Specifications for the Next Model

Extracted from the live PantryPulse codebase (build **v21_713 / MASTER_902**, 17 Sep 2026): the single-file app, `pp_deduct.py`, `pp_snapshot.py`, `pp_git_push.py`, `api/pp.js`, and the `Deduction method`, `SKU Knowledge`, `Conversions`, `Master FnV`, `Index` and `Board Snapshots` sheets. Every rule documented here is what the current system **actually does**, with the incident that motivated it where one exists.

| # | File | Feature | Read this if you are building… |
|---|---|---|---|
| 01 | `01_DEDUCTION_LOGIC.md` | How ingredients come off a board when a meal is cooked | the consumption engine, resolver, ledger, order/count arithmetic, conversions, duplicate handling |
| 02 | `02_SKU_PORTION_FACTOR_CALIBRATION.md` | How much is consumed, and how per-household factors are tuned | portion norms, intensity, clamps, the household-factor knob, the calibration procedure (Yash worked example) |
| 03 | `03_CHATBOT_PP_ASK.md` | The read-only in-app assistant | intent classifier (17 intents), term extraction, typo recovery, conversation memory, quick renderers, model path & prompt |
| 04 | `04_MASTER_FNV.md` | Shelf-life & bucketing reference | the reference sheet, shelf classes, the resolver chain, age → badge maths, condition rules |
| 05 | `05_PREVIOUS_DATE_SNAPSHOTS.md` | Read-only historical boards | the snapshot sheet, publish hook, "last push = locked board", reader logic |
| 06 | `06_MANUAL_RELOAD_AND_FRESHNESS.md` | Guaranteeing users see the latest code + data | cache headers, ↻ Reload app, version poll & banner, BUILD/BUILD_TS stamping |
| 07 | `07_USE_PRIORITY_LIST.md` | Ranking perishables by urgency | qualification, shelf precedence, the age-source hierarchy, order matching tiers, urgency maths |
| 08 | `08_HANDOVER.md` | Daily meal-prep sheet: dish → ingredients → availability → cart → Excel | plan sync & enrichment, the sequential ledger simulation, the four honest states, unit reconciliation, cart, the Umami-layout export, locked past days |

## How the seven fit together

```
Master FnV ─────┬──▶ shelf life ──▶ Use priority (what to cook first)
                │                  ▶ board chip tints, assistant "age"
                │
Emergent plan ──┼──▶ Deduction logic ──▶ ledger ──▶ assistant (why / story / rate)
                │        ▲
Portion/factor ─┘        │
                    SKU Knowledge + PP_SYN families (resolver, shared by deduction & chatbot)

Every publish ──▶ BUILD_TS stamp ──▶ Snapshot boards ──▶ boot test ──▶ push
                                  └──▶ freshness banner on stale clients ◀── ↻ Reload app
```

## Cross-cutting rules that every spec assumes

- **One workbook is the system of record.** Nothing changes a board without a ledger / change-log line carrying its source and reason.
- **Never invent.** Zero stock is flagged, not deducted; an unmatched name is `NO ROW`, not a guess.
- **Units never mix.** Grams and pieces are hard-separated; only kg↔g and l↔ml convert.
- **Older lot first** when the same item exists in two lots.
- **Orders add, counts overwrite.**
- **Fix data in the sheet, not in code** — shelf life in Master FnV, aliases/guards in SKU Knowledge, factors in Index + Deduction method.
- **Stale client ≠ data bug.** Check the build time before re-editing anything.

## Items flagged as "open" for the new model (collected from the specs)

1. Apply `ppBestRow` live-row preference **inside the deduction loop**, not only in the UI (Deduction §2.6).
2. Add a normalised `sku_key` to snapshot rows and to order rows so historical and order joins stop depending on fuzzy name matching (Snapshots §6, Use priority §9).
3. Move `LONGSHELF` / `OPENED` overrides into Master FnV columns (FnV §8, Use priority §9).
4. Clear a stored past **Expiry** date whenever a row is restocked or re-counted (FnV §5.3).
5. Add `/api/version` so the freshness poll stops downloading the full file (Reload §7).
6. Encode factor changes in **all three places** (Index, Deduction method, smart-list factor) with dated evidence (Factor §5.2, §9).
