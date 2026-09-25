# PantryPulse — Codebase

Source of the PantryPulse multi-household kitchen-inventory & meal-prep operating system.
This mirror is updated on every production push so the tech team always sees current code.

## Layout
- `src/engine/`   IGHO engine: dish splitter, ingredient matcher/resolver, hov helpers, per-need recipe assets
- `src/api/`      Server routes: menu-planner proxy, live recipe bake, handover Excel export, igho asset route
- `src/ops/`      Operational tooling: write-guard (duplicate/unit-twin prevention), push/publish pipeline, snapshot writer, perishable-overwrite + set helpers, header-aware row iterator
- `src/server/`   Dev server
- The deployed app itself is the single self-contained file at `private/pantrypulse.html` (dataset embedded, auth-gated).

## Key modules
- **igho-engine / igho-matcher** — four-tier fuzzy dish lookup, synonym + product-family + form + distinct-qualifier guards.
- **pp_guard** — the integrity layer: canonical row resolution (no g/pc twins), conservative merge, push-time duplicate audit, shelf-stable protection.
- **menuplan / recipes** — read-only, credentialed pulls from the meal planner and the live recipe sheet (keys held server-side).
- **pp_git_push / push_asset** — versioned publish: build-id stamp, board snapshot, boot test, atomic upload.

## Full model contents
- `app/pantrypulse.html`  the deployed application (dataset embedded, auth-gated)
- `src/`   all source (engine, api, ops, server)
- `data/ledgers/`   orders, deductions, meals, history, change_log, inventory_checks (full audit trail)
- `data/reference/`   index, master_fnv (2,022-SKU catalogue), sku_knowledge, dishes_library, shelf_life_rules, conversions, ingredient_map, deduction_method, subscriptions
- `data/households/`   every household board (current stock)
- `data/snapshots/`   board_snapshots (immutable historical boards)
- `docs/specs/`   product & feature specs (deduction logic, portion calibration, PP Ask, Master FnV, snapshots, freshness, use-priority, handover, recipe fetching)

_Last synced: 2026-09-25 14:29 IST_
