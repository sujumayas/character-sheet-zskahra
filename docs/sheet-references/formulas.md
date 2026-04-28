# Sheet → App formula map

Source spreadsheet: <https://docs.google.com/spreadsheets/d/1DsWkIlFuw0CC-UyyYRvQ76J9xW6bZjZS5xRpUF_Fx5A/edit>

The full per-tab analysis lives in `docs/sheet-analysis/` (one file per tab). This
file is the **short reference** for which Combat-Dashboard / Equipment / Play
derivations have been ported into TypeScript.

## Auto-derived (computed at read time, no DB write)

| Sheet cell | Sheet formula | App helper / call site |
|---|---|---|
| `Combat Dashboard!H4` | `=H3-5` | `initiativeWithShield(initBase)` in `lib/domain/combat.ts` |
| `Combat Dashboard!H6` | `=H17` → `'2.2 General Skills'!M18` (Perception Passive skill total) | `combat/page.tsx` overrides `perception_passive.total` with the live skill total |
| `Combat Dashboard!H7` | `=H16` → `'2.2 General Skills'!M17` (Perception Active skill total) | `combat/page.tsx` overrides `perception_active.total` |
| `Combat Dashboard!H9` | `=H7-30` | `quickPerception(activeTotal)` in `lib/domain/combat.ts` |
| `Combat Dashboard!J19` | `=max('1. Stats & Traits'!G15*2, J20)+20` | `dodgeManeuver(quTotal, acrobaticsTotal)` (already in `lib/domain/combat.ts`) |
| `Combat Dashboard!F27` | `=SUM(F20:F26)` | `armorTotals(...)` in `lib/domain/equipment.ts` (sums per-body-part) |
| `Combat Dashboard!F29` | `=Equipment!H10` | computed in `lib/domain/equipment.ts::armorTotals` |
| `Equipment!H1` | `='2.2 General Skills'!M11` (skill "Armor" inside category "Athletic Stamina") | `loadWearArmorTotal(supabase, characterId)` in `lib/data/character-totals.ts`; passed into `EquipmentEditor.wearArmorScore` and used in `combat/page.tsx` for the per-part penalty calc |

## Best-effort derivations (sheet was hand-typed; ported with a sensible default)

| Sheet cell | Sheet behaviour | App treatment |
|---|---|---|
| `Combat Dashboard!H3` (Initiative base) | Hand-typed literal — no formula | `derivedInitiative({quTotal, agTotal, armorPenalty, manualOffset})` = qu + ag + armor_penalty + manual_offset. `manual_offset` lives on `character_game_values.base_value` for `code='initiative'` (default 0). Player can override by editing the base. |

## Kept manual (no formula in source sheet)

| Field | DB column / row | Why manual |
|---|---|---|
| Fate Points | `character_description.fate_points` | Anima rule: bought/granted at narrative moments, not formula-driven. Already shared between Stats and Combat tabs through the same column. |
| Combat Perception (`H8`) | `character_game_values.code='combat_perception'` | Sheet has it as a typed override (not a passthrough). Keeps it editable in case the player has a campaign-specific value. |
| DB Base (`F14`) | `character_game_values.code='db'` | Sheet has it as a typed literal (`12`). Anima rule: class-dependent. Stays manual until Zskahra defines per-race/class defaults. |

## Anomalies / dead formulas (NOT ported)

| Sheet cell | Why skipped |
|---|---|
| `Combat Dashboard!F18` | `=F14+10+G18` → 197. No header, no clear semantics. Marked dead in `docs/sheet-analysis/Combat_Dashboard.md` §Defensive bonus. |
| `Combat Dashboard!L29` | `#REF!` poisons the entire "with armor" movement column. Movement tiers re-implemented as `MOVEMENT_TIERS` multipliers in `lib/domain/combat.ts`. |
| Movement IF cascade (`K30..L33`) | Inverted `IF(... = "Walk", "Encumbrance", ...)` semantics. Replaced with a clean `BMR × multiplier` implementation. |

## How to refresh formulas

Read the per-tab analysis under `docs/sheet-analysis/`. Those files quote the
sheet formulas verbatim and explain the cross-tab refs; this file is just an
index pointing back at where each formula was ported.

If you need new formulas, run a fresh CSV export of the sheet (File → Download
→ CSV) and either:
- save it under `docs/sheet-references/aldeano-character.<tab>.csv` for
  audit traceability, or
- paste the formula(s) into a follow-up section here and update the matching
  helper in `lib/domain/`.
