# Equipment

## Purpose & state

This tab is a small, self-contained **armor + shield calculator/reference** sheet. It has two functional blocks plus two static lookup blocks:

1. **Armor calculator (rows 2–11, cols A–H)** — a 7-row table (one per body part) where the player picks an armor material per body part and the sheet computes the per-part armor bonus, the per-part penalty (clamped against the wearer's "Wear Armor" skill from `2.2 General Skills`), the armor's contribution to total armor penalty (weighted by % body coverage), and a simple BD ("Body Defense" / "Armor Bonus" — col E "Total" summed in `E11`).
2. **Shield calculator stub (rows 13–14)** — a single shield row with `Untrained / Trained / Special / Total Untrained / Total Trained / DB Shield / Crit / Hits` headers but only `E14`/`F14` carry formulas (`=B14+D14`, `=C14+D14`). All inputs are blank — this is a per-character entry row, not yet filled.
3. **Armor Types reference table (rows 21–28, cols A–D)** — the rules-data lookup that drives the calculator: "None / Plain Clothes / Basic / Gambeson-Lamellar / Mail-Scale / Brigadine / Plate" → Full Armor Bonus, Min Penalty, Max Penalty.
4. **Body Part % Covered reference table (rows 29–36, cols A–B)** — the seven body parts with their coverage weights (0.15, 0.28, 0.21, 0.15, 0.05, 0.12, 0.03 — sums to 0.99).
5. **Shields reference table (rows 38–44, cols A–G)** — the five canonical shields (Buckler / Target / Shield / Full / Wall) with Untrained / Trained DB, 1st Crit type, Hits, Weight (lb), KG.

The whole sheet is 157 cells / 44 rows / 12 KB. There is exactly **one** cross-tab reference (`H1` pulls the character's "Wear Armor" skill score), and that single number drives every per-part penalty calculation. Apart from that, the tab is entirely self-contained: the armor formulas read static blocks A21:D28 and A29:B36 living a few rows below.

## Inputs

Player-editable cells:

| Cell | Meaning | Notes |
|---|---|---|
| `B3:B9` | Armor material per body part (Head / Torso-Back / Stomach-Hip / Arms / Hands / Legs / Feet) | Currently all blank. Must match a label in `A22:A28` (`None`, `Plain Clothes`, `Basic`, `Gambeson/Lamellar`, `Mail/Scale`, `Brigadine`, `Plate`) for the lookup to resolve. |
| `D3:D9` | Crafting multiplier per body part | Optional. If blank, `E3:E9` falls back to raw bonus; if present, multiplies the bonus. |
| `B14` | Shield Untrained DB (selected shield's untrained value) | Player copies the value for their chosen shield from rows 40–44, col B. |
| `C14` | Shield Trained DB | Same, from col C. |
| `D14` | Shield Special bonus | Free-form per-character bonus. |

Cells that look editable but are effectively static labels: `A3:A9` are the body-part names and serve as MATCH keys for `INDEX(A30:B36, …)` — they are typed values, not formulas, but should not be changed.

There is **no shield-name picker** in the live block: the shield reference table (rows 39–44) is paged separately and the player manually transcribes the chosen shield's stats into `B14:D14`. `G14` (DB Shield), `H14` (Crit), `I14` (Hits) are blank — no formulas — meaning the shield row is a stub that does not auto-populate from the reference table.

## Formulas

### Cross-tab header

| Cell | Formula | Computes |
|---|---|---|
| `H1` | `='2.2 General Skills'!M11` | Pulls the character's **Wear Armor** skill total (currently `-13`). Used as the only modifier on per-part max-penalty clamp. |

### Armor calculator (rows 3–9, one row per body part)

Pattern is identical for all 7 rows. Documented from row 3 (Head):

| Cell | Formula | Computes |
|---|---|---|
| `C3` | `=round(iferror(index($A$21:$B$36,match(B3,$A$21:$A$36,0),2),0)*iferror(index($A$21:$B$36,match(A3,$A$21:$A$36,0),2),0),0)` | **Bonus**: looks up the chosen material's "Full Armor Bonus" (col B of the armor-type table, but read as col 2 of the union range A21:B36) and multiplies by the body-part % coverage (also col 2 of the same union range). `iferror(…,0)` returns 0 if either lookup fails (e.g. blank material). Rounded to integer. **Quirk:** the lookup range is the union `$A$21:$B$36` of *both* the armor-types table (rows 21–28) and the body-part table (rows 29–36). MATCH on the material finds it in rows 22–28; MATCH on the body part finds it in rows 30–36. Both return col 2 of the union. This is a clever single-range trick — but the same row-set also contains the headers/section titles ("Armor Types", "Body Part") at rows 21 and 29, which do not match either MATCH key, so they're harmless. |
| `E3` | `=if(D3="",C3,C3*D3)` | **Total**: if no crafting multiplier, use raw bonus; else multiply. |
| `F3` | `=(MIN(INDEX($A$22:$D$28,match(B3,$A$22:$A$28,0),4)+$H$1,MIN(INDEX($A$22:$D$28,match(B3,$A$22:$A$28,0),3))))` | **Penalty**: the smaller (more negative, i.e. less harsh in absolute terms — but actually the Excel `MIN` of two negatives picks the *more negative* one, so this picks the worse of the two clamps) of: (a) the material's **Max Penalty** (col D of armor types, which is the most negative value, e.g. -100 for Plate) **plus** the character's Wear Armor skill (`H1`, currently -13), and (b) the material's **Min Penalty** (col C, the *least* harsh value, e.g. -20 for Plate). The inner `MIN(INDEX(…,3))` of a single value is a no-op (single-arg MIN). **Note on semantics:** this implements an Anima-style "your Wear Armor skill reduces the maximum penalty you suffer down to the floor of Min Penalty" rule — i.e., a character with high Wear Armor pays at most Min Penalty; a character with low or negative Wear Armor pays Max Penalty + skill (capped no worse than Max Penalty). With `H1 = -13` and Plate's `Max=-100`, `Min=-20`, the clamp resolves to `MIN(-113, -20) = -113`, suggesting the formula chooses the **harsher** of the two when skill is negative. **This may be a sheet bug** — most Anima implementations clamp to the *less* harsh penalty (i.e. `MAX(MaxPenalty + skill, MinPenalty)`). Worth flagging for the team. |
| `G3` | `=INDEX($A$30:$B$36,match(A3,$A$30:$A$36,0),2)` | **% covered** for this body part, looked up from the static body-part table. Equivalent to a hard-coded `0.15` for Head, `0.28` for Torso, etc. — but kept dynamic so the static table is the single source of truth. |
| `H3` | `=G3*F3` | **Weighted penalty contribution** for this body part = `% covered × penalty`. |

Rows 4–9 repeat the same pattern with row-relative references (B4..B9, A4..A9, etc.). Body parts: Head, Torso/Back, Stomach/Hip, Arms, Hands, Legs, Feet.

### Armor totals (row 10–11)

| Cell | Formula | Computes |
|---|---|---|
| `H10` | `=round(SUM(H3:H9),0)` | **Total armor penalty**, integer-rounded sum of all weighted per-part penalties. With current inputs (all blank), it shows `#N/A` because the per-row F-cells fail their MATCH on the empty `B3:B9` strings. |
| `E11` | `=sum(E3:E9)` | **Armor BD** (label `A11 = "Armor BD"`) — sum of all per-part `Total` armor bonuses across the 7 parts. Currently `0`. |

### Shield row (row 14)

| Cell | Formula | Computes |
|---|---|---|
| `E14` | `=B14+D14` | **Total Untrained DB** = Untrained value + Special bonus. |
| `F14` | `=C14+D14` | **Total Trained DB** = Trained value + Special bonus. |
| `G14`, `H14`, `I14` | (no formula, blank) | DB Shield / Crit / Hits — manual columns. |

### Shields reference table (rows 40–44)

Two formulas per row, identical pattern. Documented for row 40 (Buckler):

| Cell | Formula | Computes |
|---|---|---|
| `E40` | `=C40*3` | **Hits** = Trained DB × 3 (i.e. shield HP scales with trained block value). |
| `G40` | `=ROUND(F40*0.45359237,1)` | **KG** = Weight (lb) × 0.45359237, rounded to 1 decimal — pounds-to-kilograms conversion. |

Same for rows 41 (Target Shield), 42 (Shield), 43 (Full Shield), 44 (Wall Shield).

## Cross-tab refs

Exactly one inbound reference, none outbound (no other tab in this dump references `Equipment!…`):

| Cell | Reference | Purpose |
|---|---|---|
| `H1` | `'2.2 General Skills'!M11` | Pulls the character's **Wear Armor** skill total. Feeds the per-part penalty clamp at `F3:F9`. |

The team should verify whether *any* downstream tab (Combat Dashboard, Playing Dashboard) consumes `Equipment!E11` (Armor BD) or `Equipment!H10` (total armor penalty) or `Equipment!E14`/`F14` (shield DB total). On structural read, those are this tab's "outputs" — but if no other tab pulls them, the calculator is informational only and the player must hand-copy values into Combat. (This was not visible from the Equipment dump alone; cross-tab inbound was checked there.)

## Static lookup tables (DB-seed candidates)

These three blocks are the rules data baked into the sheet. They are the highest-priority candidates for migration to DB seed tables, because every armor/shield computation in the sheet (and presumably elsewhere in the workbook, though not yet confirmed) reads from them.

### Armor Types — `A21:D28`

| Material | Full Armor Bonus | Min Penalty | Max Penalty |
|---|---:|---:|---:|
| None | 0 | 0 | 0 |
| Plain Clothes | 10 | 0 | 0 |
| Basic | 20 | 0 | -20 |
| Gambeson/Lamellar | 30 | -10 | -40 |
| Mail/Scale | 40 | -10 | -60 |
| Brigadine | 50 | -20 | -80 |
| Plate | 60 | -20 | -100 |

Header row at row 21: `Armor Types | Full Armor Bonus | Min Penalty | Max Penalty`.

### Body Part % Covered — `A29:B36`

| Body Part | % Covered |
|---|---:|
| Head | 0.15 |
| Torso/Back | 0.28 |
| Stomach/Hip | 0.21 |
| Arms | 0.15 |
| Hands | 0.05 |
| Legs | 0.12 |
| Feet | 0.03 |

Sum = **0.99** (not 1.00). Likely intentional rounding (anima books typically use 99% to allow a "1% lethal hit" slot), but worth confirming with the team.

### Shields — `A39:G44`

Header row 39: `Shield | Untrained | Trained | 1st Crit | Hits | Weight | KG`. Banner row 38 (merged `A38:G38`) reads `SHIELDS`.

| Shield | Untrained DB | Trained DB | 1st Crit | Hits | Weight (lb) | KG |
|---|---:|---:|---|---:|---:|---:|
| Buckler | 0 | 15 | Crush -Tiny | 45 | 4 | 1.8 |
| Target Shield | 5 | 20 | Crush -Small | 60 | 10 | 4.5 |
| Shield | 10 | 25 | Crush -Medium | 75 | 15 | 6.8 |
| Full Shield | 15 | 30 | Crush -Large | 90 | 20 | 9.1 |
| Wall Shield | 20 | 40 | **Crush -Small** | 120 | 30 | 13.6 |

`Hits` and `KG` are computed (`=Trained*3`, `=Weight*0.45359237` rounded to 1 dp). Untrained / Trained / 1st Crit / Weight are typed.

**Likely typo:** Wall Shield's `1st Crit = "Crush -Small"` breaks the size progression (Tiny → Small → Medium → Large → ?). It should almost certainly be `"Crush -Huge"` or `"Crush -Enormous"` — call out to the team to verify against the Anima rulebook before seeding.

**Crit-type strings are unstructured.** They mix the damage type ("Crush") and a size descriptor ("-Tiny", "-Small", …) into one freeform string. For DB normalization, split into two columns: `crit_damage_type` (enum: `crush` / `cut` / `pierce` / …) and `crit_size_modifier` (enum: `tiny` / `small` / `medium` / `large` / `huge`).

## DB mapping

| Sheet area | Existing DB target | Status |
|---|---|---|
| `H1` Wear Armor lookup | `character_skills` (or `character_secondary_skills`) Wear Armor row | Already covered by 2.2 General Skills tab; just needs query. |
| `B3:B9` Armor material per body part | **none** — no `character_armor` / `character_armor_pieces` table exists | **Gap flag.** |
| `D3:D9` Crafting multiplier | **none** | **Gap flag.** |
| `C3:C9 / E3:E9` Per-part bonus & total | **none** (derived) | Computed client-side; no storage. |
| `F3:F9 / G3:G9 / H3:H9 / H10` Per-part & total penalty | **none** (derived) | Computed client-side; no storage. |
| `E11` Armor BD total | **none** (derived) | Computed client-side; possibly mirrored into `character_game_values` as a derived "Armor Bonus" stat if the combat dashboard expects it. |
| `B14:D14` Shield Untrained / Trained / Special | **none** — no `character_shield` table | **Gap flag.** |
| `E14 / F14` Shield total DB | **none** (derived) | Computed client-side. |
| `A21:D28` Armor Types reference | **none** — no `armor_types` table | **Gap flag — needs new table + seed.** |
| `A29:B36` Body Part % Covered | **none** — no `body_parts` / `armor_coverage` table | **Gap flag — needs new table + seed.** |
| `A39:G44` Shields reference | **none** — no `shields` table | **Gap flag — needs new table + seed.** |

**Gap summary:** Equipment is the part of the sheet **most disconnected from the existing DB**. Of the ~75 tables in the public schema, none are armor, shield, body-part, or per-character equipment tables. Every sheet input (material per body part, shield choice, special bonus) and every rules table (armor types, coverage, shields) has zero DB representation. Phase 5 must either build that schema fresh or punt on persistence.

## Recommendations

1. **Two-track approach for Phase 5 (recommended).**
   - **Short term (v1 of Equipment tab):** Bake all three static reference tables (`armor_types`, `body_part_coverage`, `shields`) into TS constants in the Next.js app. The data is tiny (7 + 7 + 5 rows), the formulas are trivial, and it lets you ship the calculator client-side without any schema work. Persist the player's per-character choices (material per body part, crafting multiplier, chosen shield + special bonus) as a JSON blob on the existing `character_description` table (e.g. `character_description.equipment_json`) — same deferral pattern that other under-modeled tabs likely use. This unblocks Phase 5 immediately.
   - **Medium term:** Promote the three reference tables to proper DB seed tables and the per-character choices to relational rows. Suggested schema:
     - `armor_types(id, name, full_armor_bonus, min_penalty, max_penalty)` — 7 rows seeded from the table above.
     - `body_parts(id, name, percent_covered)` — 7 rows.
     - `shields(id, name, untrained_db, trained_db, crit_damage_type, crit_size_modifier, hits, weight_lb)` — 5 rows. Compute KG client-side; do not store the derived value.
     - `character_armor(id, character_id, body_part_id, armor_type_id, crafting_multiplier)` — one row per body part per character (or only the equipped ones; upsert keyed on `(character_id, body_part_id)`).
     - `character_shield(id, character_id, shield_id, special_bonus)` — single row per character (or zero, if no shield).
   - When you do the migration, write a one-shot script that reads `character_description.equipment_json` and back-fills the relational rows, then drops the JSON column.

2. **Penalty-clamp formula needs review before porting.** As noted under `F3:F9`, the formula `MIN(MaxPenalty + skill, MinPenalty)` produces the harsher of the two values when skill is negative — i.e. with `H1 = -13` and Plate (`Min=-20, Max=-100`), it returns `-113`, not `-20`. If Anima rules say "Wear Armor skill reduces penalty *down to* Min Penalty as a floor", the correct formula is `MAX(MaxPenalty + skill, MinPenalty)`. **Confirm with the team / rulebook before porting**, and either fix the bug in the port or replicate the sheet's behavior verbatim with a comment flagging the discrepancy.

3. **Body-part coverage sums to 0.99, not 1.00.** Whether intentional (1% lethal slot) or a rounding leftover, document the chosen interpretation in seed data. If the team wants a clean 1.00, redistribute (e.g. Torso 0.29 instead of 0.28).

4. **Wall Shield crit-type is almost certainly a typo.** Sheet says `"Crush -Small"`; progression suggests `"Crush -Huge"` or `"Crush -Enormous"`. Do not seed the typo into the DB without confirming. As a safer default, seed the value as observed and add a `notes` column flagging "verify size".

5. **Crit-type strings should be split on seed.** Replace the single `"Crush -Tiny"` string with two normalized columns (`crit_damage_type` enum, `crit_size_modifier` enum). The `-` prefix is unusual and feels like a "size penalty step" rather than a literal label — verify with the rulebook.

6. **Auto-populate the shield row from the reference table.** The current sheet makes the player hand-copy `B14:D14` from rows 40–44. The Next.js port should make this a dropdown of shields with the `Untrained / Trained / Crit / Hits / Weight / KG` fields auto-filled (read-only) from the chosen shield row. The only player-editable field would be `Special` and the trained/untrained toggle (which the sheet handles by showing both totals; the app could pick one based on the character's Shield skill rank).

7. **Wire `Armor BD` (E11) and `Total Armor Penalty` (H10) into the combat/playing dashboards.** These are the two values that the rest of the sheet *should* consume (armor bonus into defensive totals, armor penalty into action checks). Confirm during Combat Dashboard / Playing Dashboard analysis whether they actually do — if not, the Equipment tab is a dead-end calculator and the team should decide whether to wire it through in v1 or punt.

8. **Keep the union-range trick (`A21:B36`) only if you stay in spreadsheet land.** When porting to TS, split the two lookups (armor type → bonus, body part → coverage) into two cleanly typed reads against `armor_types` and `body_parts`. The compactness of the sheet formula doesn't translate to better code.

---

### Most surprising / load-bearing findings

- **Zero DB representation.** No `armor_types`, `body_parts`, `shields`, `character_armor`, or `character_shield` tables in the schema. Every cell on this tab — both rules data and per-character choice — is a Phase 5 schema gap.
- **One-line cross-tab dependency.** The entire armor penalty system hangs off a single inbound reference (`H1 = '2.2 General Skills'!M11`, the Wear Armor skill). Nothing else from the rest of the workbook reaches into Equipment.
- **Penalty-clamp formula likely inverted.** `MIN(MaxPenalty + skill, MinPenalty)` returns the harsher value when skill is negative (e.g. Plate + Wear Armor -13 = -113). Standard Anima behavior would be `MAX(...)` — flag for rulebook check before porting.
- **Wall Shield 1st Crit = "Crush -Small" breaks the Tiny→Small→Medium→Large progression.** Almost certainly a typo for "Crush -Huge" (or similar). Do not seed verbatim without confirming.
- **Body-part coverage sums to 99%, not 100%.** Possibly intentional (lethal-hit slot), possibly drift — document the team's choice on seed.
- **The shield "live row" (row 14) is a hand-copy stub.** No formula links shield choice to the reference table; the player transcribes Untrained/Trained/Special manually. The Next.js port should replace this with a dropdown.
