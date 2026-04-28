# TALENTS|FLAWS LIST

## Purpose & relationship to DB

This tab is the **master catalog of every Talent and Flaw** available to a character at creation in the Zskahra port of *Anima: Beyond Fantasy*. It is a flat reference table — no formulas, no per-character state, just one row per catalog entry. It is the human-readable / GM-facing source of truth that the rest of the workbook (mainly `2.5_Talents_Flaws` on the character sheet, plus `Talents_tables`) draws from by name.

Sheet metadata:

- name: `TALENTS|FLAWS LIST`
- max_row: 1008 (only 273 rows actually populated)
- max_col: 26 (only cols 1–5 / A–E carry data; col 6 has a single stray space)
- 1265 non-empty cells, **0 formulas**
- 4 merged ranges: `A1:G1` (title), `A3:E3` (MAIN TALENTS header), `A62:E62` (SECONDARY TALENTS header), `A172:E172` (FLAWS header)

Catalog totals (col B, excluding header rows):

| Type        | Count in sheet |
|-------------|----------------|
| Main        | 57             |
| Secondary   | 107            |
| Flaws       | 85             |
| Flaw        | 17             |
| **Total**   | **266 rows**   |

Note: rows 135–152 and rows 153–170 hold the **same 18 Zskahra-specific Secondary talents twice** (Village Bond, Suffix Recognition, Creature Lore, Quiet Movement (Exterior), Artifact Intuition, Pylon Sense, Scar Reading, Controlled Descent, Waste Nothing, Fast Threshold Recovery, Lake Sense, Net Mastery, Jungle Voice, Dead Sound, Scavenger's Eye, Chaos Weather Sense, Rope Craft (Selva), Gut Instinct). Distinct entries are therefore ~248.

Compared to the Supabase DB (`talents` = 326 rows, `talent_requirements` = 201, plus 6 typed bonus tables), **the DB is RICHER than the sheet, not a 1:1 mirror.** The sheet has narrative descriptions only; the DB has parsed structured prerequisites and typed bonuses. The DB likely also includes additional book / supplement talents not transcribed to the sheet (≈60–80 extra entries).

## Column structure

| Col | Header | Meaning                                                                                          |
|-----|--------|--------------------------------------------------------------------------------------------------|
| A   | Name   | Display name. Variant suffixes in parentheses encode magnitude: `(Lesser) / (Minor) / (Mayor) / (Greater)`. Spelling note: the sheet uses "Mayor" (Spanish) instead of "Major". |
| B   | Type   | One of: `Main`, `Secondary`, `Flaws`, `Flaw`. `Main` and `Secondary` are positive-cost talents (book canon). `Flaws` is the legacy Anima book term; `Flaw` (singular) is used only on the new Zskahra-specific flaws appended after row 258. |
| C   | Cost   | DP cost. Positive integer for talents (5–70). Negative for flaws (−3 to −30). One entry has a string: `"15(20*)"` (Bane — `*` footnote denotes increased cost when taken outside level 1). |
| D   | Req    | Prerequisites as free-form prose (see below). May be `-`, `—`, blank, or a comma-separated list. |
| E   | Desc   | Effect / mechanical description as free-form prose. Mixes English (legacy book talents) and Spanish (Zskahra-specific entries from row 44+ and 135+). |

Section markers live in column A as merged title cells: `MAIN TALENTS` (A3), `SECONDARY TALENTS` (A62), `FLAWS` (A172). Each section is followed by its own header row (Name / Type / Cost / Req / Desc).

## Talent vs Flaw distinction

Three orthogonal cues:

1. **Section headers** (rows 3, 62, 172) split the sheet into MAIN / SECONDARY / FLAWS blocks.
2. **Type column (B)** restates this per row: `Main`, `Secondary`, `Flaws`, `Flaw`.
3. **Cost sign (C)** — talents are positive, flaws are negative. This is also how the points-budget logic on the character-sheet tab adds them up.

The sheet does not split Main vs Secondary in the DB schema (DB only has a single `talent_type` text). The split exists in this catalog because in *Anima* Main talents have higher costs and tighter slot rules; some character-creation rules (e.g. only 1 Main talent per level) depend on the distinction. The DB will need to preserve `Main` / `Secondary` / `Flaw` in `talent_type` to drive that rule.

## Effect encoding

All effects live in column E as **free-form prose**. There is no machine-readable bonus structure in this sheet — every interpretation has to be done by parsing the text. Three encoding patterns are observable:

- **Static, parseable bonuses** — written as `+N <skill or category>` or `±N to <stat>`:
  - `"+10 Performance category"` (Artistic)
  - `"+20 to Swimming Skill"` (Diver)
  - `"+5' (1.5 m.) to BMR"` (Blazing Speed)
  - `"-30 Perception modifier during Combat"` (Combat Awareness)
  - `"+20 to all Climbing maneuvers"` (Climber)
  These map cleanly to `talent_skill_bonuses`, `talent_category_bonuses`, or `talent_game_value_bonuses`.

- **Choice-driven (player picks target)** — encoded by parenthetical hint `"(Spec Column)"` referring to a "specialization column" on the character sheet tab where the player records the chosen target:
  - `"+1 bonus to any stat. (Spec Column)"` (Stat Bonus Lesser)
  - `"+3 bonus to any stat.(Spec Column)"` (Stat Bonus Minor)
  - `"+5 bonus to any stat.(Spec Column)"` (Stat Bonus Mayor)
  - `"+8 bonus to any stat.(Spec Column)"` (Stat Bonus Greater)
  - `"In one weapon group (ex. Short blades) you give one weapon a special +10 bonus, but a -15 to all the other weapons in that category."` (Preferred Weapon)
  - `"+20 a identificar y predecir el comportamiento de una categoría de criaturas del Caos (elegida al tomar el talento)"` (Creature Lore)

- **Conditional / situational** — bonuses gated by context, frequency, or roll outcome:
  - `"Once per day +10 to OB & DB after shouting Battle Cry for 1 combat. Must spent 2 turns to perform."` (Battle Cry)
  - `"Successful roll can grant allies a +10 to OB & DD until they get hit"` (Commanding Demeanor)
  - `"+15 a Outdoors Natural y Survival. Ignora el primer penalizador de movimiento en selva agreste."` (Frontier Born)
  - `"Cuando cruza un umbral de Caos, puede hacer una tirada de RR Will... el efecto de cruce se tira dos veces y el jugador elige cuál aplicar."` (Controlled Descent)
  - Track-shifting talents whose effect is a numeric offset to a derived game value: `"El umbral de Caos en cada nivel se desplaza +100 puntos"` (Iron Threshold), `"+100 puntos"` Low Threshold inverse.

Penalty/flaw effects use the same prose patterns with negative numbers (`"-30 penalty to your battle perception"`, `"-50 penalty"` etc.).

## Requirements encoding

Column D is also free-form prose. Five structural patterns appear:

1. **Single stat threshold** — `"<Stat> <number>"`, e.g. `"Constitution 80"`, `"Quickness 80"`, `"Presence 90"`, `"Intuition 70"`, `"Strenght 80"` (sic, English misspelled in source).
2. **Multiple stat thresholds** — comma-separated AND list, e.g. `"Agility 60, Strenght 60"`, `"Constitution 80, Endurance 20R"`, `"Intuition 80, Treat wounds 20R, Treat Ailment 20R, Diagnose 10R"`.
3. **Skill rank thresholds** — number followed by `R` denotes ranks (e.g. `"Endurance 20R"`, `"Attunement 15R"`, `"Perception 15R"`, `"Outdoors Natural 10R"`).
4. **Stat range gates** — only used by Potential Stat: `"Stat 0-61"`, `"Stat 62-81"`, `"Stat 82-91"`, `"Stat 92 & up"`.
5. **Narrative gates** — `"History Background"`, `"GM Ok + History Background"`, `"History Background (villa específica)"`, `"Raza Antigua únicamente"`, `"Villas del lago únicamente"`, `"Zhar solamente"`, `"Aldeanos unicamente"`, `"Caos acumulado 0 (marca desde creación)"`. These map to `requires_dm_approval` or to opaque `talent_requirements` rows.

Empty / "no requirement" sentinels: `"-"`, `"—"`, or null. Mixed languages: legacy entries are English (`"Constitution 80"`), Zskahra-specific entries are Spanish (`"Raza Antigua únicamente, Self Discipline 80"`). Stat names spelled inconsistently — `"Strenght"` vs `"Strength"`, `"Mayor"` vs `"Major"`.

## Sample rows

### Talents (verbatim)

**A5 Accelerated Healing** — Type=`Main`, Cost=`5.0`, Req=`Constitution 80`, Desc=`½ Natural Recovery Healing Time (except Magic Recovery)`.

**A37 Stat Bonus (Mayor)** — Type=`Main`, Cost=`40.0`, Req=`History Background`, Desc=`+5 bonus to any stat.(Spec Column)`.

**A50 Frontier Born** — Type=`Main`, Cost=`20.0`, Req=`History Background (villa de frontera o sin villa)`, Desc=`+15 a Outdoors Natural y Survival. Ignora el primer penalizador de movimiento en selva agreste. Solo disponible en creación de personaje.`.

### Flaws (verbatim)

**A175 Age** — Type=`Flaws`, Cost=`-10.0`, Req=*(empty)*, Desc=`You have reached at least middle age for your race. You must roll stat deterioration roll each year. You are older, probably wiser and a little slower.`.

**A239 Stat Penalty (Greater)** — Type=`Flaws`, Cost=`-30.0`, Req=*(empty)*, Desc=`-8 to a random stat.`.

**A259 Chaos Magnet** — Type=`Flaw`, Cost=`-20.0`, Req=`—`, Desc=`Genera 2 puntos adicionales de Caos por cada dado base que tire al usar artefactos, independientemente del resultado. No afecta dados de tentación ni Chaos Dice.`.

## Cross-tab refs

**None — the sheet contains zero formulas.** Cross-tab data flow is one-directional and string-keyed: the `2.5_Talents_Flaws` block on the character sheet (and the helper `Talents_tables` tab) reads names and costs from this catalog by `VLOOKUP`/`MATCH` against column A. This means:

- The catalog is the upstream source of truth.
- Any rename or typo here propagates to character sheets via failed lookups.
- Effect application (the actual bonus numbers in derived rolls) must be hand-entered on the character sheet because nothing here is structured.

## DB mapping

| Sheet col | DB col / table                                                                  | Notes                                                                                                                                                                            |
|-----------|---------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| A Name    | `talents.name`                                                                  | Direct. Watch for spelling variants (Mayor/Major, Strenght/Strength).                                                                                                            |
| B Type    | `talents.talent_type`                                                           | Sheet uses 4 strings (`Main`, `Secondary`, `Flaws`, `Flaw`); DB likely normalises to 3 (`main` / `secondary` / `flaw`).                                                          |
| C Cost    | `talents.cost`                                                                  | `int` in DB. Sheet's `"15(20*)"` (Bane) does not fit `int` — needs special handling (probably stored as 15 with a footnote, or a `cost_alt` field).                              |
| D Req     | `talent_requirements` (+ poly target via `requirement_type_id` / `target_id`)   | Multi-row decomposition. Comma-separated stat lists become N rows. Narrative gates become `requires_dm_approval = true`. Stat-range gates (Potential Stat) need a range encoding. |
| E Desc    | `talents.description`                                                           | Verbatim copy. The 6 typed bonus tables (`talent_stat_bonuses`, `_category_bonuses`, `_skill_bonuses`, `_weapon_bonuses`, `_trait_bonuses`, `_game_value_bonuses`) must be **hand-extracted** from this prose because the sheet contains no structured bonus data. |
| —         | `talents.max_times_per_character`                                               | Sometimes encoded in Desc (`"Talent can be taken multiple times"`, `"up to 3 times"`, `"up to 2 times for Stats 96 and above"`). Most rows omit it (default = 1).                |
| —         | `talents.is_level_1_only`                                                       | Encoded in Desc (`"May only be taken on 1st level"`, `"Solo disponible en creación de personaje"`). Bane explicitly: `"May only be taken on 1st level unless GM/story grants"`.   |
| —         | `talents.requires_dm_approval`                                                  | Encoded in Req (`"GM Ok"`, `"History Background"`, `"Zhar solamente"`, `"Raza Antigua únicamente"`).                                                                              |

## Gaps / mismatches with DB

- **Sheet is poorer**: 266 rows (~248 unique) vs DB's 326. The DB has roughly **60–80 additional talents** not transcribed here — likely book talents pulled in from the canonical *Anima: Beyond Fantasy* core list. Confirm by diffing names.
- **Duplicate block**: rows 135–152 and 153–170 are an identical 18-row Zskahra-specific Secondary block. DB is correctly deduplicated; sheet has a copy-paste artifact that should not be re-imported.
- **Type-string normalisation**: the sheet has `Flaws` (mass) vs `Flaw` (singular) — only the new Zskahra entries use `Flaw`. DB will need to collapse to a single value.
- **No structured bonuses**: zero of the 6 typed bonus tables can be auto-populated from this sheet. All `talent_stat_bonuses` / `_skill_bonuses` / `_category_bonuses` / `_weapon_bonuses` / `_trait_bonuses` / `_game_value_bonuses` rows must come from manual parsing of column E or from a separate authoring workflow. The sheet treats effects as GM-readable text only.
- **No structured requirements**: the 201 `talent_requirements` rows in DB are denser than what could be derived from this sheet (266 rows × maybe 1.2 reqs avg ≈ 320 reqs, but most flaws have empty Req so realistic count is ~180–200). The DB count is consistent, but mapping needs the `requirement_type_id` polymorphism and `target_id` UUIDs that the sheet has no concept of.
- **Bane special cost** `"15(20*)"` does not fit `talents.cost int` — needs a footnote/alternate-cost mechanism the DB schema may not have.
- **Spec Column choice mechanism**: the parenthetical `"(Spec Column)"` hint on Stat Bonus, Preferred Weapon, Creature Lore, etc. has no DB-side encoding visible here. Either the schema supports per-character "talent specialisation" via `talent_stat_bonuses` rows scoped to a character, or this needs an additional join table for player-chosen target.
- **Mixed languages**: legacy talents are English; Zskahra-specific (rows 44–61, 135–170, 259–275) are Spanish. The DB will inherit this mix unless localised.
- **Inconsistent stat naming**: `Strenght` (typo) vs `Strength`, `Mayor` vs `Major`. Normalize on import.
- **Missing fields**: `max_times_per_character` and `is_level_1_only` are encoded only in prose — extracting them is a manual / regex pass against column E.
- **No talent UUIDs / IDs in the sheet**: name is the only join key. Renames between sheet and DB will desync silently.
