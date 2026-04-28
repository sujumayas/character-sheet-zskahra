# 1. Stats & Traits

## Purpose

This is the **character creation foundation tab** for the Zskahra (Anima: Beyond Fantasy variant) sheet. It captures the player's identity (name, race, village, age, appearance, height, weight), their **8 base STATS** (Strength, Constitution, Agility, Quickness, Self Discipline, Reasoning, Insight, Presence) and **6 derived TRAITS** (Endurance, Power Points, General Knowledge, RR Will, RR stam, RR Magic), plus auxiliary tables (language ranks, racial talents, race stat-bonus matrix, race average physical features, the stat→bonus/DP-cost progression ladder, XP-per-level table, and culture/suffix flavor lookup).

It is the **single source of truth for stat totals and trait scores**. Everything else (combat, skills, magic) reads from these computed values. There are NO cross-tab references in this tab — it is self-contained and is *consumed* by every other tab.

## Layout

- Sheet declares `max_row=1035, max_col=24` but actual non-empty data ends at **row 190, col O (15)**. Cols **Q–R (17–18)** carry "STEP#" instructions for the player.
- Real estate is split into roughly 10 vertically-stacked blocks. The left region (cols A–H) holds the editable character data; col J–O holds reference/lookup tables; cols Q–R is a static instruction sidebar.
- Only **7 merged ranges** exist; all are cosmetic (multi-column description text in the racial-talent block):
  - `A12:B12` — header "Name" for STATS table.
  - `A33:C33`, `D33:J33`, `D34:J34`, `D35:J35`, `D36:J36` — chosen-talent description rows.
  - `A70:G70` — banner "RACIAL TALENTS" for the per-race talent reference table.
- 1221 non-empty cells, 220 of which carry formulas. **Zero cross-tab references** (`!` not present in any formula). Lookups inside the tab use `INDEX/MATCH` against the on-sheet race tables `A44:O58` and `A13:G20`.

## Sections

### Section 1 — IDENTITY (rows 1–9, cols A–G; instructions Q–R rows 2–5)

- **Inputs (player):**
  - `B2` — Name (typed string; cell currently empty).
  - `B3` — Race name (e.g. "Vhareth"). Drives every `INDEX/MATCH` in the race tables. **Must match column A in the `A46:A58` race list verbatim** for lookups to resolve; otherwise `iferror` returns 0.
  - `B4` — Village (e.g. "Karven"). Free text but conceptually tied to the `Culture` reference list (`L85:L96`).
  - `B5` — Social Suffix (free text; conceptually tied to the suffix list `N85:N104`).
  - `B6` — Age (numeric); guidance `D6:G6` shows the adult range "16 to 85".
  - `F7` — Appearance roll (1d100 result, currently `98`). Hint label `E7` says "Enter Appearance Roll".
  - `B8` — Height (numeric meters); guidance `D8:G8` shows race range.
  - `B9` — Weight (numeric kg); guidance `D9:G9` shows race range.

- **Formulas:**
  - `B7 = F7 + G20` — final Appearance score = roll + Presence Total bonus (G20). So if Presence bonus is +1, an Appearance roll of 98 yields 99.

- **Cross-tab refs:** none.

- **Notes:**
  - The min/max age/height/weight literals in `D6:G9` appear hand-typed for the *currently selected* race. They likely should pull from `A60:G64` (race average features) but currently do not — see Open Questions.
  - `Q2:R5` is static text: "STEP#1 — IDENTITY", "Choose and fill your characters IDENTITY", "Roll 1d100 for Appearance.", "Choose Height & Weight according to your race".

### Section 2 — STATS (rows 11–20, cols A–H; plus Human Race-mod input in J)

Header row at row 12: `Name | (Stats merged A12:B12) | Stats | Bonus | Race | Spec | Total | Cost Total`.

- **Inputs (player):**
  - `D13:D20` — `Bonus` column. The 8 stat-roll values distributed by the player (10d10 → drop 2 lowest → 8 numbers ranked 0..10+ — the result of the Anima stat-distribution method; see step instructions). These are the raw stat rolls. **Validation reminder in `L14`:** "Must be equal to 8". **Validation reminder in `L15`:** "No single line greater than 3" (each die result distributed to a single stat).
  - `F13:F20` — `Spec` column. Special / one-off bonus. Editable.
  - `J13:J20` — Human race mods (only used when `B3 == "Human"`). Editable. Validation `L13` formula and label `L14` ("Must be equal to 8").
  - `C13:C20` — raw stat percentile (1d100-style value, e.g. Strength 59). Currently typed; appears to feed nothing in this tab but likely consumed by other tabs that need a 1–100 percentile (e.g. resistance checks). Treat as a player-editable display of the actual stat percentile.

- **Formulas (each stat row, 13–20):**
  - `E13 = iferror(INDEX($A$44:$O$58, MATCH($B$3,$A$44:$A$58,0), MATCH($A13,$A$44:$O$44,0)) + IF($B$3="Human", J13, 0), 0)`
    Race modifier for this stat. Looks up the row matching the chosen race (col B3) inside `A44:A58` and the column matching the stat label (`A13`..`A20`) inside `A44:O44`. Adds the Human-specific `J13` only when race is Human (Humans have no preset row in the race table — they assign their own bonuses).
  - `G13 = SUM(D13:F13)` — total stat bonus = roll + race + special.
  - `H13 = D13 + E13` — "Cost Total" = roll + race only (no special). The header `Cost Total` suggests this column drives DP / cost computations on other tabs (it is base+race, ignoring temporary specs).
  - `L13 = SUM(J13:J20)` — sum of Human race mods (must equal 8 per the rule next to it).

- **Cross-tab refs:** none.

- **Notes:**
  - `B13:B20` are stat **codes** ("st","co","ag","qu","sd","re","in","pr") used as MATCH keys by the trait formulas (`B25..C30`).
  - This block is the row-13–20 core; pattern is identical for all 8 rows.

### Section 3 — TRAITS (rows 23–30, cols A–G)

Header row 24: `Traits | Stat 1 | Stat 2 | Cost | Race Mod | Stat Value | Total Trait Stat`.

The 6 traits and their primary/secondary stats:
| Row | Trait | Stat 1 | Stat 2 |
|---|---|---|---|
| 25 | Endurance | co | sd |
| 26 | Power Points | sd | co |
| 27 | General Knowledge | re | in |
| 28 | RR Will | sd | sd |
| 29 | RR stam | co | sd |
| 30 | RR Magic | in | sd |

- **Inputs (player):**
  - `B25:C30` — the two stat codes that define the trait. These look like static config but are stored as plain values (no formula), so technically editable. In practice they are Anima rules constants for these specific traits.
  - `D25:D30` — DP cost (typed; currently 3,3,3,3,3,2). Player-edited per session/build.

- **Formulas:**
  - `E25 = iferror(INDEX($A$44:$O$58, MATCH($B$3,$A$44:$A$58,0), MATCH($A25,$A$44:$O$44,0)), 0)` — Race modifier for this trait, looked up by trait name in the race-mod matrix header row (`A44:O44` includes both stat names and trait names).
  - `F25 = INDEX($A$13:$G$20, MATCH(B25,$B$13:$B$20,0), 7) + INDEX($A$13:$G$20, MATCH(C25,$B$13:$B$20,0), 7)` — Stat Value = (Stat-1 Total at G-col) + (Stat-2 Total at G-col). The `7` is column G (Total) inside the `A13:G20` range.
  - `G25 = E25 + F25` — Total Trait Stat = race mod + stat-derived value.
  - Pattern repeats verbatim for rows 26–30.

- **Cross-tab refs:** none.

- **Notes:**
  - For RR Will both Stat 1 and Stat 2 are "sd", so the formula effectively doubles Self Discipline (this is intentional and matches Anima rules: pure-stat resistance rolls).
  - `J45:O45` produce concatenations like "co / sd" displaying each trait's stat pair as a header in the race-bonus matrix.

### Section 4 — RACIAL TALENTS, chosen (rows 32–36, cols A–J)

Free-form display block listing the 3 racial talents the player picked for their character. Header row 33: `Name | (merged D33:J33) Description`.

- **Inputs:** rows 34/35/36, col A (talent name) and merged D:J (description). All free text; per the example values, the player chose "Unnamed dread", "Double Lineage", "Convergence" (Vhareth's three).
- **Formulas:** none.
- **Cross-tab refs:** none.
- **Notes:** UI affordance only — this is where the player commits the 3 chosen talents. The reference table in rows 70–79 lists *all* talents per race so the player can pick.

### Section 5 — RACE STATS BONUSES matrix (rows 43–58, cols A–O)

A static reference table the formulas in sections 2 and 3 read via `INDEX/MATCH`.

- Row 44 = headers: stat names ("Strength" through "Presence") then trait names ("Endurance" through "RR Magic"). 15 columns labeled.
- Row 45 = stat **codes**: st, co, ag, qu, sd, re, in, pr — and trait codes for cols J–O are themselves formulas: `J45 = CONCATENATE(B25, " / ", C25)` etc. (so the header reflects the current trait stat-pair config — only display, not used by lookups).
- Rows 46–58: one row per race. Race name in col A; stat/trait modifier values in cols B–O.
  - 46 Aldeanos, 47 Zhar, 48 Vhareth — currently the only filled rows. `D46` is a formula `=3` (literal 3).
  - 49–58: 10 empty rows reserved for future races (currently all zeroes).
- **Inputs:** all numeric mods are typed (DM/world-config data, not per-character).
- **Formulas:** only `D46 = 3` and the 6 concatenations on row 45.
- **Cross-tab refs:** none.
- **Notes:** This table is the on-sheet equivalent of the DB tables `race_stat_modifiers` and `race_trait_modifiers` joined into a wide matrix.

### Section 6 — RACE IDENTITY AVERAGE FEATURES (rows 60–64, cols A–O)

Reference table of physical attribute ranges per race.
- Header row 61: `Adult age from | Adult age to | Height From | Height To | Weight From | WeightTo | Common Spoken | High Written | … | Ancient Written` (col O).
- Rows 62 (Aldeanos), 63 (Zhar), 64 (Vhareth) populated.
- **Inputs:** typed reference data. Not consumed by any formula in this tab — purely informational for the player when setting age/height/weight in section 1. Note `H61` "Common Spoken" and `I61` "High Written" are headers but the row data only fills A–G — language defaults are not actually supplied here.
- **Formulas:** none.

### Section 7 — RACIAL TALENTS reference (rows 70–79, cols A–E)

Header banner row 70 (merged A70:G70) "RACIAL TALENTS". Row 71 lists race columns: Aldeanos, Zhar, Thar, Vhareth. Each race column contains up to 5 talents, each as a `Talent#N` row + `Desc` row.

- **Inputs / data:** static. The full talent catalog per race lives here.
- **Formulas:** none.
- **Notes:** Aldeanos has 5 talents listed; others 3-4.

### Section 8 — STAT Progression ladder (rows 84–190, cols A–F)

The classic Anima 1–105 stat→bonus / DP cost ladder.

Row 85 headers: `STAT | Bonus | DPs | Cost SKILL | Bonus+Race | Cost Skill`.
Rows 86–190: stat value (col A) ranges from 1 to 105.

- **Columns:**
  - `A`: stat value (integer 1..105).
  - `B`: bonus (e.g. -18 at stat 1, -8 at stat 30, 0 at 46-50, +1 at 51-55, +2 at 56-60, … +16 at 105). Static lookup.
  - `C`: `=max(B86, 0)` — the non-negative ("DP awarded for having this stat") form. Named "DPs" but actually `MAX(bonus, 0)`. Pattern repeats for rows 86–190 except `C185` which is a literal `11.0` (looks like a manual override / data-entry inconsistency).
  - `D`: skill cost multiplier at this stat value (15 at 1-30, 10 at 16-30, 6 at 31-40, 5 at 41-45, 4 at 46-70, 3 at 71-85, 2 at 86-105). Static lookup.
  - `E` (only rows 85–129): "Bonus+Race" — appears to be `B + (race mod)` for the *currently selected* character; the values run from -18 up to +25. These are typed, not formulaic — they look like a precomputed, per-character ladder column. **Open question: how was this generated?** It might be hand-maintained or copy-pasted.
  - `F` (rows 85–129): "Cost Skill" — alternate cost column matching col D but smaller (4 at 1-30, 3 at 31-, 2 at 41-65). Typed.
- **Formulas:** only the `=MAX(B<row>,0)` per row in column C. No cross-tab refs.
- **DB mapping:** This is exactly the `stat_progression` ladder referenced in DB context (stat_value → bonus, dps, cost_skill, rows 1–105). Cols E and F appear to be local override columns that don't have a clean DB equivalent.

### Section 9 — XP per LEVEL table (cols J–K, rows 84–169)

- `J84` = "XP LEVEL" header. `J85:J169` = level 1..85.
- `K85:K169` = cumulative XP threshold for that level.
- For levels 1–20 (rows 85–104) the values are typed (0, 350, 750, 1200, 1700, 2250, 2850, 3500, 4200, 4950, 5750, 6600, 7500, 8450, 9450, 10500, 11600, 12750, 13950, 15200).
- Levels 21+ (rows 105–169): formula `=K<prev>+2500` — i.e. flat +2500 XP per level after 20.
- **Inputs:** the typed values 0..15200 (DM/world config).
- **Formulas:** `=K<n-1>+2500` for rows 105–169.
- **Notes:** This is a global game constant table, not per-character.

### Section 10 — CULTURE / SUFIX / Meaning lookup (cols H, L–O rows 84–96/104)

- `H84` "Race", `H85:H87` lists Aldeanos / Zhar / Vhareth (race name index).
- `L84` "CULTURE", `L85:L96` 12 cultural-village names (Ksilnar, Theriv, Litor, Kalvek, Hisven, Sithet, Karven, Poymel, Idral, Halvar, Ikhmar, Logven).
- `N84` "SUFIX", `N85:N104` 20 social suffixes ("-dren", "-mork", "-ruk", "-skar", "-thar", "-velar", "-val", "-sar", "-ion", "-mir", "-oth", "-held", "-tav", "-kron", "-kel", "-vran", "-nak", "-khrav", "-veth").
- `O84` "Meaning", `O85:O104` Spanish meanings ("caos", "acecho", "cruce", "escudo", "hogar", "linaje", "tronco", "oficio", "saber", "sanador", "cuidador", "vidente", "guardian", "juicio", "lider", "vacio", "desastre", "destierro", "caos", "del rito").
- **Inputs:** typed reference. Used as picklists for `B4` (village/culture) and `B5` (social suffix).
- **Formulas:** none.

### Section 11 — LANGUAGE RANK BONUS (rows 23–26+, cols J–L)

Sub-block sitting next to the TRAITS section.
- Header row 24: `Language | Spoken | Written`.
- `J25` = "Common", `K25` = 5 (spoken rank), `L25` = 4 (written rank).
- `J26` = "Accounting", `K26` = "X" (literacy/skill flag).
- The block has no formulas; rows beyond 26 are presumably free for the player to add languages.
- **Inputs:** all typed.
- **Notes:** Conceptually a separate mini-table; the row range overlaps TRAITS (cols A–G) but uses col J–L only, so no collision.

### Section 12 — Step instructions sidebar (cols Q–R, rows 2–15)

Static instructional text:
- STEP#1 IDENTITY (rows 2–5) — choose identity, roll d100 appearance, pick height/weight by race.
- STEP#2 STATS (rows 7–12) — roll 10d10, re-roll under 46, drop two lowest, distribute the 8 results across STATS, if Human enter race stat mods (col J).
- STEP#3 (rows 14–15) — allocate DPs between TRAITS, CATEGORIES, SKILLS, TALENTS and FLAWS.

These map onto the multi-tab character creation flow.

## Recurring patterns

1. **Stat row pattern (rows 13–20).** For each stat:
   - `D` = roll, `E` = race mod via INDEX/MATCH, `F` = special, `G = SUM(D:F)`, `H = D + E` (cost basis).
2. **Trait row pattern (rows 25–30).** For each trait:
   - `B`,`C` = stat codes; `D` = DP cost; `E` = race mod via INDEX/MATCH against same race table; `F` = sum of two stats' G-totals via INDEX/MATCH; `G = E + F`.
3. **Race-mod lookup pattern.** All rows 13–20 and 25–30 use the identical INDEX/MATCH form `INDEX($A$44:$O$58, MATCH($B$3, $A$44:$A$58, 0), MATCH($A<row>, $A$44:$O$44, 0))` — single source of race adjustments. Stats branch additionally adds `IF($B$3="Human", J<row>, 0)` because Humans have no preset row in the race table and instead get an editable column J.
4. **Stat ladder C-column pattern (rows 86–190).** `C<row> = MAX(B<row>, 0)` — DP value derived from bonus, never negative. Exception: `C185` is hard-coded 11.
5. **XP ladder pattern (rows 105–169).** `K<row> = K<row-1> + 2500` — flat +2500 XP per level after L20.
6. **Trait header concat pattern (row 45 cols J–O).** `=CONCATENATE(B<25..30>, " / ", C<25..30>)` — purely cosmetic header that mirrors the trait's stat pair.

## Constants / lookup tables

| Range | Purpose | DB equivalent |
|---|---|---|
| `A13:B20` | 8 stat codes (st/co/ag/qu/sd/re/in/pr) | `stats(code)` |
| `A25:C30` | 6 trait definitions with primary/secondary stat code | `traits(name, primary_stat_id, secondary_stat_id)` |
| `A44:O58` | Race stat+trait modifier matrix (15 wide cols, 13 race rows reserved) | `race_stat_modifiers` + `race_trait_modifiers` (long form) |
| `A60:G64` | Race average physical features (age/height/weight ranges) | flavor data — possibly `races(min_age, max_age, …)` columns |
| `A70:E79` | Racial talents catalog (5 per race × 4 races) | `race_talents` table or similar |
| `A85:F190` | Stat → bonus/DP/cost ladder, rows 1–105 | `stat_progression` (stat_value, bonus, dps, cost_skill) |
| `J85:K169` | XP-per-level ladder, levels 1–85 | `level_progression` (also exists in `Level_Progression` sheet) |
| `H85:H87` | Race name picklist source | `races` |
| `L85:L96` | Culture / village picklist | flavor data, e.g. `cultures` table |
| `N85:N104` | Suffix picklist | flavor data, e.g. `name_suffixes` table |
| `O85:O104` | Meaning of suffix | flavor data |

Magic numbers:
- `+2500` flat XP per level beyond level 20.
- "Re-Roll all results under 46" — stat-roll floor (rule, not encoded as formula).
- "Discard the 2 lowest results" — 10d10 → 8 stats rule.
- "Must be equal to 8", "No single line greater than 3" — Human race-mod distribution rules. Currently informational labels only; no automated enforcement formula.

## DM-only vs player-only inputs

The sheet does not visually mark this. By role inference:

**DM / world-config (should be globally shared, not per-character):**
- `A44:O58` race stat/trait modifier matrix.
- `A60:G64` race average features.
- `A70:E79` racial talent catalog.
- `A85:F190` stat ladder (cols A–D static, cols E–F appear to be per-character precomputed — see Open Questions).
- `J85:K169` XP ladder.
- `H85:H87`, `L85:L96`, `N85:N104`, `O85:O104` picklists.

**Player inputs (per-character):**
- Identity: `B2:B6` (name, race, village, suffix, age), `F7` (appearance roll), `B8`, `B9` (height, weight).
- Stats: `C13:C20` raw percentile, `D13:D20` rolled bonus distribution, `F13:F20` special mods, `J13:J20` Human race mods.
- Traits: `D25:D30` DP cost.
- Racial talents chosen: `A34:D36` (3 rows, name + merged description).
- Languages: `J25:L<n>` rows the player adds.

There is no obviously DM-only zone *within the player's character data* on this tab — the chaos / GM-bonus / temp-modifier columns (mentioned in the DB schema for `character_traits` and `character_stats`) **do not exist on this sheet**. They likely live on other tabs (probably `Combat_Dashboard` or `Playing_Dashboard`) or are new app-only fields.

## DB mapping

| Sheet area | DB target |
|---|---|
| `B2` Name | `characters.name` |
| `B3` Race | `characters.race_id` (FK to `races`) |
| `B4` Village | `characters.birthplace_id` or `characters.culture` |
| `B5` Social Suffix | `characters.suffix` |
| `B6` Age | `characters.age` |
| `F7` Appearance roll | `characters.appearance_roll` |
| `B7` Appearance final (`F7 + G20`) | computed/derived (don't store; recompute) |
| `B8` Height | `characters.height_m` |
| `B9` Weight | `characters.weight_kg` |
| `C13:C20` Stat percentile | `character_stats.base_value` |
| `D13:D20` Stat bonus (roll) | `character_stats.stat_roll` (or `stat_bonus`) |
| `E13:E20` Race mod (computed) | `character_stats.race_modifier` (generated/derived from `race_stat_modifiers`) |
| `F13:F20` Special mod | `character_stats.special_modifier` (or via `character_stat_modifiers` row with `source_type='special'`) |
| `G13:G20` Total | `character_stats.total_bonus` (generated) |
| `H13:H20` Cost Total (roll+race) | derived; used as input to `stat_cost_rules` lookup |
| `J13:J20` Human race mods | `character_stat_modifiers` rows with `source_type='human_race_choice'` (only when race='Human') |
| `D25:D30` Trait DP cost | `character_traits.dp_spent` (Open: closest existing column is unclear; might be a new column or computed) |
| `E25:E30` Trait race mod | derived from `race_trait_modifiers` |
| `F25:F30` Trait Stat Value (sum of two stat totals) | derived/generated |
| `G25:G30` Total Trait Stat | `character_game_values.total_value` for trait targets |
| `B25:C30` Trait stat pair codes | `traits.primary_stat_id`, `traits.secondary_stat_id` (config, not per-character) |
| `J25:L<n>` Languages spoken/written | `character_languages` table (Open: not in schema list provided) |
| `A34:D36` Chosen racial talents | `character_talents` (with `source_type='racial'`) |
| `A44:O58` Race mod matrix | `race_stat_modifiers` + `race_trait_modifiers` |
| `A60:G64` Race avg features | `races` columns or a `race_features` table |
| `A70:E79` Racial talent catalog | `race_talents` (or `talents` filtered by race) |
| `A85:D190` Stat ladder (cols A–D) | `stat_progression(stat_value, bonus, dps, cost_skill)` |
| `E85:F129` Stat ladder cols E–F (Bonus+Race, Cost Skill alternate) | **Open question** — appear pre-computed for current character; possibly a separate per-character view |
| `J85:K169` XP per level | `level_progression(level, xp_required)` |
| `H85:H87` Races index | `races.name` |
| `L85:L96` Cultures | new `cultures` table or a column on `birthplaces` |
| `N85:N104` / `O85:O104` Suffixes + meanings | new `name_suffixes` table |

## Open questions / inconsistencies

1. **Stat ladder cols E–F (`E85:F129` "Bonus+Race" and "Cost Skill").** These look like a precomputed per-character ladder rather than universal config. Unclear whether they're typed once and frozen, or whether the original spreadsheet had formulas that got pasted-as-values. They have no formula in the current file. If the app is recomputing the ladder per character, these columns are redundant; if they're meant to be DM overrides, they need a per-character storage column. Recommend treating cols A–D as the canonical universal `stat_progression` and rebuilding E/F dynamically.
2. **`C185 = 11` literal vs. `C186:C190 = MAX(B,0)`.** Row 185 (stat=100) breaks the formula pattern with a hard-coded value 11 (matching `B185 = 11`). Probably a leftover when the cell got overwritten. Result is the same numerically but inconsistent.
3. **`D46 = 3` formula.** Stored as `=3` rather than literal `3` — inconsequential but unusual.
4. **`A60:G64` race features table `H61:I61` and `O61` headers ("Common Spoken", "High Written", "Ancient Written") with no data.** These columns are empty for all races, suggesting a planned but unfilled "default starting language ranks per race" feature.
5. **Row 49–58 race rows are fully zeroed.** 10 reserved blank race rows. The DB will not need these.
6. **No `Total = base_percentile + (stat_bonus*X)` formula.** The sheet stores stat percentile (col C) and stat bonus (col D) independently; the bonus is the input from the 10d10 distribution, not derived from the percentile. This contradicts pure-Anima where the stat percentile drives the bonus via the ladder. Likely the table here is "what you rolled to determine the stat" and the actual bonus is allocated independently per the Zskahra house rule. Confirm with the team — if base_percentile must drive bonus via `stat_progression`, then `D` should be a generated lookup against ladder, not a free input.
7. **DM/temp/GM modifier columns missing.** The DB schema mentions `gm_bonus`, `temp_modifier`, `permanent_modifier`, `talent_bonus`, `equipment_bonus` for both `character_stats` and `character_traits`. None exist on this tab. They're likely consolidated into `F` (Spec) for stats and absent for traits, OR live on Combat / Playing dashboards. Recommend the new app expose them as separate fields and not collapse them into one Spec input.
8. **`B7` Appearance includes Presence bonus (`F7 + G20`).** This is an Anima rule (Presence affects Appearance). The total can exceed 100; in the example it computes to `99`. Confirm capping / interpretation in the app (e.g. Anima typically caps at 100 with overflow giving "Aberrant" status).
9. **Languages section is sparse.** Only `Common` (5/4) and `Accounting` (X) are seeded. The interplay with race default languages (the unfilled `H61:O61` columns) is a stub.
10. **`L13 = SUM(J13:J20)` validation but no enforcement.** Adjacent labels say "Must be equal to 8" and "No single line greater than 3" — these are textual hints, not validators. The app should enforce them when race is Human.
11. **No `chaos`, `life points`, `fatigue`, `KI`, `MK`, `magic_projection` fields.** Despite the DB-context tables (`character_life_points`, `character_chaos`), this tab does NOT compute those. They live elsewhere (Combat_Dashboard, Playing_Dashboard). This tab is purely STATS + TRAITS + identity.
12. **Hard-coded race "Human" string in stat formulas.** If the app generalizes "the race that gets free distributed mods", the literal `"Human"` check in `E13:E20` needs to become a flag on the race row (e.g. `races.is_distributable = true`).
