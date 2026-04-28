# Combat Dashboard

## Purpose & state

This is the **read-only "fight night" cockpit**: a one-page summary that every other tab feeds into. Almost nothing here is editable — the cells are either (a) cross-tab pulls from `1. Stats & Traits`, `2.1 Categories`, `2.2 General Skills`, `2.3 Weapon Dexterity`, `Equipment`, and `Playing Dashboard`, or (b) tiny in-tab derivations (Initiative w/Shield = `H3-5`, Activity-Mod thresholds = `B4 × {25,50,75}%`, Total DB = `SUM(F20:F26)`). The only **first-class inputs** living on this tab are: `H3` (Initiative base), `K1` (Level), `F3` (Fate Points), `F14` (DB base 12), `H18` (Hits used), the **EQUIPMENT | WEAPONS** notes block (rows 36–49), and the **BMR / armor / race** static lookup tables in rows 55–70.

The tab also embeds two **static rules tables** that have no DB equivalent yet:
- `A55:H70` — a 14-row "Height → BMR / Quickness → BMR Mod" lookup (the Anima Base Movement Rate ladder).
- `I55:J61` — a 6-row "Race → max BMR penalty from armor" lookup.

State: **mostly live and accurate** (cells with `#N/A` resolve once `Playing Dashboard` H/J columns are populated), but several blocks are **half-stub**: the OB list (rows 14–28) only displays per-weapon aggregates, not actual attack/parry breakdowns; the SHIELD/Crit/Hits column is bound to `Equipment` cells the team has not yet documented; and the **MAGIC: WEAVING | SPELLS** block (rows 30–33) is just three rows pointing at three skill cells in `2.2 General Skills` (Medicine, an empty spell slot, and Attunement). There is **no Ki accumulation, no Magic Accumulation (MA) / Magic Projection, no Critical-Level table, no Damage Resistance (TA/AT) lookup, and no fatigue penalty ladder** on this tab. Those mechanics are absent from the sheet entirely; if the campaign uses them they live in the player's head or on `character_chaos`.

The tab declares `max_row=1042, max_col=26` but only **377 non-empty cells** exist, and real data ends at **row 70, col L (12)**. Eight merged ranges, all cosmetic banners. Cross-tab references go out to **6 other tabs**; nothing references *into* Combat Dashboard from elsewhere (it is a leaf in the dataflow graph).

## Layout map

| Rows  | Cols  | Block                                                |
|-------|-------|------------------------------------------------------|
| 1–2   | A, J–L| Header: char name, Level (K1), DPs Assigned (K2/L2)  |
| 3–9   | A     | STATS readout (8 stats as 4 paired strings)          |
| 3–9   | B–D   | LIFE POINTS pool + Activity Mod ladder + Death cap   |
| 3–9   | E–F   | FATE POINTS + the 5 TRAITS                           |
| 3–9   | G–H   | INITIATIVE (base, w/Shield) + 4 PERCEPTION values    |
| 11    | A     | Banner "COMBAT SKILLS & RESOURCES" (merged A11:I11)  |
| 13–28 | A–B   | OFFENSIVE BONUS — melee weapon dexterity column      |
| 13–28 | C–D   | OFFENSIVE BONUS — ranged weapon dexterity column     |
| 13–17 | E–F   | DEFENSIVE BONUS (DB / Shld / Armor / total)          |
| 19–27 | E–F   | ARMOR per-location DB (Head/Torso/Stomach/…/Total DB)|
| 29    | E–F   | Armor Penalty (`Equipment!H10`)                      |
| 13–17 | G–H   | SHIELD block (DB / Crit / Total Hits Left / Hits)    |
| 13–18 | I–J   | Combat-style martial-knowledge skills (5 styles)     |
| 19–23 | I–J   | Defensive maneuvers + Acrobatics, Wrestling, Brawling|
| 13–17 | K–L   | Warfare / Command / Logistics / Strategy / Tactics   |
| 19–26 | K–L   | Climbing / Ambush / Sniping / Stalking / Animal …    |
| 28–33 | J–L   | Movement / max-pace lookup table (Walk → Dash)       |
| 30–33 | A–C   | MAGIC: WEAVING | SPELLS — 3 skill rows + STATUS flag |
| 35–49 | A–G   | EQUIPMENT | WEAPONS — free-text inventory + LOOT    |
| 55–70 | A–H   | BMR ladder (Height/Qu → BMR base / Mod)              |
| 55–61 | I–J   | Race → max BMR armor penalty lookup                  |

## Inputs

The dashboard exposes **very few** editable cells. Most are typed-but-tracked metadata; almost everything else is a formula. Editable cells, grouped by block:

### Header

| Cell  | Meaning                        | DB target                                 |
|-------|--------------------------------|-------------------------------------------|
| K1    | Character level                | `characters.level` (already exists)       |

### Status block (rows 3–9)

| Cell  | Meaning                                                    | DB target                                                  |
|-------|------------------------------------------------------------|------------------------------------------------------------|
| F3    | Fate Points (current count)                                | `character_description.fate_points` (already exists)        |
| H3    | INITIATIVE base value                                       | `character_game_values` row for `game_values.code='initiative'` (`base_value`) — **see Gap flag below** |

`H3` is currently a **typed literal `18`**, not a formula. In Anima the rule is `Initiative = Quickness bonus × ? + agility bonus + race init mod + class init + equipment`, but the sheet does not encode that — the player just types the result. The DB has a `game_values` row `initiative` ready to receive it.

> **Gap flag — Initiative is hand-entered.** The dashboard does not show the breakdown; whatever modifiers the player applies (race, class, weapon, armor penalty) are folded into a single number. The Next.js port should expose at minimum: `base` (typed), `weapon_init` (per-weapon init mod), `armor_penalty` (read from Equipment), and `final = base + weapon_init - armor_penalty`. None of this decomposition exists in the sheet.

### Defensive bonus / Shield (rows 14–18)

| Cell  | Meaning                       | DB target                                                 |
|-------|-------------------------------|-----------------------------------------------------------|
| F14   | DB base value (typed `12`)    | `character_game_values` row for `game_values.code='db'` (`base_value`) |
| H18   | Shield "Hits" used so far     | **Gap** — no `character_shield_state` table; consider new column on `character_life_points` or a `character_shield_uses` table |
| `H15` shows literal Crit number from `Equipment!H14`, not editable here. |

`F14` is the only typed attack/defense modifier on the entire tab. Everything else (`F15` Shield DB, `F16` Armor DB, `H14`/`H15`/`H16` Shield CRIT/Hits Left, `F20:F26` armor-by-location, `F29` Armor Penalty) is pulled from `Equipment`.

### Equipment / Weapons inventory (rows 35–49)

This is **player-typed free-text** with no schema:

| Range       | Meaning                                                |
|-------------|--------------------------------------------------------|
| A37:A41     | Weapon name (Bastard Sword, Dragon Sword, Spear, …)    |
| B37:B41     | "BREAKAGE" rating (e.g. `6/75`, `6/65`, `2/50`)        |
| C36, D38    | "MODS" header / per-weapon mod (e.g. `+100 MANA`)       |
| E37:E41     | Description / armor-penalty notes                      |
| F41         | Per-weapon flat bonus (e.g. `+5 Critico / +5 Damage Cap`) |
| E42         | Lore prose (Spanish) for "Spear (Kiya)"                |
| G44:G49     | "LOOT:" — 5 free-text inventory items                  |
| K38         | Stray note "60 resta"                                   |

> **Gap flag — there is no DB table for player-owned weapon instances or loot.** The DB has `weapons` (the catalog: 22 generic weapon types) and `character_weapon_skill` (per-character skill ranks per weapon type), but nothing that represents *this specific Bastard Sword with breakage 6/75 and a -10 chain mod*. A new `character_weapons` (instances) and `character_inventory` (loot) table will be needed if Phase 5 wants to surface this.

### BMR static lookup tables (rows 55–70)

These are **rules data**, not character data. They are inputs only in the sense that the player or DM might want to edit them; for this character they are read-only.

| Range     | Meaning                                                                    | DB target                              |
|-----------|----------------------------------------------------------------------------|----------------------------------------|
| A57:A70   | Height ranges (m): 0.25, 0.5, 0.71, 0.91, 1.01, 1.21, 1.31, 1.51, 1.61, 1.81, 1.91, 2.01, 2.31, 2.41 | **Gap** — no `bmr_height_ladder` table |
| B57:B70   | Corresponding height-derived BMR modifier                                   | **Gap**                                |
| C57:C70   | Height "size category" BMR (1.7..3.0)                                       | **Gap**                                |
| D57:D70   | Anima "size code" (2..14)                                                   | **Gap**                                |
| E57:E70   | Quickness threshold low                                                     | **Gap**                                |
| F57:F70   | Quickness threshold high (0..900)                                           | **Gap**                                |
| G57:G70   | BMR Mod from Quickness                                                      | **Gap**                                |
| H57:H70   | Init/Pace mod from Quickness (-5..+7)                                       | **Gap**                                |
| I56:J61   | Race → max BMR armor-penalty fraction (Human=0.2, Dwarf=0.35, …)            | **Gap** — could live on `races.bmr_max_armor_penalty` or a new `race_bmr_rules` |

> **Gap flag — BMR rules data has no DB home.** The `game_values` table has `bmr_no_armor` and `bmr_with_armor` for the *result*, but the underlying ladder (height + Quickness → BMR mod) is missing. Either seed it as `bmr_progression(height_min, height_max, qu_min, qu_max, bmr_mod, init_mod)` rows, or move the calculation into hard-coded TS in `lib/domain/bmr.ts`.

## Formulas

Every formula on the tab, grouped by block. Where a formula repeats verbatim down a range, the canonical row is shown plus the range it covers.

### Header & cross-tab top-line (rows 1–2)

| Cell | Formula                                  | Computes                                          |
|------|------------------------------------------|---------------------------------------------------|
| A1   | `='1. Stats & Traits'!B2`                | Character name (display only)                     |
| K2   | `='Playing Dashboard'!K2`                | DPs spent / available shadow                      |
| L2   | `='Playing Dashboard'!L2`                | Label "DPs Assign per Session" (label-as-formula) |

### STATS readout (rows 4–7, col A)

Four concatenated paired strings (one per pair of adjacent stats), e.g.:

| Cell | Formula                                                                                                                                                  | Computes                          |
|------|----------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------|
| A4   | `=concatenate('1. Stats & Traits'!B13,": ",text('1. Stats & Traits'!G13,"00"),"  \|  ",'1. Stats & Traits'!B14,": ",text('1. Stats & Traits'!G14,"00"))`  | "st: 05  \|  co: 07"              |
| A5   | analogous, pulling B15/G15 (ag) and B16/G16 (qu)                                                                                                          | "ag: 07  \|  qu: 06"              |
| A6   | analogous, pulling B17/G17 (sd) and B18/G18 (re)                                                                                                          | "sd: 07  \|  re: 04"              |
| A7   | analogous, pulling B19/G19 (in) and B20/G20 (pr)                                                                                                          | "in: 12  \|  pr: 01"              |

These are display-only — they rebuild the stat readout that `1. Stats & Traits` rows 13–20 already compute. Pure UI sugar.

### LIFE POINTS pool (rows 4–9, cols B–D)

| Cell | Formula                                                                                              | Computes                                                                                |
|------|------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------|
| B4   | `='2.1 Categories'!L2`                                                                               | **Total Life Pool** (the modified Life trait total, currently 74)                       |
| B5   | `=B4`                                                                                                | **Actual Life Points** (defaults to full pool; player overwrites when wounded)          |
| D5   | `=CONCATENATE(rounddown($B$4*75%,0)," [-10 act]")`                                                   | "Above this LP → -10 activity penalty" threshold display (e.g. `55 [-10 act]`)         |
| D6   | `=CONCATENATE(rounddown($B$4*50%,0)," [-20 act]")`                                                   | "-20 act" threshold (e.g. `37 [-20 act]`)                                                |
| D7   | `=CONCATENATE(rounddown($B$4*25%,0)," [-30 act]")`                                                   | "-30 act" threshold (e.g. `18 [-30 act]`)                                                |
| B7   | `=if(B5>rounddown(B4*25%,0),if(B5>rounddown(B4*50%,0),if(B5>rounddown(B4*75%,0),0,-10),-20),-30)+B9` | **Activity Modifier** (the live wound penalty) — nested-IF ladder over the 25/50/75% thresholds, plus a Permanent Mod cell `B9` |
| D8   | `=CONCATENATE("Death at -",'1. Stats & Traits'!C14)`                                                 | "Death at -64" — death threshold = -CO percentile from stats tab                        |

> **Gap flag — `B9` Permanent Mod is referenced but the cell is empty.** The formula in B7 adds `+B9`, but no cell-value or formula was found at `B9`. The label `C9 = "Permanent Mod"` is there. This is a **player-editable flat penalty (e.g. crippling wounds)** that rides on top of the wound-threshold ladder. `character_life_points` already has `dm_activity_modifier` and `has_activity_penalty_reduction` — `B9` maps to `dm_activity_modifier` (or a new `permanent_modifier int default 0`).

> Note: the activity-modifier ladder hard-codes `{75%, 50%, 25%}` thresholds and `{-10, -20, -30}` penalties. The DB already has `life_activity_modifier_rules(threshold_percent, modifier_value, applies_to)` with **3 rows** — that table is the canonical source. The sheet duplicates the rule inline; the Next.js port should drive the ladder from `life_activity_modifier_rules` instead.

### TRAITS readout (rows 5–9, col F)

| Cell | Formula                  | Computes                            |
|------|--------------------------|-------------------------------------|
| F6   | `='2.1 Categories'!L4`   | General Knowledge total (modified)  |
| F7   | `='2.1 Categories'!L5`   | RR Will                             |
| F8   | `='2.1 Categories'!L6`   | RR stam                             |
| F9   | `='2.1 Categories'!L7`   | RR Magic                            |

(`E5..E9` are static labels: TRAITS / General Knowledge / RR Will / RR stam / RR Magic.)

The mapping `L2 → Life`, `L4 → Knowledge`, `L5 → Will`, `L6 → stam`, `L7 → Magic` confirms that `2.1 Categories` rows 2–7 are: Life, *(skipped)*, General Knowledge, RR Will, RR stam, RR Magic. The skip at L3 is **suspicious** — the Categories tab might list a 6th trait (Power Points?) that the dashboard intentionally hides, or it might be a layout gap. Cross-check against the `2.1 Categories` analysis.

### INITIATIVE block (rows 3–4, cols G–H)

| Cell | Formula  | Computes                                       |
|------|----------|------------------------------------------------|
| H3   | (typed `18`) | Initiative base (player enters)            |
| H4   | `=H3-5`  | Initiative w/Shield (Anima rule: shields cost 5 init) |

### PERCEPTION block (rows 5–9, cols G–H)

| Cell | Formula                          | Computes                  |
|------|----------------------------------|---------------------------|
| H6   | `='Playing Dashboard'!H6`        | Perception Pasive (sic)   |
| H7   | `='Playing Dashboard'!H7`        | Perception Active         |
| H8   | `='Playing Dashboard'!H8`        | Combat Perception         |
| H9   | `='Playing Dashboard'!H9`        | Quick Perception (1 turn) |

(All four are pure pass-throughs from `Playing Dashboard`. The labels suggest `Playing Dashboard` is the actual perception calculator.)

### OFFENSIVE BONUS / WEAPON DEXTERITY (rows 14–28, cols A–D)

The two columns A–B (melee) and C–D (ranged) list **22 weapons total**, each as a label (col A or C) plus a derived display string (col B or D). The display string follows one canonical pattern:

| Cell | Formula                                                                                                              | Computes                                          |
|------|----------------------------------------------------------------------------------------------------------------------|---------------------------------------------------|
| B14  | `=CONCATENATE("[",'2.3 Weapon Dexterity'!G2,"] ",'2.3 Weapon Dexterity'!M2," \| ",'2.3 Weapon Dexterity'!M2+$F$29)`   | `[<ranks>] <total> \| <total + armor penalty>`    |

- The `G` column on `2.3 Weapon Dexterity` is **ranks** (or rank-bonus), `M` is **total skill value**.
- `$F$29` is the global Armor Penalty pulled from `Equipment!H10` — so the right side of the ` | ` is the *armor-encumbered* skill value.
- All 22 weapon rows use this same pattern with different `G`/`M` row numbers:

| Weapon (col A/C)        | B/D formula refs (`'2.3 Weapon Dexterity'!`) |
|-------------------------|-----------------------------------------------|
| A14 1h Chains           | `G2`/`M2`                                     |
| A15 2h Chains           | `G3`/`M3`                                     |
| A16 1h Maces            | `G4`/`M4`                                     |
| A17 1h Axes             | `G5`/`M5`                                     |
| A18 2 Handed crush/cleave | `G6`/`M6`                                   |
| A19 Short Swords        | `G7`/`M7`                                     |
| A20 Long Swords         | `G8`/`M8`                                     |
| A21 2 Handed swords     | `G9`/`M9`                                     |
| C14 Bows                | `G10`/`M10`                                   |
| C15 Crossbows           | `G11`/`M11`                                   |
| C16 Pistols             | `G12`/`M12`                                   |
| C17 Rifles              | `G13`/`M13`                                   |
| A23 Short Polearms      | `G14`/`M14`                                   |
| A24 Long Spikes         | `G15`/`M15`                                   |
| A25 Staves              | `G16`/`M16`                                   |
| C23 Small Projectiles   | `G17`/`M17`                                   |
| C24 Medium Projectiles  | `G18`/`M18`                                   |
| C25 Polearms Thrown     | `G19`/`M19`                                   |
| A27 Long Thrust         | `G20`/`M20`                                   |
| A28 Short Thrust        | `G21`/`M21`                                   |
| C18 Sling               | `G22`/`M22`                                   |
| C19 Slingshot           | `G23`/`M23`                                   |

> **Note on the OB list:** This block shows **only the aggregate skill value** for each weapon. There is no separate Attack / Block / Parry / Damage / Critical breakdown — the sheet conflates "Offensive Bonus" with "weapon dexterity skill total". In Anima rules these are typically the same number (you spend AB on attack OR defense each turn), but the *damage* and *critical* fields are missing. The team needs to decide whether Combat Dashboard should also surface damage / critical / breakage for each weapon (currently only the typed inventory rows 37–41 show breakage).

### DEFENSIVE BONUS / Armor / Shield (rows 14–29, cols E–H)

| Cell | Formula                  | Computes                                                    |
|------|--------------------------|-------------------------------------------------------------|
| F14  | (typed `12`)             | DB base                                                     |
| F15  | `=H14`                   | Shield DB (mirror of shield's DB cell)                      |
| F16  | `=F27`                   | Armor DB (mirror of total-DB-from-armor-locations)          |
| F17  | `=F15+F16`               | Armor + Shield DB total                                     |
| F18  | `=F14+10+G18`            | DB final total (12 base + 10 + 175-Hits) → **anomaly** below |
| G18  | `=175-H18`               | Hits remaining = 175 - hits taken                           |
| H14  | `=Equipment!G14`         | Shield DB raw                                               |
| H15  | `=Equipment!H14`         | Shield Crit value                                           |
| H16  | `=Equipment!I14-H17`     | Total Hits Left = shield max hits − some `H17` (empty)      |
| F20  | `=Equipment!E3`          | Head armor DB                                               |
| F21  | `=Equipment!E4`          | Torso/Back armor DB                                         |
| F22  | `=Equipment!E5`          | Stomach/Hip armor DB                                        |
| F23  | `=Equipment!E6`          | Arms armor DB                                               |
| F24  | `=Equipment!E7`          | Hands armor DB                                              |
| F25  | `=Equipment!E8`          | Legs armor DB                                               |
| F26  | `=Equipment!E9`          | Feet armor DB                                               |
| G20  | `=Equipment!B3`          | Head armor TYPE (label, e.g. "Plate")                       |
| G21  | `=Equipment!B4`          | Torso/Back armor TYPE                                       |
| G22  | `=Equipment!B5`          | Stomach/Hip armor TYPE                                      |
| G23  | `=Equipment!B6`          | Arms armor TYPE                                             |
| G24  | `=Equipment!B7`          | Hands armor TYPE                                            |
| G25  | `=Equipment!B8`          | Legs armor TYPE                                             |
| G26  | `=Equipment!B9`          | Feet armor TYPE                                             |
| F27  | `=SUM(F20:F26)`          | Total armor DB across all 7 locations                       |
| F29  | `=Equipment!H10`         | Armor penalty (penalty from total armor weight)             |

> **Anomaly:** `F18 = F14 + 10 + G18 = 12 + 10 + 175 = 197`. This computes a number labeled neither (the cell has no header and value 197). Best guess: an old "max parry" or "max defense roll" formula; maybe `F14` is base, `+10` is a flat bonus, `+G18` is shield-hits-remaining (which is structurally weird for a defense calc). Treat as **dead/legacy formula** and do not port.

> **Note:** `H17` is an empty cell that `H16` subtracts. So `Total Hits Left = max_shield_hits − 0` until `H17` is populated (likely meant to track damage absorbed by the shield this combat).

### Combat-style skills, defensive maneuvers, warfare, perception-adjacent skills (rows 13–26, cols I–L)

These 22 cells follow the **same `CONCATENATE(<base>," | ",<base>+$F$29)`** pattern as the OB list but pull from `Playing Dashboard` skill rows. Canonical forms:

| Cell | Formula                                                                                                             | Source on Playing Dashboard         |
|------|---------------------------------------------------------------------------------------------------------------------|-------------------------------------|
| J13  | `=CONCATENATE('Playing Dashboard'!J13," \| ",'Playing Dashboard'!J13+$F$29)`                                         | Combat Styles (Warfare-adjacent)    |
| J14  | same with `J14`                                                                                                     | Dirty Fighting                      |
| J15  | same with `J15`                                                                                                     | Double Weapon                       |
| J16  | same with `J16`                                                                                                     | Shield/Weapon                       |
| J17  | same with `J17`                                                                                                     | Two Weapon Combo                    |
| J19  | `=CONCATENATE(max('1. Stats & Traits'!G15*2,J20)+20," \| ",max('1. Stats & Traits'!G15*2,J20)+20+$F$29)`             | **Dodge Maneuver** (custom calc)    |
| J20  | `=CONCATENATE('Playing Dashboard'!D14," \| ",'Playing Dashboard'!D14+$F$29)`                                         | Acrobatics                          |
| J21  | `=CONCATENATE('Playing Dashboard'!D16," \| ",'Playing Dashboard'!D16+$F$29)`                                         | Jumping                             |
| J22  | `=CONCATENATE('Playing Dashboard'!D17," \| ",'Playing Dashboard'!D17+$F$29)`                                         | Wrestling                           |
| J23  | `=CONCATENATE('Playing Dashboard'!F15," \| ",'Playing Dashboard'!F15+$F$29)`                                         | Brawling                            |
| L13  | `='Playing Dashboard'!H33`                                                                                          | Warfare total                       |
| L14  | `='Playing Dashboard'!H34`                                                                                          | Command                             |
| L15  | `='Playing Dashboard'!H35`                                                                                          | Logistics                           |
| L16  | `='Playing Dashboard'!H36`                                                                                          | Strategy                            |
| L17  | `='Playing Dashboard'!H37`                                                                                          | Tactics                             |
| L19  | `=CONCATENATE('Playing Dashboard'!F16," \| ",'Playing Dashboard'!F16+$F$29)`                                         | Climbing                            |
| L20  | `=CONCATENATE('Playing Dashboard'!F28," \| ",'Playing Dashboard'!F28+$F$29)`                                         | Ambush                              |
| L21  | `=CONCATENATE('Playing Dashboard'!F30," \| ",'Playing Dashboard'!F30+$F$29)`                                         | Sniping                             |
| L22  | `=CONCATENATE('Playing Dashboard'!F31," \| ",'Playing Dashboard'!F31+$F$29)`                                         | Stalking/Hiding                     |
| L23  | `='Playing Dashboard'!B14`                                                                                          | Animal Handling                     |
| L24  | `='Playing Dashboard'!B15`                                                                                          | Beastmastery                        |
| L25  | `=CONCATENATE('Playing Dashboard'!B17," \| ",'Playing Dashboard'!B17+$F$29)`                                         | Mounted Combat                      |
| L26  | `=CONCATENATE('Playing Dashboard'!B18," \| ",'Playing Dashboard'!B18+$F$29)`                                         | Riding                              |

The labels in cols I and K are themselves formulas in some rows (e.g. `K19 ='Playing Dashboard'!E16` for "Climbing"), making the labels live-updating from Playing Dashboard's skill list.

> **Note — Dodge Maneuver formula (`J19`):** `max(Quickness_total × 2, Acrobatics)+20`. This is the only **first-class derived combat statistic** on the entire tab and encodes a Zskahra-specific (or house) Anima rule: dodge defense = max(Qu×2, Acrobatics skill) +20 base. Cross-tab refs: `'1. Stats & Traits'!G15` (Quickness total) and `J20` (Acrobatics, itself pulled from `Playing Dashboard`!D14). **Port this exactly verbatim** in `lib/domain/combat.ts`.

### MAGIC: WEAVING | SPELLS (rows 30–33)

| Cell | Formula                              | Computes                                       |
|------|--------------------------------------|------------------------------------------------|
| A31  | `='2.2 General Skills'!C85`          | Spell name "Spell: Medicine" (text passthrough) |
| B31  | `='2.2 General Skills'!M85`          | Skill total for that spell row (currently -1)   |
| C31  | (typed `False`)                      | "STATUS" boolean — spell active flag             |
| A32  | `='2.2 General Skills'!C86`          | Spell name (currently empty `Spell: `)          |
| B32  | `='2.2 General Skills'!M86`          | Skill total (-1)                                 |
| A33  | (typed "Attunement")                 | Label                                            |
| B33  | `='2.2 General Skills'!M84`          | Attunement skill total (-6)                      |

This is a **stub**: 3 hand-picked rows from General Skills positioned as the magic surface. There is no Zeon, no MA, no Magic Projection, no spell catalog, no path allocation. The label "WEAVING" hints at a Zskahra-specific magic mechanic ("weaving spells") that uses general-skill rolls instead of Anima's standard MK system.

> **Gap flag — magic system has no proper backing on this tab.** The 2.4 Magic analysis already flagged this; Combat Dashboard confirms it. Defer.

### MOVEMENT pace ladder (rows 28–33, cols J–L)

A 5-row "max pace" lookup that down-shifts BMR depending on the player's current movement state (read from `Equipment!G80` — the equipment tab tracks "current pace"):

| Cell | Formula                                                                                              | Computes                                            |
|------|------------------------------------------------------------------------------------------------------|-----------------------------------------------------|
| K29  | (typed `1.85`)                                                                                       | BMR Walk (x1) — base Walk meters/turn               |
| L29  | (typed `#REF!`)                                                                                      | BMR Walk + Armor encumbered — **broken reference**  |
| K30  | `=iferror(if(Equipment!$G$80="Walk","Encumbrance",K29*2),"Encumbrance")`                             | Run = Walk × 2 unless current pace is Walk          |
| L30  | `=iferror(if(Equipment!$G$80="Walk","Encumbrance",L29*2),"Encumbrance")`                             | Run + armor                                         |
| K31  | `=iferror(if(Equipment!$G$80="Run","Encumbrance",K30/2*3),"Encumbrance")`                            | Fast Run = (Run/2)×3                                |
| L31  | `=iferror(if(Equipment!$G$80="Run","Encumbrance",L30/2*3),"Encumbrance")`                            | Fast Run + armor                                    |
| K32  | `=iferror(if(Equipment!$G$80="Fast Run","Encumbrance",K31/3*4),"Encumbrance")`                       | Sprint = (FR/3)×4                                   |
| L32  | `=iferror(if(Equipment!$G$80="Fast Run","Encumbrance",L31/3*4),"Encumbrance")`                       | Sprint + armor                                      |
| K33  | `=iferror(if(Equipment!$G$80="Sprint","Encumbrance",K32/4*5),"Encumbrance")`                         | Dash = (Sprint/4)×5                                 |
| L33  | `=iferror(if(Equipment!$G$80="Sprint","Encumbrance",L32/4*5),"Encumbrance")`                         | Dash + armor                                        |

**The IF semantics are inverted:** `if(Equipment!$G$80="Walk","Encumbrance", K29*2)` means *if the player is currently walking, show "Encumbrance"; otherwise show 2× Walk.* That seems backwards (you'd expect it to show the actual run distance when the player is walking), and the typed `#REF!` in `L29` propagates `"Encumbrance"` through the entire armor column. Treat the whole table as **broken / incomplete**; redesign in the port.

> **Gap flag — `L29 = #REF!`.** The whole "with armor" column is dead until this is fixed. The intent is `L29 = K29 - <armor BMR penalty from race table I55:J61>`, capped by `J55` ("BMR MAX PEN ARMOR"). Implement in TS rather than recreate the broken cells.

## Cross-tab refs

Combat Dashboard pulls from **6 other tabs**. Grouped by source:

### `'1. Stats & Traits'`
- `B2` (char name) → A1
- `B13`/`G13` (Strength stat) → A4
- `B14`/`G14` (Constitution) → A4, also `C14` for Death threshold (`D8`)
- `B15`/`G15` (Agility) — `G15` also drives the Dodge formula → A5, J19
- `B16`/`G16` (Quickness) → A5
- `B17`/`G17` (Self Discipline) → A6
- `B18`/`G18` (Reasoning) → A6
- `B19`/`G19` (Insight) → A7
- `B20`/`G20` (Presence) → A7

### `'2.1 Categories'`
- `L2` Life Points (modified total) → B4
- `L4` General Knowledge → F6
- `L5` RR Will → F7
- `L6` RR stam → F8
- `L7` RR Magic → F9

### `'2.2 General Skills'`
- `C85` / `M85` Medicine spell name + skill total → A31, B31
- `C86` / `M86` blank spell slot → A32, B32
- `M84` Attunement skill total → B33

### `'2.3 Weapon Dexterity'`
- 22 rows: `G2..G23` (ranks) and `M2..M23` (totals) → B14:B28 (melee col B) and D14:D25 (ranged col D)

### `'Playing Dashboard'`
- `K2` (DPs assigned), `L2` (label) → K2, L2
- `H6..H9` (perception values) → H6:H9
- `J13..J17` (combat-style skill totals) → J13:J17
- `D14`, `D16`, `D17`, `F15`, `F16`, `F28`, `F30`, `F31` (skill totals for Acrobatics, Jumping, Wrestling, Brawling, Climbing, Ambush, Sniping, Stalking) → J20:J23, L19:L22
- `H33..H37` (Warfare/Command/Logistics/Strategy/Tactics) → L13:L17
- `A14`, `B14`, `A15`, `B15`, `A17`, `B17`, `A18`, `B18` (Animal Handling, Beastmastery, Mounted Combat, Riding labels+values) → K23..K26, L23..L26
- `C14`, `C16`, `C17`, `E15`, `E16`, `E28`, `E30`, `E31` (skill *labels* for J/K columns) → I20:I23, K19:K22

### `'Equipment'`
- `B3..B9` armor type per location → G20:G26
- `E3..E9` armor DB per location → F20:F26
- `G14` Shield DB → H14
- `H14` Shield Crit → H15
- `I14` Shield max hits → H16
- `H10` Armor Penalty → F29
- `G80` current pace state ("Walk"/"Run"/"Fast Run"/"Sprint") → K30:K33, L30:L33

> **Inbound from Combat Dashboard:** none. The tab is read-only for the rest of the workbook.

## DB mapping

For each block, here is the existing DB anchor (if any) and what's a gap.

### Header / status bar

- `K1` Level → `characters.level` ✓
- `F3` Fate Points → `character_description.fate_points` ✓
- `K2` "DPs assigned" → derived from `character_dp_sessions` (sum)

### Life Points pool

- `B4` Total Life Pool → derived: `character_traits` row for Life trait (or `2.1 Categories` `L2`-equivalent computation). The Life trait already has DB plumbing (`character_traits.ranks` + `character_traits.dp_allocated` + race/birthplace mods + stat).
- `B5` Actual Life Points (current) → `character_life_points.current_life_points` ✓
- `B7` Activity Modifier → **derived** from `character_life_points.current_life_points`, `B4` (max), and `life_activity_modifier_rules` (3 rows). Do not persist.
- `B9` Permanent Mod → **gap** — the cell is referenced but empty; map to `character_life_points.dm_activity_modifier` (already exists).
- `D5/D6/D7/D8` threshold display strings → derived; **do not persist**.

> **Recommendation:** drive the activity-modifier ladder from `life_activity_modifier_rules` rather than the hard-coded `{75,50,25}%` thresholds in the sheet.

### Traits readout

- `F6:F9` (Knowledge / RR Will / RR stam / RR Magic) → `character_traits` rows joined with `traits` (already plumbed). Also surface RR Disease and RR Psychic per Phase 0 migration §5.

### Initiative

- `H3` Initiative base → `character_game_values` row where `game_values.code = 'initiative'`, field `base_value` ✓
- `H4` Initiative w/Shield → `character_game_values` row where `game_values.code = 'initiative_shield'`. The DB row exists; the sheet's `H3-5` formula encodes the Anima rule "shields cost 5 init". Either persist `H4` as `initiative_shield.base_value` or compute on read as `initiative.total_value - shield_init_penalty`. **Recommend compute on read** (avoids drift).

### Defensive bonus / armor

- `F14` DB base → `character_game_values` row where `code='db'` ✓
- `F15` Shield DB → `character_game_values` row where `code='db_shield'` ✓ (the DB row exists)
- `F16` Armor DB total = `F27 = SUM(F20:F26)` → derived from Equipment per-location armor
- `F17` Armor + Shield → derived
- `F20:F26` armor per location (Head/Torso/Stomach/Arms/Hands/Legs/Feet) → **gap** — no `character_armor_pieces(location, db, type, ...)` table. Currently lives only on the Equipment tab as cells `B3:E9`.
- `F29` Armor Penalty → **gap** — same Equipment dependency; map to `character_game_values.code='armor_modifier'` (already exists) for the *aggregate*, but per-piece armor is unmodeled.

> **Gap flag — Equipment is the missing tab.** Combat Dashboard depends on `Equipment` for armor, shield, weapon-instance data, and current pace state. There is **no `character_equipment` / `character_armor` / `character_shield` / `character_weapon_instance` table in the DB.** Phase 5's Equipment dashboard cannot be built without first deciding the equipment schema. Suggest at minimum: `character_armor(character_id, location, name, db, ta_value, type, notes)` × 7 rows, `character_shield(character_id, name, db, crit, max_hits, current_hits, init_penalty)`, `character_weapon_instance(character_id, weapon_id, name, breakage_above_X, breakage_chance, mods, notes)`.

### Shield block

- `H14` Shield DB, `H15` Crit, `H16` Total Hits Left, `H18` Hits taken → all gap (see above; the schema is needed)

### Perception (4 values)

- `H6` Pasive, `H7` Active, `H8` Combat, `H9` Quick → `character_game_values` rows for `combat_perception`, `quick_perception` ✓ (DB has both). The DB **does not have** distinct `perception_passive` and `perception_active` rows; only `combat_perception` and `quick_perception`. Either:
  - add 2 more rows to `game_values` (`perception_passive`, `perception_active`), or
  - reinterpret the 4 dashboard values as 4 different snapshots and pick which 2 the DB tracks.
- The values are pulled from `Playing Dashboard` H6:H9, suggesting Playing Dashboard is the *real* perception calculator — Combat Dashboard is just a mirror.

> **Gap flag — only 2 of 4 perception values have DB homes.** Add `perception_passive` and `perception_active` codes to `game_values` if the dashboard should remain four-row.

### OFFENSIVE BONUS (22 weapons)

- The display strings `[<ranks>] <total>` come from `character_weapon_skill` (per-character ranks) joined to `weapons` (catalog of 22). The DB schema is mature for this:
  - `character_weapon_skill.ranks` ✓ (matches `'2.3 Weapon Dexterity'!G<row>`)
  - `character_weapon_skill.total` ✓ (matches `M<row>`)
  - `character_weapon_skill.adolescent_ranks`, `package_ranks`, `total_ranks`, `weapon_affinity_value` ✓ — richer than the sheet
- The "armor-encumbered" right-hand side `<total + armor_penalty>` is derived; **do not persist**.

### Combat-style skills, defensive maneuvers, warfare, etc.

- All are skill lookups; map to `character_skills` joined with `skills`. The Playing Dashboard analysis (still TBD) will be the ground truth on which rows in `character_skills` correspond to Combat Styles / Dirty Fighting / Double Weapon / Shield-Weapon / Two-Weapon Combo / Warfare / Command / Logistics / Strategy / Tactics / Climbing / Ambush / Sniping / Stalking / Animal Handling / Beastmastery / Mounted Combat / Riding / Acrobatics / Jumping / Wrestling / Brawling.
- Dodge Maneuver → **derived** (no DB row); compute `max(qu_total*2, acrobatics_skill_total) + 20`.

### Magic / Weaving stub

- `A31..B33` → 3 rows of `character_skills` joined to `skills` (Medicine, blank, Attunement). Status flag `C31` has no DB home and is currently `false`.
- **Gap:** there is no `character_spells_known`, `mystical_paths`, or `spells` table. Defer.

### Equipment / Weapons / Loot (rows 35–49)

- **Pure gap.** No DB tables exist for player-typed weapon instances, breakage ratings, mods, descriptive lore, or loot bag items.

### BMR / movement (rows 28–33 + 55–70)

- `K29` Walk base → derive from BMR ladder (height + Quickness lookup). DB has `character_game_values` row for `bmr_no_armor` and `bmr_with_armor` ✓.
- The 5 pace tiers (Walk/Run/Fast Run/Sprint/Dash) are pure multipliers (×1, ×2, ×3, ×4, ×5 of BMR). Encode as a `MOVEMENT_TIERS` constant in TS, not as DB rows.
- The static BMR ladder `A55:H70` and race penalty table `I55:J61` → **gap.** No `bmr_progression` or `race_bmr_armor_penalty` table. Either:
  - seed `bmr_progression(min_height_m, min_qu_total, height_bmr, qu_bmr_mod, qu_init_mod)` from these rows, or
  - hard-code in `lib/domain/bmr.ts` (recommended; the data is small and never changes).

### Equipment | Weapons inventory (rows 35–49)

- See "Equipment is the missing tab" gap flag above.
- LOOT bag (G44:G49) → **gap.** Add `character_inventory(character_id, item_name, qty, notes)` if loot tracking is wanted.

## Recommendations

### Phase 5 — what to render in the Combat Dashboard

Build the dashboard around **6 cards**, in priority order. All cards read-only by default; every input is delegated to the source tab.

1. **Status card (top strip)** — Life Points (current/max + activity-mod chip from `life_activity_modifier_rules`), Fate Points stepper, Initiative (base + with-shield), 4 Perception values.
   - **Editable here:** `current_life_points`, `dm_activity_modifier`, `fate_points`, `initiative.base_value`. Everything else read-only.
   - Compute `B4` (total life pool) from `character_traits` for Life; do not duplicate as a separate column.

2. **Defense card** — DB base, Shield DB, Armor DB (sum of 7 locations, with a tooltip listing each), Armor + Shield total, **Armor Penalty** (currently `F29`, applied as a global -X to every skill display). This card depends on Equipment tab data; **block this card behind a working `character_armor` schema**.

3. **Offensive Bonus / Weapon Dexterity card** — 22-row table grouped by category (melee/ranged/throwing). Each row: weapon name, ranks, total skill, total - armor penalty. Pull from `character_weapon_skill` joined to `weapons`. The DB already has affinity transfer logic (`weapon_affinity_value`) — surface it. Defer per-weapon damage / critical until Equipment instances exist.

4. **Maneuvers & Combat Skills card** — single grouped table covering: combat styles, dodge (computed inline as `max(qu*2, acrobatics)+20`), defensive maneuvers (Acrobatics, Jumping, Wrestling, Brawling), warfare-tier knowledge (Warfare, Command, Logistics, Strategy, Tactics), exploration-adjacent (Climbing, Ambush, Sniping, Stalking), animal-related (Animal Handling, Beastmastery, Mounted Combat, Riding). All values pulled from `character_skills`.

5. **Movement card** — Show 5 pace tiers (Walk / Run / Fast Run / Sprint / Dash), with and without armor penalty. Compute from `bmr_no_armor` and `bmr_with_armor` game-values rows × `[1, 2, 3, 4, 5]`. Drop the broken sheet logic; do not port `IF(Equipment!G80=..., "Encumbrance", ...)`. Surface a "current pace" toggle separately.

6. **Magic / Weaving card** — three skill rows + active flag. Trivial: render `character_skills` for Medicine, an empty spell slot, and Attunement. Mark as TODO until a real magic system exists.

### Defer to Phase 5+

- **Equipment tab** must come first. Combat Dashboard reads `Equipment!B3:E9`, `G14:I14`, `H10`, `G80`. Until those cells have a DB schema (suggested: `character_armor`, `character_shield`, `character_weapon_instance`, `character_equipment_state.current_pace`), the Defense, Shield, and full Movement cards cannot render real data.
- **Initiative breakdown.** The sheet only stores the final number. If the team wants tooltip-able init breakdown (race init mod + class + weapon + armor), add columns to `character_game_values` or use `character_game_modifiers` polymorphically.
- **Critical / damage / breakage per weapon.** Not in this dashboard at all. If wanted, extend `weapons` with `crit_table_id, damage_die, breakage_chance` (rules data) and `character_weapon_instance` with per-instance breakage state.
- **Ki / MA / Magic Projection / Critical Levels.** None of these mechanics appear on the tab. Treat as out-of-scope for v1; revisit only if a Zskahra rules document specifies them.

### Where to surface DM/player input

- **Player-editable on the Combat Dashboard surface itself:**
  - Current Life Points (saving roll, wound updates).
  - Hits absorbed by the shield (combat-state field).
  - Fate Points decrement.
  - Initiative base (until the breakdown is modeled).
  - "Active" toggle on each spell row.
- **DM-editable (consider a DM panel, not the player view):**
  - `dm_activity_modifier` (the `B9` Permanent Mod). Possibly `gm_bonus` on perception/init.
  - "Death threshold override" if the campaign uses something other than `-CO_percentile`.
- **Read-only on this tab (delegated):**
  - Stats, Traits, every weapon-skill total, every general-skill total, every armor-piece DB. Each of these has a dedicated tab; clicking the value should deep-link to that tab's editor.

### Runtime calculations: client vs persist

Compute on read; never persist these:

- Activity-mod ladder (`B7`) — recompute from `current_life_points`, max LP, and `life_activity_modifier_rules` rows.
- Activity-mod thresholds (`D5`/`D6`/`D7`) — pure display strings.
- Death threshold (`D8`) — `-character_stats(co).percentile`.
- Initiative w/Shield (`H4`) — `init.total_value - 5` (or `-shield_init_penalty` if the shield carries its own penalty).
- All `<base> | <base + armor_penalty>` display strings — recompute every render.
- Armor DB total (`F27`) — `SUM(F20:F26)`.
- Total armor + shield (`F17`).
- Movement tiers (`K29:L33`) — multipliers over BMR.
- Dodge Maneuver (`J19`) — `max(qu_total*2, acrobatics)+20`.

Persist these (per-character writes):

- `character_life_points.current_life_points`
- `character_life_points.dm_activity_modifier` (← `B9` Permanent Mod)
- `character_description.fate_points`
- `character_game_values` rows for `initiative.base_value`, `db.base_value`, `db_shield.base_value`, `combat_perception.base_value`, `quick_perception.base_value`, `bmr_no_armor.base_value`, `bmr_with_armor.base_value`, `armor_modifier.base_value`
- (When Equipment lands) per-location armor rows, shield state, weapon instances, current pace.

### Static lookup tables to promote to DB seeds

- `A55:H70` → seed a `bmr_progression` table (or hard-code in `lib/domain/bmr.ts`).
- `I55:J61` → seed `race_bmr_armor_penalty` (or add `bmr_max_armor_penalty numeric` to `races`).
- `F55:G55` Feet→Meter constant `0.3048` — single constant; inline in TS.
- The `{75%, 50%, 25%} × {-10, -20, -30}` activity-mod ladder is **already** in `life_activity_modifier_rules` (3 rows). Use that, not a duplicate.

### Explicit Gap flags (recap)

- **Gap:** no DB home for the equipment tab's per-location armor, shield state, or weapon instances. Combat Dashboard's Defense / Shield cards are blocked on this.
- **Gap:** `B9` Permanent Mod is referenced in the activity formula but the cell is empty on the sheet — map to `character_life_points.dm_activity_modifier` (column already exists).
- **Gap:** only 2 of 4 perception values (`combat_perception`, `quick_perception`) have `game_values` rows. Add `perception_passive` and `perception_active` if the dashboard should keep all four.
- **Gap:** BMR static ladder (height/Qu → mod) has no `bmr_progression` table.
- **Gap:** Race max-BMR-armor-penalty (Human=0.2, Dwarf=0.35, Elven=0.2, Gnome=0.2, Halfling=0.2, Hybrid=0.2) has no DB column.
- **Gap:** loot bag (`G44:G49`) — no `character_inventory` table.
- **Gap:** spell catalog / Zeon / MA / Magic Projection — no DB. Defer.
- **Gap:** weapon damage, critical, breakage are not on this tab; Combat Dashboard cannot show "this Bastard Sword does 6/75 breakage" without an Equipment + weapon-instance schema.
- **Anomaly:** `F18 = F14 + 10 + G18 = 197` is a dead/legacy formula with no clear semantics; do not port.
- **Anomaly:** `L29 = #REF!` poisons the whole "with armor" movement column. Reimplement movement in TS rather than reproduce the sheet's broken cells.
