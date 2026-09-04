# PantryPulse — Feature Work Handoff (for the Cowork session)

**Date:** 5 Sep 2026 · **Current build:** v21_679 / MASTER_748 · **Owner:** Bhavya (Curious Inc.)

## Links
| What | Where |
|---|---|
| Repo (source of truth) | https://github.com/bhavveeee/pantrypulse-app · branch `main` |
| The app (one file) | `private/pantrypulse.html` in the repo (~4.5 MB; ~2.9 MB is the embedded workbook as base64) |
| Live | https://pantrypulse-app-chi.vercel.app/private/pantrypulse.html (Google SSO, `@curiousinc.com`) |
| Operating manual | `docs/HANDOFF.md` — read first. Households, rules, norms, build protocol, hard-won lessons |
| Tools | `tools/` — `pp_deduct.py` (deduction engine), `pp_changelog.py` (every change is logged), `book.py`, `apply.py`, `pp_git_push.py` (deploy), Apps Scripts |
| Serverless | `api/` — `pp.js` (PP assistant → Claude), `pplog.js` (question log), `emergent.js`, `recipe.js`, `rasoi.js`, `sheet.js` |

## Deploying (the only way)
```bash
export PP_GITHUB_TOKEN=<from Bhavya — never commit it>
python3 tools/pp_git_push.py private/pantrypulse.html "vNN_nnn / MASTER_nnn - what changed"
```
`pp_git_push.py` now runs a **headless boot test** and refuses to push a file that does not load its households. Do not bypass it. Vercel auto-deploys from `main`; `private/` is served with no-cache headers.

**Build protocol (every push):** bump `::v21_n`, `BUILD='v21_n'` and `MASTER_n` in the file; if the workbook changed, re-embed it and assert the embedded bytes match; `node --check` the main script; **run the boot test**; push; present.

## Editing the one big file safely
The app is a single HTML with three `<script>` blocks; the big one holds everything. Work with Python `str.replace` against exact anchors, assert the anchor exists, and re-check `<script>` count == `</script>` count == 3. Never edit the base64 blob by hand. `paint()` sweeps unknown elements off `document.body` — any new floating UI must be whitelisted by id in that sweep (see `ppbot`, `skup`).

## Features as of today — and what is weak
| Feature | State | Known weakness |
|---|---|---|
| Dashboard chips (red/yellow/green by shelf-life age) | working (regressed for a week, fixed 4-Sep) | `boxColour()` must call `ppShelfG()` — never `SHELF[name]` |
| **SKU dossier side panel** (click a chip) | new 4-Sep | scoped to latest purchase; photo is a placeholder for the cook's live images; 2,666 old orders have no recorded unit → shows "(unit not recorded)" |
| **PP assistant** (bottom-right) | new 4-Sep | 44+25 synonym families; list-check ✓/✗ table; story card for usage; "why" questions need `ANTHROPIC_API_KEY` in Vercel. Dictionary is finite — unknown names fall to near-miss hints |
| Question log | new 4-Sep | needs `PP_LOG_URL` + `PP_LOG_KEY` in Vercel and the Apps Script in `tools/PP_QuestionsLog_AppsScript.gs` deployed; until then per-browser only |
| Handover + cart | working | four states (available / shortfall / not available / don't know); cart never auto-orders |
| Smart list | **locked** to a Work-in-progress notice (`PP_SMARTLIST_WIP=true`) on Bhavya's instruction — do not unlock without asking |
| Change Log sheet | new 4-Sep, 6,370 entries | every tool writes to it; PP and the panel read it |

## Hard rules the code must keep enforcing
- One (household, date, dish, SKU) deduction only — `pp_deduct.py` refuses duplicates
- Confusable families never cross-match: kasuri methi / fresh methi / methi seeds; coriander powder / seeds / leaves; fresh vs sauce / dried / snack / powder
- A fresh ingredient never resolves to a packaged drink, snack, or processed look-alike
- Yash & Manik (h10): deduct at **one-third** of the 2-pax norm; round down on pieces
- Legumes soaked the day before are deducted **at soak**, never again on the cooking day
- A short item list = set those values only; a *full* overwrite never removes everyday aromatics (green chilli, curry leaves, coriander, mint, ginger, garlic, onion, potato)
- Every count-driven value is labelled "Bhavya overwrote — smart-list check result"
- Recipe Master write-back stays OFF (`PP_SHEET_WRITEBACK=false`)

## Where the errors have come from (so the recon knows where to look)
Error census to 1-Sep: 77 of my errors vs 118 pre-existing data problems. Top causes: duplicate SKU rows (R&R has ~109 redundant rows), wrong-row fuzzy hits on processed look-alikes, gram-vs-piece unit mismatches, double deductions from hand-written close scripts bypassing the engine. **The single biggest improvement available is routing every close through `pp_deduct.py` and deduplicating the boards.**

## Ideas Bhavya has raised that are not built yet
- Cook's live photos in the SKU panel (placeholder exists)
- Reading Tequila carts directly instead of dictated order lists (protocol in `ops/TEQUILA_READING_PROTOCOL.md`)
- Board deduplication pass (proposed merge list for approval, R&R and Munz first)
- Backfilling the 2,666 unrecorded order units from the deduction ledger (label as inferred)
