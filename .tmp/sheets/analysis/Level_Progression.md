# Level Progression

## Purpose

This tab serves two distinct functions in a single sheet:

1. **Left block (cols A–D, rows 1–86):** A static reference table mapping XP level → cumulative XP needed → DPs awarded that level → cumulative total DPs. Covers levels 1 through 85.
2. **Right block (cols F–K, rows 1–11):** A live "DP allocation dashboard" for the *current* character. It pulls totals from the other sheets (`2.1 Categories`, `2.2 General Skills`, `2.3 Weapon Dexterity`, `2.5 Talents&Flaws`, `Training Packages`, `Playing Dashboard`) and tallies how many DPs the character has spent across each spend category, surfacing pending/over-allocated DPs.

The reference table is the canonical source the Supabase `level_progression` table is meant to mirror, but the sheet also encodes XP thresholds and per-level DP grants — data not currently stored in the DB.

## Column structure

### Left block — static progression table (rows 2–86)

| Col | Header        | Meaning                                                         | DB target                                |
|-----|---------------|-----------------------------------------------------------------|------------------------------------------|
| A   | XP LEVEL      | Character level (1–85)                                          | `level_progression.level`                |
| B   | XP Needed     | Cumulative XP required to reach this level                      | (not stored — gap)                       |
| C   | DPS Per lvl   | Development Points granted at this level                        | (not stored — gap; derivable as diff)    |
| D   | TOTAL DPs     | Cumulative DPs available at this level (running sum of C)       | `level_progression.max_total_dp` (likely)|

The DB schema is `level → min_total_dp / max_total_dp / notes`. The sheet only stores a single cumulative value per level. The DB's "min/max" structure suggests the DB models XP *bands* (XP needed for level N → XP needed for level N+1 minus 1), while column D corresponds to the `max_total_dp` once that level is reached. There is no separate `min` column in the sheet.

### Right block — live DP-spend dashboard (rows 1–11, cols F/G plus I/J/K)

| Cell | Label                | Source formula                                                                 |
|------|----------------------|--------------------------------------------------------------------------------|
| F1   | DPS ALLOCATED        | header                                                                         |
| G1   | total spent          | `=SUM(G2:G11)`                                                                 |
| F2/G2| TRAITS               | `=SUM('2.1 Categories'!D2:D7)`                                                 |
| F3/G3| CATEGORIES           | `=SUM('2.1 Categories'!D8:D48)`                                                |
| F4/G4| GENERAL SKILLS       | `=SUM('2.2 General Skills'!E2:E132)`                                           |
| F5/G5| WEAPON SKILLS        | `=SUM('2.3 Weapon Dexterity'!E2:E25)`                                          |
| F6   | PROGRESION           | (label only, no value)                                                         |
| F7/G7| TALENTS              | `=SUM('2.5 Talents&Flaws'!B12:B16,'2.5 Talents&Flaws'!B20:B70)`                |
| F8/G8| FLAWS                | `=SUM('2.5 Talents&Flaws'!G3:G15)` (negative = DP refund)                      |
| F9/G9| DPs Assign           | `=-'Playing Dashboard'!K2`                                                     |
|F10/G10| FATE POINTS         | manual entry                                                                   |
|F11/G11| TRAINING PACKAGES   | `='Training Packages'!B1`                                                      |
| I1/J1| Level                | `='Playing Dashboard'!K1`                                                      |
| I2/J2| Total DPs            | hard-coded `163` (current character's DP cap, manual)                          |
| I3/J3| Pending DPs          | `=J2-G1`                                                                       |
| K3   | legend               | "(+por asignar | -sobreasignado)"                                              |
| I4/J4| PROGRESSION          | `23.0` (semantics unclear — possibly current-level DPs)                        |

## Sample rows

First 3 (verbatim):
- Row 2: A=1, B=0, C=140 (formula `=70*2+if('1. Stats & Traits'!A36="Profession Adaptability",15,0)`), D=140 (`=C2`)
- Row 3: A=2, B=350 (`=B2+350`), C=55, D=195 (`=C3+D2`)
- Row 4: A=3, B=750 (`=B3+350+50`), C=55, D=250 (`=C4+D3`)

Last 3:
- Row 84: A=83, B=295550, C=75, D=6173
- Row 85: A=84, B=303200, C=75, D=6248
- Row 86: A=85, B=310950, C=75, D=6323

## Curves identified

**XP curve (col B):** non-linear, grows by accumulating deltas.
- L1→L2: +350
- L2→L3: +400 (formula `=B3+350+50` = previous +350+50)
- L3→L4: +450 (`=(B4-B3)+B4+50` = previous Δ + 50)
- From L4 onward each step is `previous Δ + 50` (so +500, +550, …) until L21 where the bump increases to +100 per step. So levels 1–20 use a `+50` quadratic; levels 21–85 use a `+100` quadratic.
- Resulting cumulative XP at L85 = 310,950.

**DP per-level curve (col C):** piecewise constant with three plateaus.
- L1: 140 (the formula reveals this is `70 base × 2`, plus `+15` if the character has the "Profession Adaptability" advantage). So the *true* L1 grant is dynamic, not a fixed constant.
- L2–L5: 55
- L6–L10: 65
- L11–L25: 75
- L25 (anomaly): 88 (the only non-75 outlier in the high range — possibly a typo or a milestone bonus)
- L26–L85: 75

**Total DPs (col D):** running sum of C. At L85 = 6,323. Anchored to the dynamic L1 (140 default).

## DB mapping

DB: `level_progression(level, min_total_dp, max_total_dp, notes)` × 300 rows.

Sheet covers only 85 levels — the DB has 300 rows, so the DB extends the curve well beyond what the sheet authored manually (likely auto-extrapolated past L85 with the same +75/level rule). The sheet is the source of truth for L1–L85 and probably needs reconciliation:

**Gaps (data in sheet, not in DB):**
- **XP needed per level** (col B). The DB has no `xp_required` field. This is required to determine "what level is the character?" given XP — should be added (or kept client-side from the sheet's curve).
- **DPs per level** (col C). The DB stores the cumulative `max_total_dp`, not the per-level grant. Per-level can be derived by `max_total_dp[N] - max_total_dp[N-1]`, but the L1 value is *dynamic* (depends on the "Profession Adaptability" advantage, +15 DP). The DB needs either:
  - a `dp_per_level` column, *or*
  - a documented note that the L1 baseline is 140 and a separate adjustment for Profession Adaptability lives on the character record.
- The **L25 spike to 88 DPs** (vs the surrounding 75) — verify whether this is intentional or a sheet typo. If intentional, the DB row for L25 should reflect `max_total_dp = 1823` (which it must, if it was seeded from this sheet).

**Coverage match:**
- Col A → `level_progression.level`: clean match.
- Col D → `level_progression.max_total_dp`: clean match (verify L25 = 1823, L85 = 6323).
- `min_total_dp`: not represented in the sheet. Likely `max_total_dp[N-1] + 1` or `max_total_dp[N-1]` depending on convention.
- `notes`: not in sheet.

**Out of scope for `level_progression` table (right-block dashboard):**
- TRAITS / CATEGORIES / GENERAL SKILLS / WEAPON SKILLS / TALENTS / FLAWS / FATE POINTS / TRAINING PACKAGES totals are *runtime* aggregations of the character's allocations on other tabs — not progression data. They belong in derived/computed views in the Next.js UI, not in `level_progression`.

## Cross-tab usage hints

The right-block dashboard reveals which other tabs feed DP allocation totals (this is a useful map of the spend-side of the sheet):

| Spend bucket          | Source range                                                       |
|-----------------------|--------------------------------------------------------------------|
| Traits                | `'2.1 Categories'!D2:D7`                                           |
| Categories (classes)  | `'2.1 Categories'!D8:D48`                                          |
| General skills        | `'2.2 General Skills'!E2:E132`                                     |
| Weapon skills         | `'2.3 Weapon Dexterity'!E2:E25`                                    |
| Talents               | `'2.5 Talents&Flaws'!B12:B16` + `'2.5 Talents&Flaws'!B20:B70`      |
| Flaws (negative)      | `'2.5 Talents&Flaws'!G3:G15`                                       |
| DP-Assign override    | `'Playing Dashboard'!K2` (negated — adjustment from dashboard)     |
| Training packages     | `'Training Packages'!B1` (pre-computed total)                      |
| Current level         | `'Playing Dashboard'!K1`                                           |

Inbound references to *this* tab from elsewhere are not visible in this JSON, but other tabs likely look up:
- `Level Progression!A:D` (VLOOKUP-style: given level, return cumulative DPs / XP needed) — this is the canonical use case the DB's `level_progression` table is intended to replace.
- The L1 formula in C2 references `'1. Stats & Traits'!A36` to detect the "Profession Adaptability" advantage; this is the only *outbound* dependency from the static block.

The L1 dynamic calculation (`70*2 + if(Profession Adaptability, 15, 0)`) is significant for Next.js: starting DP must be computed at character-record level (based on advantages), not pulled blindly from `level_progression.max_total_dp` at L1. From L2 onward the DB row is authoritative.
