# Talents tables

## Purpose

This is the **structured / normalized "effects" lookup table** for every Talent and Flaw in the sheet. Each row encodes a single `(talent, target, bonus)` tuple — i.e. one atomic "this talent grants +X to that thing" effect. A talent that affects N targets occupies N consecutive rows.

It is the spreadsheet ancestor of the six DB bonus tables (`talent_stat_bonuses`, `talent_category_bonuses`, `talent_skill_bonuses`, `talent_weapon_bonuses`, `talent_trait_bonuses`, `talent_game_value_bonuses`). The player-facing tabs (`2.1 Categories`, `2.2 General Skills`, `1. Stats Traits`, etc.) read from here via SUMIF-style lookups keyed on `Affected skill` to add the talent contribution to whatever cell is being totalled.

The only "live" column is `Assign` (E): the player puts a `1` there for talents the character has, `0` otherwise. The `Total Bonus` column (F) is `=E*D`, which is what the rest of the workbook actually pulls.

## Sub-table inventory

There is a **single unified table** spanning rows 1-122 (header on row 1). No sub-sections, no second header row, no separate Talents/Flaws split — Talents and Flaws are interleaved (Flaws have negative `Bonus` values).

| Section | Rows | Cols | Meaning |
|---|---|---|---|
| Talent/Flaw effects table | 121 data rows (2-122) | 6 (A-F) | One row per `(talent, affected_target, bonus)` triple |

`max_row` is reported as 946 in metadata but no cells exist beyond row 122 — that's empty padding from the source spreadsheet. There are zero merged ranges.

## Per-section details

### Talent/Flaw effects table (rows 1-122)

Columns:

| Col | Header (row 1) | Meaning |
|---|---|---|
| A | `Name` | Talent/Flaw name. Filled only on the **first row** of each talent's block; left blank on continuation rows for multi-target talents (see rows 120-121 belonging to "Not Subtle"). |
| B | `Desc` | Free-text description. Filled only on the **first row** of each talent's block (59 cells total = 58 distinct talents + header). |
| C | `Afected skill` | The target the bonus applies to — a skill, category, weapon class, RR trait, stat, or derived game value. `XXXX` / `XXXXX` is used as a placeholder when the talent has no single-target numeric effect (e.g. Accelerated Healing, Ignoble — though Ignoble does have -20 and a target sentinel). |
| D | `Bonus` | Numeric modifier. Range observed: -30 to +25, plus `1.5` (BMR in metres) and `1.0` (Shield Training flag-like). 121 numeric cells. |
| E | `Assign` | Per-character toggle, all `0` in the template. The player writes `1` when the character takes the talent. |
| F | `Total Bonus` | Formula `=E{row}*D{row}`. 121 formula cells. This is the cell other tabs SUMIF against. |

#### Sample rows (verbatim)

```
A1=Name | B1=Desc | C1=Afected skill | D1=Bonus | E1=Assign | F1=Total Bonus

Row 3 : Combat Awareness    | "-30 Perception modifier during Combat (as free action) instead of -50" | Combat Perception | 20.0 | 0 | =E3*D3
Row 5 : Ear for Music       | "+25 to Singing & Play Instruments Skills"                              | Play Instrument   | 25.0 | 0 | =E5*D5
Row 6 : Ear for Music       | (blank desc — continuation)                                             | Singing           | 25.0 | 0 | =E6*D6
Row 10-18 : General Weapon Master  -> 9 weapon-category rows (Chains, Crush & Cleave, Swords, Misile, Misile Powder, Polearms, Thrown, Thrust, Slings) all +10
Row 27 : Instinctive Defense | "+10 to DB for all attacks..."                                         | DB                | 10.0 | 0 | =E27*D27
Row 36-38 : Resistance -all (Mayor) -> 3 rows: RR Will / RR stam / RR Magic, all +10
Row 49 : Blazing Speed       | "+5' (1.5 m.) to BMR..."                                               | BMR               | 1.5  | 0 | =E49*D49
Row 91 : Shield Training     | "Enables the Trained bonus on any shield"                              | DB Shield         | 1.0  | 0 | =E91*D91
Row 98-99 : Crippled         | -> ag -10, qu -3   (stat penalties; flaw)
Row 100-108 : Disavowed Weapons -> 9 weapon rows, all -15  (flaw)
Row 111-113 : Wimp           | -> st -2, Athletic Nimble -20, Athletic Stamina -20  (flaw)
Row 114-117 : One Eye        | -> Misile/Misile Powder/Thrown/Slings all -25  (flaw)
Row 119-121 : Not Subtle     | -> Subterfuge Active -10, Subterfuge Passive -10, Stalking/Hiding -15
Row 122 : Ignoble            | "you have -20 to all intrigue skills but composure" | XXXXX | -20.0 | ...
```

#### DB target classification (`Affected skill` -> DB table)

121 effect rows distribute across the 6 DB bonus types as follows (best-guess mapping by inspection):

| DB table | Likely sheet targets | Approx rows |
|---|---|---|
| `talent_stat_bonuses` | `st`, `ag`, `qu` | 3 |
| `talent_category_bonuses` | `Athletic Nimble`, `Athletic Stamina`, `Communication reactive`, `Communication structured`, `Crafts Fine`, `Crafts Gross`, `Crafting Lores`, `Medicine`, `Performing`, `Subterfuge Active`, `Subterfuge Passive`, `Outdoors Natural`, `Ourtdoors Technical` (sic), `Warfare` | ~25-30 |
| `talent_skill_bonuses` | `Acrobatics`, `Acting`, `Appearance`, `Armor`, `Armor Penalty`, `Awareness`, `Botanics`, `Cartography`, `Climbing`, `Combat Perception`, `Command`, `Contortions`, `Convince`, `Cooking`, `Diplomacy`, `Dirty Fighting`, `Disarm Locks & Traps`, `Duping`, `Endurance`, `Foraging`, `Jumping`, `Lie Perception`, `Mingling`, `Navigation`, `Perception Active`, `Perception Passive`, `Play Instrument`, `Poetry`, `Poisoning`, `Public Speaking`, `Ropemastery`, `Science Analytic`, `Seduction`, `Singing`, `Sleight of Hand`, `Social Sciences`, `Socio Economics`, `Stalking/Hiding`, `Story Telling`, `Swimming`, `Tracking`, `Trade` | ~70 |
| `talent_weapon_bonuses` | `Chains`, `Crush & Cleave`, `Swords`, `Misile`, `Misile Powder`, `Polearms`, `Thrown`, `Thrust`, `Slings` | ~22 (mostly from General Weapon Master ×9, Disavowed Weapons ×9, One Eye ×4) |
| `talent_trait_bonuses` | `RR Will`, `RR stam`, `RR Magic` | 10 |
| `talent_game_value_bonuses` | `BMR`, `Initiative`, `DB`, `DB Shield` | ~4 |
| (none / placeholder) | `XXXX`, `XXXXX` (Accelerated Healing, Ignoble) | 2 |

(The exact split is fuzzy because the spreadsheet treats categories and skills uniformly through one `Afected skill` column; the DB has split them into separate tables. Some targets like `Medicine`, `Performing`, `Subterfuge Active`, etc. are categories rather than skills.)

## How the player sheet uses this tab

Structurally the design is a classic **SUMIF aggregator**:

- The user fills column E (`Assign`) with 1 for talents the character has.
- Column F (`Total Bonus`) computes the per-row contribution as `=E{n}*D{n}`.
- Each player-facing skill / category / stat / weapon / RR / game-value cell on tabs `2.1 Categories`, `2.2 General Skills`, `2.3 Weapon Dexterity`, `1. Stats Traits`, etc. is expected to do a `SUMIF('Talents tables'!C:C, "<this target name>", 'Talents tables'!F:F)` (or equivalent FILTER/INDEX) to pull the talent contribution.
- Because talent names match across multiple rows but the SUMIF keys on column C (target), the multi-row layout works — every row of "General Weapon Master" carries the talent's E value (well, only one E per row, but all share it because the player sets the same `1` on each row of that talent's block — see caveat below).

Caveat / quirk: there is **one Assign cell per row**, not one per talent. A multi-row talent like "General Weapon Master" requires the player to write `1` on **all 9 rows** for the bonus to propagate to all 9 weapon categories. The sheet does not normalize this — every talent-target row has its own independent `Assign` toggle. The DB rebuild should make `talent_id` the joined key with a single "character_has_talent" pivot rather than per-row toggles.

## Cross-tab references (TO this tab)

This tab is purely a lookup target — its formulas reference only its own row (`=E{n}*D{n}`). It does not pull data from anywhere else. Cross-references are inbound: tabs `2.1`, `2.2`, `2.3`, `2.4`, `1.`, etc. are expected to query column C (target name) and sum column F (total bonus). The exact formulas live in those tabs and will be enumerated by the agents analysing them.

## Gaps vs DB

| Aspect | Sheet | DB |
|---|---|---|
| Total bonus rows | 121 | 209 (57+57+70+7+11+7) |
| Distinct talents | 58 | (more than 58 in DB — the DB-side 209 implies a richer talent list, since e.g. 70 skill bonuses alone exceed what 58 talents could cover here) |
| Typed split | Single `Afected skill` column (untyped string) | 6 typed tables (stat / category / skill / weapon / trait / game_value) |
| Conditional / contextual modifiers | None — only flat numbers + free-text descriptions in B | `talent_game_value_bonuses` has explicit `condition` text + `is_active` flag |
| Requirements (prereqs) | None on this tab; only on `2.5 Talents Flaws` | `talent_requirements` (201 rows, polymorphic) |
| Active toggle | Inline `Assign` column per row | Implicit — character has-talent join |
| Targets without numeric effect | `XXXX` / `XXXXX` placeholder (Accelerated Healing, Ignoble) | Modelled as game_value bonus with `condition` text, or as flavor-only in talent table |

**The sheet is a strict subset of the DB.** It contains 121 of the DB's 209 typed effect rows (~58%). The DB has been **expanded** beyond this tab — likely with: more talents, finer-grained breakdowns of vague effects (e.g. "Ignoble" as game_value-with-condition), and the addition of the `talent_requirements` polymorphic table (which has no representation here at all).

Two minor data-quality issues spotted that should be cleaned in migration:
- "Ourtdoors Technical" is a typo of "Outdoors Technical" (row 33).
- "Misile" / "Misile Powder" should be "Missile" / "Missile Powder".
- "Resistance -all (Mayor)" / "Resistance Stamina (Mayor)" / "Resistance Will (Mayor)" use "Mayor" where the intended word is "Major" (compare "Unique Look (Major)" which spells it correctly).
- The `Assign` column being per-row rather than per-talent is the biggest structural mismatch — the DB's `talent_id`-keyed model is a clean improvement.
