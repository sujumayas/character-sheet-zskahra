# Training Packages

## Purpose & state

**STUB / EMPTY TEMPLATE.** Despite the tab's name, this sheet contains **zero actual Training Package data**. It is a blank scaffolding of 11 repeated header blocks, each laid out identically with `Nombre / Cost / Ranks` columns and SUM formulas, but with no package names, no skills, no rank values, and no DP costs filled in. All 50 cells are either header labels (repeated `"Nombre"`, `"Cost"`, `"Ranks"`) or formulas that currently evaluate to `0`.

In Anima: Beyond Fantasy RAW, Training Packages (e.g. *Soldier*, *Thief*, *Acrobat*) are bundled rank purchases sold at a 25% discount versus paying for the ranks individually. The sheet author appears to have laid out 11 empty slots intending to populate them later — that work was never done.

## Layout

Top control row (row 1):
- `A1` "BONUS DPs" / `B1` `=SUM(A2:A205)` -> 0 (sums all the per-package "negative cost" cells in column A as a running BONUS DP tally)
- `C1` "Discount" / `D1` `=round(B1/25%*75%,0)` -> 0 (back-computes the full undiscounted total from the 25% discount: `bonus / 0.25 * 0.75`)
- `E1` "COST" (header for column E)

Each Training Package block is structured as:

| Cell | Content |
|---|---|
| `A{n}` | `=-E{n}` — mirrors package's discount as a *negative* number, fed into `B1` |
| `B{n}` | "Nombre" (label header — package name would go here) |
| `C{n}` | "Cost" (header) |
| `D{n}` | "Ranks" (header) |
| `E{n}` | `=SUM(E{a}:E{b}) - round(SUM(E{a}:E{b}) * 75%, 0)` — i.e. the 25% discount on the listed line items |
| Rows below | Empty — would list one skill/category per row with its individual DP cost in E and rank count in D |

### The 11 package slots (all empty)

| # | Header row | Body range | Body capacity (rows) |
|---|---|---|---|
| 1 | 3 | E4:E14 | 11 |
| 2 | 16 | E17:E27 | 11 |
| 3 | 29 | E30:E36 | 7 |
| 4 | 38 | E39:E41 | 3 |
| 5 | 43 | E44:E46 | 3 |
| 6 | 48 | E49:E51 | 3 |
| 7 | 53 | E54:E56 | 3 |
| 8 | 58 | E59:E61 | 3 |
| 9 | 63 | E64:E72 | 9 |

Note: the JSON shows 9 visible header blocks (rows 3, 16, 29, 38, 43, 48, 53, 58, 63). The user's prompt says "11 packages" — only 9 are present in the dump; the rest may exist further down with no formulas yet.

## Sample packages

**None to quote.** Every "Nombre" cell is the literal string `"Nombre"` (Spanish for "Name") used as a column header, not an actual package name. Every cost/rank cell is empty. Example, the first block verbatim:

```
Row 3:  A3=0 (=-E3) | B3="Nombre" | C3="Cost" | D3="Ranks" | E3=0 (=SUM(E4:E14)-round(SUM(E4:E14)*75%,0))
Rows 4–14: completely empty
```

## Cross-tab refs

**No outbound or inbound references found in this tab.** There are no formulas pointing at `'2.1 Categories'!...` or `'2.2 General Skills'!...`, nor are there VLOOKUPs/IMPORTRANGE pulls. If `2.1 Categories` and `2.2 General Skills` reference Training Packages anywhere, they would be reading these (currently zero-valued) `B{n}` name and `E{n}` cost cells — but since the cells are empty the references would be no-ops today.

The only intra-tab reference pattern is the ladder:
- `A{n} = -E{n}` (per-package discount, negated)
- `B1 = SUM(A2:A205)` (aggregate bonus DP across all packages on the sheet)
- `D1 = round(B1/0.25*0.75, 0)` (full undiscounted DP equivalent)

This implies the sheet author intended a single character to "own" all packages on the page and the totals at the top to feed back into the master DP/Bonus block on `1. Combat & DP` or similar — but again, no cross-tab formula confirms this.

## DB mapping

Because the sheet is empty, there is **nothing to migrate**. The DB schema you described already covers everything the layout would need *if* it were populated:

| Sheet concept | DB target |
|---|---|
| `B{n}` package name | `training_packages.name` |
| `E{n}` total discounted cost | `training_packages.total_dp_cost` (store post-discount value; or store raw and compute) |
| Body row: skill + ranks | `training_package_skills (skill_id, ranks_granted)` |
| Body row: category + ranks | `training_package_categories (category_id, ranks_granted)` |
| "pick a weapon" line items | `training_package_choices (choice_name, ranks_granted, required_weapon_type_id)` |
| Player adopts package | `character_training_packages (dp_paid, acquired_at_level)` |
| Player's chosen weapon at runtime | `character_training_package_choices (chosen_weapon_id)` |

The 25%-off pattern (`SUM - round(SUM * 0.75)`) hard-codes the Anima rulebook discount. In the new DB this is just business logic: store either the discounted `total_dp_cost` directly (simpler) or store undiscounted line items and apply `0.25 * line_total` discount on read.

## Recommendations

1. **Defer migration of this tab.** There is nothing to import. The DB has 0 rows and the sheet has 0 packages — a clean slate.
2. **Keep the schema as-is.** The proposed tables (`training_packages`, `training_package_skills`, `training_package_categories`, `training_package_choices`, `character_training_packages`, `character_training_package_choices`) cover the full Anima Training Package model including the weapon-choice case.
3. **Source content elsewhere.** Populate `training_packages` from the Anima: Beyond Fantasy core book (Soldier, Acrobat, Thief, Page, Apprentice Wizard, etc.) — not from this sheet. A simple DM-facing CRUD UI gated on `created_by_dm_id` is sufficient.
4. **Apply the discount in code, not in DB.** Store `total_dp_cost` as the *post-discount* value that the player actually pays; record the gross sum in a derived view if you need to display "you save 25%".
5. **Validation rule worth keeping:** every package's `total_dp_cost` should equal `round(0.75 * sum(line_item_costs))` to mirror the rulebook — assert this in a server-side check when DMs create/edit packages.
6. **No cross-tab refactor needed** for `2.1 Categories` / `2.2 General Skills` since this tab never fed them.
