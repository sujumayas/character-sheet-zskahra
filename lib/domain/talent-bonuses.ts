// Aggregate the talent_*_bonuses tables (stat / trait / category / skill /
// weapon) plus character_talent_choices into per-target bonus maps for an
// active character. See docs/frontend-plan.md §6.4 step 3.
//
// The aggregation honors:
//   - character_talents.is_active (false → contribute nothing)
//   - character_talents.times_taken (multiplies each fixed bonus row)
//   - character_talent_choices: typed-target choices stack on top of the
//     fixed bonus rows. The choice table covers stat / category / skill /
//     weapon. Trait choices are not modeled in the schema.

export type TalentBonusKind = "stat" | "trait" | "category" | "skill" | "weapon";

export interface CharacterTalentLite {
  id: string;
  talent_id: string;
  is_active: boolean;
  times_taken: number;
}

export interface FixedBonusRow {
  talent_id: string;
  target_id: string;
  bonus: number;
}

export interface ChoiceRow {
  character_talent_id: string;
  choice_type: string; // "stat" | "category" | "skill" | "weapon"
  stat_id: string | null;
  category_id: string | null;
  skill_id: string | null;
  weapon_id: string | null;
  bonus: number;
}

export interface TalentBonusInput {
  characterTalents: CharacterTalentLite[];
  statBonuses: FixedBonusRow[];
  traitBonuses: FixedBonusRow[];
  categoryBonuses: FixedBonusRow[];
  skillBonuses: FixedBonusRow[];
  weaponBonuses: FixedBonusRow[];
  choices: ChoiceRow[];
}

export interface TalentBonusMaps {
  stat: Map<string, number>;
  trait: Map<string, number>;
  category: Map<string, number>;
  skill: Map<string, number>;
  weapon: Map<string, number>;
}

function emptyMaps(): TalentBonusMaps {
  return {
    stat: new Map(),
    trait: new Map(),
    category: new Map(),
    skill: new Map(),
    weapon: new Map(),
  };
}

function add(map: Map<string, number>, key: string, value: number) {
  if (value === 0) return;
  map.set(key, (map.get(key) ?? 0) + value);
}

function applyFixed(
  rows: FixedBonusRow[],
  multiplierByTalentId: Map<string, number>,
  out: Map<string, number>,
) {
  for (const row of rows) {
    const mul = multiplierByTalentId.get(row.talent_id);
    if (!mul) continue;
    add(out, row.target_id, row.bonus * mul);
  }
}

export function aggregateTalentBonuses(input: TalentBonusInput): TalentBonusMaps {
  const out = emptyMaps();

  // Map talent_id → cumulative times_taken across active character_talents
  // rows (handles the rare case of duplicate rows for the same talent).
  const multiplierByTalentId = new Map<string, number>();
  // Map character_talent.id → multiplier (for choices, which are scoped to
  // a single character_talents row, not to the talent itself).
  const multiplierByCharacterTalentId = new Map<string, number>();
  for (const ct of input.characterTalents) {
    if (!ct.is_active) continue;
    const times = Math.max(0, ct.times_taken || 1);
    if (times === 0) continue;
    multiplierByTalentId.set(
      ct.talent_id,
      (multiplierByTalentId.get(ct.talent_id) ?? 0) + times,
    );
    multiplierByCharacterTalentId.set(ct.id, times);
  }

  applyFixed(input.statBonuses, multiplierByTalentId, out.stat);
  applyFixed(input.traitBonuses, multiplierByTalentId, out.trait);
  applyFixed(input.categoryBonuses, multiplierByTalentId, out.category);
  applyFixed(input.skillBonuses, multiplierByTalentId, out.skill);
  applyFixed(input.weaponBonuses, multiplierByTalentId, out.weapon);

  for (const c of input.choices) {
    const mul = multiplierByCharacterTalentId.get(c.character_talent_id);
    if (!mul) continue;
    const value = c.bonus * mul;
    switch (c.choice_type) {
      case "stat":
        if (c.stat_id) add(out.stat, c.stat_id, value);
        break;
      case "category":
        if (c.category_id) add(out.category, c.category_id, value);
        break;
      case "skill":
        if (c.skill_id) add(out.skill, c.skill_id, value);
        break;
      case "weapon":
        if (c.weapon_id) add(out.weapon, c.weapon_id, value);
        break;
    }
  }

  return out;
}
