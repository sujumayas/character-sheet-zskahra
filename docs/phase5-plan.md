# Phase 5 — Dashboards, Equipment, and Mobile Polish

**Status:** drafted 2026-04-28 · sub-phase 5a (Equipment) starting
**Owner:** sujumayas@gmail.com
**Parent:** `docs/frontend-plan.md` §9 (Phase 5 enumeration)

---

## 1. Context

Phases 0–4 have shipped. Phase 5 covers three new pages (Equipment, Combat Dashboard, Playing Dashboard), one polish pass (mobile-responsive review), and one explicit deferral (Magic). The three sheet tabs were analyzed on 2026-04-28; this plan operationalizes those analyses.

Key findings from the analyses (`docs/sheet-analysis/Equipment.md`, `Combat_Dashboard.md`, `Playing_Dashboard.md`):

- **Equipment is the keystone.** Combat's Defense card (DB / Shield / Armor + per-location armor + total armor penalty) reads entirely from Equipment. There is **zero DB representation** for armor or shields today. Build Equipment first.
- **Combat Dashboard is a leaf node.** Pulls from 6 tabs; nothing references back. Mostly read-only summary; only ~5 first-class inputs.
- **Playing Dashboard is mostly passthrough.** Life-points sub-block is **duplicated byte-for-byte** with Combat Dashboard — share a `LifePointsPanel` component.
- **Big silent gaps in the sheet:** no Magic / Ki / MA / Critical Levels / Damage Resistance / fatigue ladder / MV / encumbrance / mount / status effects / weapon instances / loot. These are deferred entirely from Phase 5.

## 2. Decisions

| # | Question | Decision |
|---|---|---|
| 1 | Equipment storage shape | Relational. New ref tables: `armor_types`, `body_parts`, `shields`. New per-character: `character_armor` (one row per equipped body part, UNIQUE on `(character_id, body_part_id)`), `character_shield` (zero-or-one per character). No JSON. |
| 2 | Penalty-clamp formula bug | Port the **full-clamp** formula `MAX(max_penalty, MIN(min_penalty, max_penalty + wear_armor))`. The sheet's `MIN(MaxPenalty + skill, MinPenalty)` under-clamps (Plate + Wear Armor −13 → −113). The analysis's suggested fix `MAX(MaxPenalty + skill, MinPenalty)` over-clamps in the other direction (Plate + Wear Armor 0 → −20 full benefit instead of −100 max penalty). The full clamp gives rules-correct behavior across the whole skill range. See `lib/domain/equipment.test.ts` for worked examples. |
| 3 | Wall Shield "Crush -Small" anomaly | Seed verbatim. Add `notes` flagging "verify in Anima rulebook" so the data is honest about the doubt. |
| 4 | Body-part coverage 0.99 sum | Seed verbatim. The 1% gap is consistent with Anima's lethal-hit slot convention. Don't redistribute. |
| 5 | Crit-type string normalization | Split the sheet's `"Crush -Tiny"` into two columns: `crit_damage_type text` + `crit_size_modifier text`. No enums (project convention). |
| 6 | Shield row UX | Auto-populate from a `shields` dropdown. No hand-copy stub. |
| 7 | game_values additions for Combat (5b) | Insert `perception_passive`, `perception_active` rows alongside the existing `perception` rows. |
| 8 | Activity-mod thresholds source (5b) | Drive from `life_activity_modifier_rules`, **not** the sheet's hardcoded `75/50/25%`. Audit table values before 5b. |
| 9 | BMR ladder + race armor BMR cap (5b) | Two new seed tables: `bmr_height_ladder`, `race_armor_bmr_max`. |
| 10 | Weapon instances + loot | **Defer.** The sheet uses free-text; no per-character weapon-instance schema in v1. |
| 11 | Magic / Ki / MA / Critical Levels / fatigue / MV / encumbrance / mount / status / Chaos Power Calculator | **Defer entirely.** None are in the sheet. |

## 3. New schema (sub-phase 5a — Equipment)

Three migrations:

### `phase5_equipment_schema`

```sql
CREATE TABLE armor_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  full_armor_bonus int NOT NULL,
  min_penalty int NOT NULL,
  max_penalty int NOT NULL,
  display_order int NOT NULL,
  is_active bool NOT NULL DEFAULT true
);

CREATE TABLE body_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  percent_covered numeric(4,3) NOT NULL,
  display_order int NOT NULL,
  is_active bool NOT NULL DEFAULT true
);

CREATE TABLE shields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  untrained_db int NOT NULL,
  trained_db int NOT NULL,
  crit_damage_type text NOT NULL,
  crit_size_modifier text NOT NULL,
  hits int GENERATED ALWAYS AS (trained_db * 3) STORED,
  weight_lb numeric(5,1) NOT NULL,
  notes text,
  display_order int NOT NULL,
  is_active bool NOT NULL DEFAULT true
);

CREATE TABLE character_armor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  body_part_id uuid NOT NULL REFERENCES body_parts(id),
  armor_type_id uuid NOT NULL REFERENCES armor_types(id),
  crafting_multiplier numeric(4,2),
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, body_part_id)
);
CREATE INDEX idx_character_armor_character ON character_armor(character_id);

CREATE TABLE character_shield (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE UNIQUE,
  shield_id uuid NOT NULL REFERENCES shields(id),
  special_bonus int NOT NULL DEFAULT 0,
  is_trained bool NOT NULL DEFAULT false,
  hits_used int NOT NULL DEFAULT 0,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_character_shield_character ON character_shield(character_id);

ALTER TABLE armor_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shields ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_armor ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_shield ENABLE ROW LEVEL SECURITY;
```

### `phase5_equipment_rls`

Public-read on the three reference tables; owner-only on `character_armor` and `character_shield`, joined through `characters.owner_user_id`. Same shape as existing `character_skills` policies.

### `seed_phase5_equipment_reference`

Seven `armor_types`, seven `body_parts`, five `shields` — values verbatim from `Equipment.md` static lookup tables. `crit_damage_type` is `'crush'` for all five stock shields; `crit_size_modifier` for Wall Shield is `'small'` with a note flagging the suspected typo.

## 4. Page design (sub-phase 5a)

Route: `/characters/[id]/equipment`

**Tab nav:** add `Equipment` between `Weapons` and `Talents` (logical grouping with combat-loadout pages).

**Server component fetches:**
- `armor_types`, `body_parts`, `shields` (cached; public-read)
- `character_armor` and `character_shield` for this character
- The character's Wear Armor skill total (composed via the existing skill calculation pipeline — needed for the penalty clamp). For v1, look up the row in `character_skills` whose `skill_id` joins to a skill named "Wear Armor" and compute its total via `lib/domain/modifiers.ts`.

**Client editor blocks:**

1. **Armor calculator** — 7-row table, one per `body_part` (ordered by `display_order`):
   - Body part name (read-only)
   - Armor type `<select>` (None…Plate; "None" deletes the `character_armor` row)
   - Crafting multiplier `<input>` (optional, step `0.1`)
   - Bonus = `round(full_armor_bonus × percent_covered)`
   - Total = `bonus × (crafting_multiplier ?? 1)`
   - Penalty = `MAX(max_penalty, MIN(min_penalty, max_penalty + wearArmor))` (full clamp; see Decision #2)
   - % covered (read-only)
   - Weighted penalty = `percent_covered × penalty`

2. **Armor totals strip:**
   - **Armor BD** = `Σ Total`
   - **Total Armor Penalty** = `round(Σ Weighted Penalty)`

3. **Shield panel:**
   - Shield `<select>` (None / Buckler / Target Shield / Shield / Full Shield / Wall Shield)
   - Untrained DB / Trained DB (read-only)
   - `is_trained` checkbox
   - Special bonus `<input>`
   - **Active DB** = `(is_trained ? trained_db : untrained_db) + special_bonus`
   - Crit damage / size modifier (read-only)
   - Hits total / used / remaining
   - Weight (lb + kg, kg derived as `round(lb × 0.45359237, 1)`)

**Persistence:**
- Upsert on blur for numeric fields (crafting_multiplier, special_bonus, hits_used).
- Immediate write on dropdown change. Selecting "None" deletes the row.
- `character_armor` upsert keyed on `(character_id, body_part_id)`.
- `character_shield` upsert keyed on `character_id` (UNIQUE).

**Domain logic:** `lib/domain/equipment.ts` exports `computeArmorRow`, `armorTotals`, `computeShield`. Tests in `lib/domain/equipment.test.ts` cover the full skill range (negative, zero, partial, full-floor, over-cap) plus None / Plain / Mail / Plate. 17 tests, all green.

## 5. Sub-phase 5b — Combat Dashboard

Schema additions (v1 — trimmed from original plan):
- `game_values` rows: `perception_passive`, `perception_active`. Single migration `phase5b_game_values_perception`.
- **Deferred from v1:** `bmr_height_ladder` (14 rows) and `race_armor_bmr_max` (6 rows). For v1, the Movement card reads `bmr_no_armor` / `bmr_with_armor` directly from `character_game_values` (player-edited). Auto-derivation from height + Quickness lands in a follow-up.
- (Optional) extend `character_shield.hits_used` to a `character_shield_uses` log if granular tracking is needed.

Page: `/characters/[id]/combat`

Components:
- `StatusBlock` — stats + life points + activity ladder + fate + traits + initiative + perception. Uses `LifePointsPanel`.
- `OffensiveBonus` — per-weapon attack/defense roll-up from `character_weapon_skill`.
- `DefensiveBonus` — DB base (`character_game_values.db.base_value`) + Shield (`character_shield`) + Armor (`character_armor` totals) → grand total.
- `PerLocationArmor` — 7 rows from `character_armor`.
- `MovementTable` — driven by BMR ladder lookup.
- `MagicWeaving` — leave as stub (3-row read of skill totals: Medicine, blank, Attunement) until magic design lands.

House-rule formulas (port verbatim into `lib/domain/combat.ts`):
- **Dodge Maneuver** = `max(quickness × 2, acrobatics) + 20`
- **Activity penalty** — audit `life_activity_modifier_rules` first; replace the sheet's hardcoded `75/50/25%` with DB-driven thresholds.

Out-of-scope for 5b: weapon instances, loot, critical levels, damage resistance (TA/AT), Ki, MA, fatigue, magic projection.

## 6. Sub-phase 5c — Playing Dashboard (outline only)

Page: `/characters/[id]/play`. Composition view; **no new schema**. Reuses:
- `LifePointsPanel` (shared with `/combat`)
- `StatSnapshot`
- `CategorySkillReadout` (categories + general skills + crafts + lores, read-only)
- `ChaosPanel` (reads `character_chaos`; Power Calculator stays stubbed)

Lightest sub-phase. Mostly read-only assembly.

## 7. Sub-phase 5d — Mobile-responsive review

No schema. Cross-tab pass on all 9 character tabs:
- Tab nav scrolls horizontally at narrow widths (already does — verify).
- Wide grids wrap in `overflow-x-auto` so they scroll, not overflow the viewport.
- Editable controls keep ≥44px tap targets.
- Sticky DP-budget headers don't cover the first input row on small screens.

## 8. Sub-phase ordering

| Sub-phase | Scope | Blocked by |
|---|---|---|
| **5a** | Equipment schema + page + tab | — (start here) |
| 5b | Combat Dashboard | 5a |
| 5c | Playing Dashboard | 5b (shared `LifePointsPanel`) |
| 5d | Mobile-responsive review | 5a / 5b / 5c |

Magic stays deferred until campaign mechanics are finalized.

## 9. Out of scope (Phase 5+)

- Per-character weapon instances + loot (free-text on the sheet; no schema to port).
- Critical levels / damage resistance / armor TA / AT (absent from sheet).
- Ki / MA / Magic Projection / Magic Level / spell list (absent from sheet).
- Fatigue ladder beyond `life_activity_modifier_rules`.
- Movement Value beyond the BMR ladder.
- Encumbrance, mount/companion, status effects.
- Chaos Power Calculator (stubbed at `TODO` in the sheet).

## 10. References

- `docs/sheet-analysis/Equipment.md`
- `docs/sheet-analysis/Combat_Dashboard.md`
- `docs/sheet-analysis/Playing_Dashboard.md`
- `docs/frontend-plan.md` (parent plan)
