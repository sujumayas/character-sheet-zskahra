// Pure compute functions for stat / trait totals. Mirrors the spreadsheet
// formulas (1. Stats & Traits §2 and §3) so totals match the source character.
// Categories / skills / weapons land in Phase 2 alongside their UIs.
//
// Sheet column reference for stats (rows 13-20):
//   D = stat_bonus (10d10 distribution result)
//   E = race_modifier (computed from race_stat_modifiers)
//   F = special_modifier
//   G = D + E + F                      (total)
//   H = D + E                          (cost basis — feeds dp-cost lookup)
//
// Sheet trait formula (rows 25-30, Zskahra house rule):
//   trait_total = race_modifier + (stat1.G + stat2.G)
// Plan §6.5 extends this with ranksValueTrait(ranks) + birthplace + talent + …

import { ranksValueSkill, ranksValueTrait } from "./rules";

export interface StatRowInput {
  stat_id: string;
  stat_bonus: number;
  race_modifier: number;
  special_modifier: number;
  talent_bonus?: number;
}

export interface StatRow extends StatRowInput {
  talent_bonus: number;
  total: number;
  cost_total: number;
}

export function computeStatRow(input: StatRowInput): StatRow {
  const talentBonus = input.talent_bonus ?? 0;
  const total =
    input.stat_bonus +
    input.race_modifier +
    input.special_modifier +
    talentBonus;
  // DP cost basis intentionally excludes talent bonuses — DP cost is rolled
  // off the natural stat (sheet column H, plan §6.2). Talent stat bonuses do
  // not retroactively cheapen ranks bought with the natural stat.
  const costTotal = input.stat_bonus + input.race_modifier;
  return {
    stat_id: input.stat_id,
    stat_bonus: input.stat_bonus,
    race_modifier: input.race_modifier,
    special_modifier: input.special_modifier,
    talent_bonus: talentBonus,
    total,
    cost_total: costTotal,
  };
}

export interface TraitRowInput {
  trait_id: string;
  ranks: number;
  primary_stat_total: number;
  secondary_stat_total: number;
  race_modifier: number;
  birthplace_modifier: number;
  talent_bonus: number;
  special_modifier: number;
  gm_bonus?: number;
  temp_modifier?: number;
}

export interface TraitRow {
  trait_id: string;
  ranks_value: number;
  stat_value: number;
  race_modifier: number;
  birthplace_modifier: number;
  talent_bonus: number;
  special_modifier: number;
  total: number;
}

export function computeTraitRow(input: TraitRowInput): TraitRow {
  const ranksValue = ranksValueTrait(input.ranks);
  const statValue = input.primary_stat_total + input.secondary_stat_total;
  const total =
    ranksValue +
    input.race_modifier +
    input.birthplace_modifier +
    statValue +
    input.talent_bonus +
    input.special_modifier +
    (input.gm_bonus ?? 0) +
    (input.temp_modifier ?? 0);
  return {
    trait_id: input.trait_id,
    ranks_value: ranksValue,
    stat_value: statValue,
    race_modifier: input.race_modifier,
    birthplace_modifier: input.birthplace_modifier,
    talent_bonus: input.talent_bonus,
    special_modifier: input.special_modifier,
    total,
  };
}

// Categories, skills, and weapons all share the skill rank curve and the
// (ranks_value + stat_value + talent_bonus + special_modifier + activity)
// summation. The natural value used for weapon affinity transfers is the
// total before any cross-weapon comparison; see weapon-affinity.ts.
export interface SkillLikeRowInput {
  ranks: number;
  stat_value: number;
  talent_bonus?: number;
  special_modifier?: number;
  activity_modifier?: number;
  category_bonus?: number;
}

export interface SkillLikeRow {
  ranks_value: number;
  stat_value: number;
  category_bonus: number;
  talent_bonus: number;
  special_modifier: number;
  activity_modifier: number;
  total: number;
}

export function computeSkillLikeRow(input: SkillLikeRowInput): SkillLikeRow {
  const ranksValue = ranksValueSkill(input.ranks);
  const categoryBonus = input.category_bonus ?? 0;
  const talentBonus = input.talent_bonus ?? 0;
  const specialModifier = input.special_modifier ?? 0;
  const activityModifier = input.activity_modifier ?? 0;
  const total =
    ranksValue +
    input.stat_value +
    categoryBonus +
    talentBonus +
    specialModifier +
    activityModifier;
  return {
    ranks_value: ranksValue,
    stat_value: input.stat_value,
    category_bonus: categoryBonus,
    talent_bonus: talentBonus,
    special_modifier: specialModifier,
    activity_modifier: activityModifier,
    total,
  };
}
