# Playing Dashboard

## Purpose & state

This is a **live read-only "play view"** of the character sheet. Almost nothing here is authored on this tab — it is a printable/reference summary that pulls every visible value from the underlying tabs (`1. Stats & Traits`, `2.1 Categories`, `2.2 General Skills`, `Combat Dashboard`). The intent is "everything a player needs while *playing* a session in one screen": stat snapshot, life points + activity penalty bands, fate points, initiative/perception readouts, chaos panel (placeholder), and the full skill grid (categories + their child general skills, then crafts/lores).

It is **not** the source of truth for any of those values. Of the 344 cells, the only player-/DM-authored cells on this tab are:

- `K1` — current **character level** (the canonical "what level is this character?" number; `Level Progression!I1` reads it back).
- `K2` — "DPs Assign per Session" override; consumed by `Level Progression!G9 = -'Playing Dashboard'!K2`. K2 is currently blank (defaults to 0).
- `F3`, `H3`, `J3`, `J5`, `H8` and the "TODO" at `I10` — manually-entered combat/play values (fate points, initiative, chaos index, chaos track, combat-perception, plus a stub for the chaos-power calculator).

Everything else is `'OtherTab'!Cell`-style passthrough or a small derived formula.

This tab **partially overlaps with `Combat Dashboard`**: the entire stat-snapshot block (`A4:A7`) and the *Total Life Pool* / *Actual Life Points* / *Activity Mod* / *Permanent Mod* / *Act Mod Ref.* / *Death at -X* sub-block (`B4:D9`) is byte-for-byte the same as `Combat Dashboard!A4:D9`. Rows 4/5/7/9 in column B explicitly cite `Combat Dashboard!B4` (HP pool — itself `'2.1 Categories'!L2`), `Combat Dashboard!B5` (current HP), `Combat Dashboard!B7` (activity mod, computed) and `Combat Dashboard!B9` (permanent mod, blank). Combat Dashboard is therefore the actual computational owner of the life-points sub-block; Playing Dashboard re-displays it.

The tab does **not** compute MP/Zeon, Magic Accumulation, Magic Projection, fatigue, Movement Value, Ki / MK / Nemesis, current XP, current/spent DP totals (those live in `Level Progression`), encumbrance / equipment-load summary, mount/companion, or status effects. The only "magic-adjacent" panel is the Chaos block (`I3:J9`), which is a 4-cell typed display (chaos index, chaos track, chaos dice, chaos power calculator) with the latter two being stub/`TODO`. No formulas drive it — it is plain-typed.

## Inputs

The tab has very few editable cells. Everything in the giant skill block (rows 13–56) is read-only passthrough from other tabs — players should not type into those cells.

### Top header

| Cell | Meaning | DB target (or "gap") |
|------|---------|----------------------|
| `K1` | **Character level** (canonical; consumed by `Level Progression!I1`) | `characters.level` |
| `K2` | "DPs Assign per Session" override (per-session DP grant manually entered; consumed negated by `Level Progression!G9`) | gap — closest is `character_dp_sessions` (a log of per-session awards), but K2 here is a single scalar override, not a log |

### Combat / Play scalars (rows 3–9)

| Cell | Meaning | DB target |
|------|---------|-----------|
| `F3` | Fate Points (current count) | `character_description.fate_points` |
| `H3` | Initiative (typed; appears to ignore stat-derived initiative) | gap — no `character_initiative` column; could be derived from QU + AG + weapon/armor mods or stored on `character_description` |
| `H8` | Combat Perception (typed override; not a formula) | gap |
| `J3` | Chaos Index | `character_chaos.chaos_index` |
| `J5` | Chaos Track | `character_chaos.chaos_track` |
| `J7` (header `I7='CHAOS DICE'`) | Chaos Dice — **value cell empty** | `character_chaos.chaos_dice` |
| `I10` | "TODO" placeholder for the Chaos Power Calculator (header `I9`) | `character_chaos.chaos_power_calculator` |

There are **no other player-authored cells** on this tab. The `B4`/`B5`/`B7`/`B9` life-points cells *look* editable but are formulas (`B4 = '2.1 Categories'!L2`, `B5 = 'Combat Dashboard'!B5`, etc.) — to change them, edit Combat Dashboard.

### Skill blocks (rows 11–56) — all read-only passthrough

The whole "CATEGORIES & SKILLS (NO CRAFTS NOR LORES)" block (rows 11–38) and "CRAFTS & LORES" block (rows 40–56) is layout-only — each cell is a `='2.1 Categories'!Lnn` (category total) or `='2.2 General Skills'!Mnn` (per-skill total) reference. No DP allocation happens here.

## Formulas

### Block 1 — Identity & header (rows 1–2)

| Cell | Formula | Computes |
|------|---------|----------|
| `A1` | `='1. Stats & Traits'!B2` | Character name passthrough |
| `J1` | (label) | Static `'Level  '` |
| `K1` | (typed) | Manual current level (`1`); the canonical level cell for the workbook |
| `L2` | (label) | Static `'DPs Assign per Session'` next to typed `K2` |

### Block 2 — Stats snapshot (rows 4–7, col A)

Compact two-stats-per-row display, one stat pair per row (st/co, ag/qu, sd/re, in/pr).

| Cell | Formula | Computes |
|------|---------|----------|
| `A4` | `=concatenate('1. Stats & Traits'!B13,": ",text('1. Stats & Traits'!G13,"00"),"  \|  ",'1. Stats & Traits'!B14,": ",text('1. Stats & Traits'!G14,"00"))` | `"st: 05  \|  co: 07"` — code + zero-padded total bonus |
| `A5` | same pattern, rows 15/16 | `"ag: 07  \|  qu: 06"` |
| `A6` | same pattern, rows 17/18 | `"sd: 07  \|  re: 04"` |
| `A7` | same pattern, rows 19/20 | `"in: 12  \|  pr: 01"` |

These are duplicated verbatim in `Combat Dashboard!A4:A7`.

### Block 3 — Life Points & activity bands (B/C/D rows 4–9)

| Cell | Formula | Computes |
|------|---------|----------|
| `B4` | `='2.1 Categories'!L2` | Total Life Pool (the L2 cell on `2.1 Categories` — the trait "Endurance" produces an HP pool there). Currently `74`. |
| `B5` | `='Combat Dashboard'!B5` | Actual (current) Life Points. On Combat Dashboard, `B5 = B4` initially — this is where HP loss is tracked. |
| `B7` | `='Combat Dashboard'!B7` | Activity Mod (computed on Combat Dashboard as a piecewise function of B5 vs B4 thresholds: `=if(B5>rounddown(B4*25%,0), if(B5>rounddown(B4*50%,0), if(B5>rounddown(B4*75%,0), 0, -10), -20), -30) + B9`). |
| `B9` | `='Combat Dashboard'!B9` | Permanent Mod (typed, blank in source) |
| `D5` | `=CONCATENATE(rounddown($B$4*75%,0)," [-10 act]")` | Threshold display: HP at which `-10` activity penalty kicks in. Currently `"55 [-10 act]"`. |
| `D6` | `=CONCATENATE(rounddown($B$4*50%,0)," [-20 act]")` | `"-20 act"` threshold. Currently `"37 [-20 act]"`. |
| `D7` | `=CONCATENATE(rounddown($B$4*25%,0)," [-30 act]")` | `"-30 act"` threshold. Currently `"18 [-30 act]"`. |
| `D8` | `=CONCATENATE("Death at -",'1. Stats & Traits'!C14)` | Death threshold = negative of `co` percentile (col C row 14 is the Constitution percentile). Currently `"Death at -64"`. |
| `C4` | (label) | "Total Life Pool" |
| `C5` | (label) | "Actual Life Points" |
| `C7` | (label) | "Activity Mod" |
| `C9` | (label) | "Permanent Mod" |
| `D4` | (label) | "Act Mod Ref." |

The activity-mod thresholds (`75% / 50% / 25%` of max HP → `-10 / -20 / -30` penalty) are **hard-coded in the formulas** of `Combat Dashboard!B7` and `Playing Dashboard!D5/D6/D7`. They are *not* sourced from the DB's `life_activity_modifier_rules` table.

### Block 4 — Fate / Initiative / Perception / Chaos (rows 3–9, cols E–J)

| Cell | Formula | Computes |
|------|---------|----------|
| `F3` | (typed `5.0`) | Fate Points |
| `F6` | `='2.1 Categories'!L4` | "General Knowledge" trait total |
| `F7` | `='2.1 Categories'!L5` | "RR Will" trait total |
| `F8` | `='2.1 Categories'!L6` | "RR stam" trait total |
| `F9` | `='2.1 Categories'!L7` | "RR Magic" trait total |
| `H3` | (typed `18`) | Initiative |
| `H4` | `=H3-5` | Initiative w/ Shield (flat `-5`) |
| `H6` | `=H17` | Perception Pasive — pulls from `'2.2 General Skills'!M18` (via the in-tab passthrough at `H17`). Result: `25`. |
| `H7` | `=H16` | Perception Active — pulls from `'2.2 General Skills'!M17` (via `H16`). Result: `19`. |
| `H8` | (typed `-25`) | Combat Perception (manual) |
| `H9` | `=concatenate(H7-30," (1 turn)")` | Quick Perception: active perception with a `-30` modifier, formatted as `"-11 (1 turn)"`. The `-30` is the Anima "quick / 1-turn perception" penalty, hardcoded. |
| `J3` | (typed `7.0`) | Chaos Index |
| `J5` | (typed `31.0`) | Chaos Track |
| `I10` | (typed `'TODO'`) | Chaos Power Calculator — explicitly stubbed |

Note the **self-references** at `H6 = H17` and `H7 = H16`. `H16` and `H17` belong to the General Skills passthrough block below (Awareness skills "Perception Active" and "Perception Passive" respectively). So Perception Pasive/Active values shown in the top block are literally re-displayed from the skill grid's row 16/17 of the Awareness category. (The labels read `"Perception Pasive"` *(sic)* in `G6` and `"Perception Active"` in `G7`.)

### Block 5 — Categories & Skills passthrough (rows 11–38)

Header row 11 (merged `A11:I11`): `'CATEGORIES & SKILLS (NO CRAFTS NOR LORES)'`.

The block lays out 5 category headers per row (cols A, C, E, G, I) followed by the constituent general skills below each. Every cell is a passthrough.

**Pattern A (category header rows 13, 20, 27):** category name in col `A/C/E/G/I` (typed label) paired with a numeric formula in col `B/D/F/H/J`:

| Canonical cell | Formula | Computes | Range covered |
|----------------|---------|----------|---------------|
| `B13` | `='2.1 Categories'!L8` | Animals category total | also `D13`→L9 (Athletic Nimble), `F13`→L10 (Athletic Stamina), `H13`→L11 (Awareness), `J13`→L12 (Combat Styles); row 20 → L13/L14/L21/L22/L23 (Communication reactive, Communication structured, Medicine, Outdoors Technical, Outdoors Natural); row 27 → L24/L25/L29/L30/L31 (Performing, Power Sensibility, Subterfuge Active, Subterfuge Passive, Technical/Trained); row 33 col F→L32 (Urban), col H→L33 (Warfare). |

**Pattern B (general-skill rows 14–18, 21–25, 28–38):** skill name in col `A/C/E/G/I`, value in `B/D/F/H/J`:

| Canonical cell | Formula | Computes | Range covered |
|----------------|---------|----------|---------------|
| `B14` | `='2.2 General Skills'!M2` | Animal Handling skill total | rows 14–18 cols B/D/F/H/J pull `M2:M23` (Animals, Athletic Nimble, Athletic Stamina, Awareness, Combat Styles skill children); rows 21–25 pull `M24:M31` and `M63:M75` (Communication + Medicine + Outdoors); rows 28–38 pull `M76:M93` and `M96:M130` (Performing, Power Sensibility, Subterfuge, Technical/Trained, Urban, Warfare children). Each cell is `='2.2 General Skills'!M<n>`. |

**Note:** rows 33–34 cols J have `J33 = '2.2 General Skills'!M120` and `J34 = '2.2 General Skills'!M121`, both currently `None` (the Technical/Trained category has variable-length child lists; these rows are extra slots).

### Block 6 — Crafts & Lores passthrough (rows 40–56)

Header row 40 (merged `A40:I40`): `'CRAFTS & LORES'`.

Same pattern as Block 5.

| Canonical cell | Formula | Computes | Range covered |
|----------------|---------|----------|---------------|
| `B42` | `='2.1 Categories'!L15` | Crafts Fine category total | row 42 cols B/D/F/H/J → L15/L16/L17/L18/L19 (Crafts Fine, Crafts Gross, Crafting Lores, Engineering, Flora & Fauna); row 51 → L20/L26/L27/L28 (Magic Lore, Science Analytic, Socio Economics, Social Sciences). |
| `B43` | `='2.2 General Skills'!M32` | Carving skill total | rows 43–49 cols B/D/F/H/J → M32:M58 (craft skills); rows 52–56 cols B/D/F/H/J → M59:M104 (lore skills). |

`F55`, `F56`, `J33`, `J34` resolve to `None` (empty source rows on `2.2 General Skills`).

The labels reproduce sheet typos verbatim — `"Ourtdoors Technical"` (G20), `"Engenieering"` (G42), `"Apraisal"` (G14), `"Pasive"` (G6) — so any DB seeding that pulls from this sheet should normalize them.

## Cross-tab refs

Every cell with a formula is dumped here, grouped by source tab.

### `'1. Stats & Traits'`

The stat-snapshot rows 4–7 reference 16 cells (`B13:B20` for codes, `G13:G20` for totals):

| From | Source cells | Purpose |
|------|--------------|---------|
| `A1` | `B2` | character name |
| `A4` | `B13`, `G13`, `B14`, `G14` | st + co snapshot |
| `A5` | `B15`, `G15`, `B16`, `G16` | ag + qu snapshot |
| `A6` | `B17`, `G17`, `B18`, `G18` | sd + re snapshot |
| `A7` | `B19`, `G19`, `B20`, `G20` | in + pr snapshot |
| `D8` | `C14` | Constitution percentile (drives "Death at -X") |

### `'2.1 Categories'`

41 references to col L (the "Total" column of `2.1 Categories`):

| From cell | Source | Purpose |
|-----------|--------|---------|
| `B4` | `L2` | Total Life Pool (Endurance trait → HP pool) |
| `F6` | `L4` | General Knowledge trait |
| `F7` | `L5` | RR Will |
| `F8` | `L6` | RR stam |
| `F9` | `L7` | RR Magic |
| `B13` | `L8` | Animals category |
| `D13` | `L9` | Athletic Nimble |
| `F13` | `L10` | Athletic Stamina |
| `H13` | `L11` | Awareness |
| `J13` | `L12` | Combat Styles |
| `B20` | `L13` | Communication reactive |
| `D20` | `L14` | Communication structured |
| `B42` | `L15` | Crafts Fine |
| `D42` | `L16` | Crafts Gross |
| `F42` | `L17` | Crafting Lores |
| `H42` | `L18` | Engineering |
| `J42` | `L19` | Flora & Fauna |
| `B51` | `L20` | Magic Lore |
| `F20` | `L21` | Medicine |
| `H20` | `L22` | Outdoors Technical |
| `J20` | `L23` | Outdoors Natural |
| `B27` | `L24` | Performing |
| `D27` | `L25` | Power Sensibility |
| `D51` | `L26` | Science Analytic |
| `F51` | `L27` | Socio Economics |
| `H51` | `L28` | Social Sciences |
| `F27` | `L29` | Subterfuge Active |
| `H27` | `L30` | Subterfuge Passive |
| `J27` | `L31` | Technical/Trained |
| `F33` | `L32` | Urban |
| `H33` | `L33` | Warfare |

Range: `'2.1 Categories'!L2`, `L4:L33` (skipping L3, which is presumably the Power Points trait — not displayed here).

### `'2.2 General Skills'`

~120 references to col M (the "Total" column of `2.2 General Skills`):

| From cell range | Source range | Purpose |
|-----------------|--------------|---------|
| `B14:J18` | `M2:M23` | Animals / Athletic Nimble / Athletic Stamina / Awareness / Combat Styles skill totals |
| `B21:J25` | `M24:M31` + `M63:M75` | Communication reactive / Communication structured / Medicine / Outdoors Technical / Outdoors Natural skill totals |
| `B28:J38` | `M76:M104` (with M105/M106 skipped) + `M107:M130` | Performing / Power Sensibility / Subterfuge Active / Subterfuge Passive / Technical/Trained / Urban / Warfare skill totals |
| `B43:J49` | `M32:M58` | Craft skill totals (Crafts Fine / Gross, Crafting Lores, Engineering, Flora & Fauna children) |
| `B52:J56` | `M59:M62` + `M89:M93` + `M96:M104` | Lore skill totals (Magic Lore, Science Analytic, Socio Economics, Social Sciences children) |

The mapping is one-to-one: each `M<n>` is referenced exactly once.

### `'Combat Dashboard'`

Three references — all in the life-points sub-block:

| From cell | Source | Purpose |
|-----------|--------|---------|
| `B5` | `'Combat Dashboard'!B5` | Actual (current) Life Points (this is the "live HP" tracker) |
| `B7` | `'Combat Dashboard'!B7` | Activity Mod (piecewise of HP%) |
| `B9` | `'Combat Dashboard'!B9` | Permanent Mod (typed) |

Combat Dashboard's `B7` formula `=if(B5>rounddown(B4*25%,0),if(B5>rounddown(B4*50%,0),if(B5>rounddown(B4*75%,0),0,-10),-20),-30)+B9` is what actually computes the current activity penalty; Playing Dashboard merely displays it.

### Inbound (other tabs reading Playing Dashboard)

Per the `Level Progression` analysis, two cells on this tab are read by other tabs:

- `Playing Dashboard!K1` → consumed at `Level Progression!I1/J1` (it is **the canonical "current level"** for the workbook).
- `Playing Dashboard!K2` → consumed (negated) at `Level Progression!G9` as the "DPs Assign" deduction. This is the only writeable spend-side hook this tab exposes back to the DP budget.

No other inbound references are visible from this JSON, but the tab's design intent suggests print/play views might have additional inbound links.

## DB mapping

Block-by-block.

### Identity / level header (`A1`, `K1`, `K2`)

- `A1` (name): `characters.name` — already present.
- `K1` (level): `characters.level` — already present.
- `K2` (DPs Assign per Session): **gap (semantic)**. There is a `character_dp_sessions` table (per the schema shape doc) which logs DP awards over time; K2 here is a single "this session's bonus" scalar, not a log. Two reasonable mappings:
  1. Treat K2 as the DP delta of the most recent open session row — then sum sessions to get the running adjustment.
  2. Add a `characters.session_dp_override` column (not recommended; redundant with the log).

  **Gap flag:** Phase 5 should decide whether `K2` survives as a UI input at all. The DP budget on `Level Progression` already consumes it (`-K2` reduces "available DPs"), so the value matters even if the log replaces it.

### Stat snapshot (`A4:A7`)

Pure display. No DB mapping — recompute from `character_stats` + `stat_progression` at render time.

### Life Points block (`B4:D9`)

| Cell | DB target |
|------|-----------|
| `B4` Total Life Pool | derive from `character_traits` (Endurance trait `total`) — currently the formula chain is `2.1 Categories!L2`, which itself sums Endurance ranks/race/stat for the HP pool |
| `B5` Actual Life Points | `character_life_points.current_life_points` |
| `B7` Activity Mod | derive at render: piecewise on `B5 / B4` ratio. **Gap flag (mild):** the DB has `life_activity_modifier_rules` (HP threshold → penalty) — the sheet's hardcoded `75/50/25 → -10/-20/-30` should be cross-checked against that table; if they match, just consume the table; if they differ, the table is the canonical source and the sheet is wrong. |
| `B9` Permanent Mod | `character_life_points.permanent_modifier` (or `character_life_points.dm_activity_modifier` per the existing column hint in `frontend-plan.md` §8.1) |
| `D5/D6/D7` | derived (display-only): `floor(maxHP * pct)` per band |
| `D8` Death at -CO | derived: negative of `co` percentile from `character_stats` |

**Gap flag — fatigue:** The "Playing Dashboard" name hints at fatigue tracking but **no fatigue cells exist on this tab**. The Anima fatigue mechanic (`character_life_points.current_fatigue` if it exists, or a separate column) is unrepresented here. Phase 5 should add a fatigue stepper as a sibling of the Life Points block — that data does not appear anywhere in the workbook.

### Combat readouts (`F3`, `H3`, `H4`, `H8`, `H9`)

| Cell | DB target |
|------|-----------|
| `F3` Fate Points | `character_description.fate_points` |
| `H3` Initiative | **gap.** No `character_initiative` column in the schema shape. Anima initiative = `qu_bonus + ag_bonus + base 50 + weapon_modifier + size_modifier + talents`. Either compute on render or add a stored-value column on `character_description` for DM overrides. |
| `H4` Initiative w/Shield | derived (`H3 - 5`); **gap** if the `-5` shield modifier should come from the equipped shield instead of being a flat constant. |
| `H8` Combat Perception | **gap.** Typed-only. No DB column. Likely meant to mirror an Awareness-category value; left manual. |
| `H9` Quick Perception | derived `H7 - 30` (display-only) |

### Perception (`F6:F9`, `H6`, `H7`)

These are passthroughs of trait totals (`General Knowledge`, `RR Will`, `RR stam`, `RR Magic`) and Awareness skill totals (`Perception Active`, `Perception Passive`). They map to `character_traits.total` and `character_skills.total` respectively — already in scope of Phase 1–3.

### Chaos block (`I3:J9`, `I10`)

| Cell | DB target |
|------|-----------|
| `J3` Chaos Index | `character_chaos.chaos_index` |
| `J5` Chaos Track | `character_chaos.chaos_track` |
| `(blank)` Chaos Dice | `character_chaos.chaos_dice` |
| `I10` "TODO" | `character_chaos.chaos_power_calculator` — explicitly unfinished in the sheet |

The schema shape doc confirms `character_chaos` exists with exactly those columns. Clean 1:1 mapping.

### Skill grid (rows 11–56)

The whole block is read-only mirroring of:
- `2.1 Categories`'s "Total" column → `character_categories.total` (already in Phase 2).
- `2.2 General Skills`'s "Total" column → `character_skills.total` (already in Phase 2).

**No DB gap.** Phase 5 should not persist anything from these rows; they are layout-only.

### Headers & labels

The category and skill labels (typed in cols A/C/E/G/I) are not stored anywhere here — they are flat strings duplicated from `categories.name` / `skills.name`. The duplication is fragile (typos: "Ourtdoors Technical", "Engenieering", "Apraisal", "Pasive") but not a DB concern; the Next.js port should pull names from the catalog tables, not from this layout.

## Recommendations

### What to ship in Phase 5

A single-page **Play view** at `/characters/[id]/play` with these widgets:

1. **Identity strip (top)**: name + level (K1) + fate points (F3). Editable inline.
2. **Stat snapshot**: 8-stat compact grid (the `st: 05  |  co: 07` format). Read-only — pulls from `character_stats` + `stat_progression`.
3. **Life Points panel** (the load-bearing one):
   - Max HP (read-only from Endurance trait)
   - Current HP stepper (writes `character_life_points.current_life_points`)
   - Activity penalty *band* readout (-10 / -20 / -30) computed live from current/max HP %
   - Permanent modifier input (DM-controlled)
   - Death threshold (`-CO%`) display
   - **Add a Fatigue tracker here** — the sheet doesn't have it but the system needs one (Anima rules). Treat as a Phase 5 net-new input.
4. **Combat readouts**: initiative (typed override + a "compute from stats" button), shield-init (derived), combat perception (typed), quick perception (derived). All four are play-time scratchpads; a `play_state` JSON column on `character_description`, or four discrete columns, would back them.
5. **Trait + perception strip**: General Knowledge / RR Will / RR stam / RR Magic / Perception Active / Perception Passive — all read-only passthroughs.
6. **Chaos panel**: chaos_index / chaos_track / chaos_dice / chaos_power_calculator — directly bound to `character_chaos`. The "TODO" power-calculator stub (`I10`) should be deferred unless the team has the formula.

### What to defer / drop

- **The skill grid (rows 11–56) is layout duplication.** Don't render it on the play page — it duplicates `/categories` + `/skills`. Or, if the play page is meant to be a self-contained printable, render a *collapsed* version (categories with their skill counts, expandable) rather than re-implementing the 5×N matrix.
- **The "DPs Assign per Session" cell (`K2`)** is a single scalar that subtracts from the DP budget. In v1 the `Level Progression` widget already exposes a manual DP-pending number. K2 may not need a dedicated UI control — folding it into the existing DP-budget delta on the Progression page is cleaner. Confirm with the team whether this is a real per-session mechanic worth surfacing.

### Dedupe with Combat Dashboard

The entire stat-snapshot + life-points sub-block is duplicated between Playing Dashboard and Combat Dashboard. **In the Next.js port, build the LifePointsPanel and StatSnapshot as shared components used on both `/play` and `/combat` pages.** Single source of truth in `lib/domain/life-points.ts` (or similar): activity-mod thresholds, death threshold, current HP stepping. Do not re-implement.

### Treat hardcoded thresholds carefully

The activity-mod thresholds (`75% / 50% / 25% → -10 / -20 / -30`), the shield-init constant (`-5`), the quick-perception penalty (`-30`), and the death threshold (`-CO%`) are all **hardcoded in formulas** on this tab and on `Combat Dashboard`. The DB has `life_activity_modifier_rules` which presumably stores the activity bands. **Audit this table before Phase 5** — if the rule rows match `(75%, -10), (50%, -20), (25%, -30)`, drive the panel from the table; otherwise, document the discrepancy and pick a side.

### Runtime vs persisted

Persist only:
- `K1` → `characters.level`
- `F3` → `character_description.fate_points`
- `H3` (initiative override) → `character_description.initiative_override` (new column) **or** derive from stats
- `H8` (combat perception override) → `character_description.combat_perception_override` (new column) **or** derive
- `B5` → `character_life_points.current_life_points`
- `B9` → `character_life_points.permanent_modifier`
- `J3 / J5 / chaos_dice / chaos_power_calculator` → `character_chaos.*`
- `K2` → reuse `character_dp_sessions` instead of adding a column

Compute on render:
- All stat-snapshot strings (`A4:A7`)
- All trait/perception readouts (`F6:F9`, `H6`, `H7`)
- Activity-mod and band labels (`B7`, `D5:D8`)
- Initiative w/ shield (`H4`), Quick perception (`H9`)
- Every cell in rows 11–56 (skill grid passthrough)

### Gap flags summary

| # | Gap | Severity |
|---|-----|----------|
| 1 | Fatigue tracker absent from sheet — must be net-new in UI | medium |
| 2 | Initiative has no DB home — column or derivation TBD | medium |
| 3 | Combat Perception (`H8`) has no DB home; currently typed-only | low |
| 4 | "DPs Assign per Session" (`K2`) overlaps with `character_dp_sessions`; resolve which is canonical | low |
| 5 | Activity-mod thresholds hardcoded in two tabs vs `life_activity_modifier_rules` in DB — audit before porting | medium |
| 6 | Chaos Power Calculator (`I10`) is a `'TODO'` — schema column exists but formula not yet defined anywhere in the workbook | medium |
| 7 | No MP/Zeon/MA/MK/Movement Value/encumbrance/equipment-load summary panels — neither this tab nor (per the `2.4 Magic` analysis) any other tab carries them. Phase 5 cannot port what doesn't exist. | high (out of scope for porting; in scope if the campaign needs them) |
