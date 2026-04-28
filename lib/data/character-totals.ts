// Server-side aggregator that computes a character's full set of derived
// totals — stat, category, skill, trait — by replaying the rank/cost pipeline
// against the database. Used by Combat Dashboard, Equipment, Play, and any
// other surface that needs to read "what is the character's Perception
// Active total right now". Centralized so we don't have N copies of this
// pipeline drifting from each other.
//
// Read-only. Returns Maps keyed by id.

import type { SupabaseClient } from "@supabase/supabase-js";

import { loadCharacterAdolescentGrants } from "@/lib/data/character-adolescent-grants";
import { loadCharacterTalentBonuses } from "@/lib/data/character-talent-bonuses";
import {
  computeSkillLikeRow,
  computeStatRow,
  computeTraitRow,
} from "@/lib/domain/modifiers";
import { ranksValueSkill } from "@/lib/domain/rules";

export interface CharacterTotals {
  statTotalById: Map<string, number>;
  statTotalByCode: Map<string, number>;
  categoryTotalById: Map<string, number>;
  skillTotalById: Map<string, number>;
  skillTotalByName: Map<string, number>;
  traitTotalByName: Map<string, number>;
}

const EMPTY: CharacterTotals = {
  statTotalById: new Map(),
  statTotalByCode: new Map(),
  categoryTotalById: new Map(),
  skillTotalById: new Map(),
  skillTotalByName: new Map(),
  traitTotalByName: new Map(),
};

export async function loadCharacterTotals(
  supabase: SupabaseClient,
  characterId: string,
): Promise<CharacterTotals> {
  const [
    { data: description },
    { data: stats },
    { data: characterStats },
    { data: traits },
    { data: characterTraits },
    { data: categories },
    { data: characterCategories },
    { data: skills },
    { data: characterSkills },
    talentBonuses,
    adolescentGrants,
  ] = await Promise.all([
    supabase
      .from("character_description")
      .select("race_id, birthplace_id")
      .eq("character_id", characterId)
      .maybeSingle(),
    supabase.from("stats").select("id, code, name"),
    supabase
      .from("character_stats")
      .select("stat_id, stat_bonus, special_modifier")
      .eq("character_id", characterId),
    supabase
      .from("traits")
      .select("id, name, primary_stat_id, secondary_stat_id"),
    supabase
      .from("character_traits")
      .select(
        "trait_id, ranks, special_modifier, talent_bonus, gm_bonus, temp_modifier",
      )
      .eq("character_id", characterId),
    supabase
      .from("categories")
      .select("id, name, stat_id, category_group"),
    supabase
      .from("character_categories")
      .select(
        "category_id, ranks, talent_bonus, special_modifier, activity_modifier",
      )
      .eq("character_id", characterId),
    supabase
      .from("skills")
      .select("id, name, category_id, stat_id")
      .or(`character_id.is.null,character_id.eq.${characterId}`),
    supabase
      .from("character_skills")
      .select(
        "skill_id, ranks, talent_bonus, special_bonus, activity_modifier",
      )
      .eq("character_id", characterId),
    loadCharacterTalentBonuses(supabase, characterId),
    loadCharacterAdolescentGrants(supabase, characterId),
  ]);

  if (!description && !stats?.length) return EMPTY;

  const raceId = description?.race_id ?? null;
  const birthplaceId = description?.birthplace_id ?? null;

  const [
    { data: raceStatMods },
    { data: bpStatMods },
    { data: raceTraitMods },
    { data: bpTraitMods },
  ] = await Promise.all([
    raceId
      ? supabase
          .from("race_stat_modifiers")
          .select("stat_id, modifier_value")
          .eq("race_id", raceId)
      : Promise.resolve({ data: [] }),
    birthplaceId
      ? supabase
          .from("birthplace_stat_modifiers")
          .select("stat_id, modifier_value")
          .eq("birthplace_id", birthplaceId)
      : Promise.resolve({ data: [] }),
    raceId
      ? supabase
          .from("race_trait_modifiers")
          .select("trait_id, modifier_value")
          .eq("race_id", raceId)
      : Promise.resolve({ data: [] }),
    birthplaceId
      ? supabase
          .from("birthplace_trait_modifiers")
          .select("trait_id, modifier_value")
          .eq("birthplace_id", birthplaceId)
      : Promise.resolve({ data: [] }),
  ]);

  const characterStatById = new Map(
    (characterStats ?? [])
      .filter((s): s is typeof s & { stat_id: string } => s.stat_id != null)
      .map((s) => [s.stat_id, s]),
  );
  const raceStatMod = new Map(
    (raceStatMods ?? []).map(
      (m) => [m.stat_id, m.modifier_value] as const,
    ),
  );
  const bpStatMod = new Map(
    (bpStatMods ?? []).map((m) => [m.stat_id, m.modifier_value] as const),
  );

  const statTotalById = new Map<string, number>();
  const statTotalByCode = new Map<string, number>();
  for (const s of stats ?? []) {
    const cs = characterStatById.get(s.id);
    const row = computeStatRow({
      stat_id: s.id,
      stat_bonus: cs?.stat_bonus ?? 0,
      race_modifier:
        (raceStatMod.get(s.id) ?? 0) + (bpStatMod.get(s.id) ?? 0),
      special_modifier: cs?.special_modifier ?? 0,
      talent_bonus: talentBonuses.stat.get(s.id) ?? 0,
    });
    statTotalById.set(s.id, row.total);
    if (s.code) statTotalByCode.set(s.code.toLowerCase(), row.total);
  }

  // Traits
  const raceTraitMod = new Map(
    (raceTraitMods ?? []).map(
      (m) => [m.trait_id, m.modifier_value] as const,
    ),
  );
  const bpTraitMod = new Map(
    (bpTraitMods ?? []).map(
      (m) => [m.trait_id, m.modifier_value] as const,
    ),
  );
  const characterTraitById = new Map(
    (characterTraits ?? []).map((t) => [t.trait_id, t]),
  );
  const traitTotalByName = new Map<string, number>();
  for (const t of traits ?? []) {
    const ct = characterTraitById.get(t.id);
    const primaryStat =
      t.primary_stat_id != null
        ? statTotalById.get(t.primary_stat_id) ?? 0
        : 0;
    const secondaryStat =
      t.secondary_stat_id != null
        ? statTotalById.get(t.secondary_stat_id) ?? 0
        : 0;
    const row = computeTraitRow({
      trait_id: t.id,
      ranks: ct?.ranks ?? 0,
      primary_stat_total: primaryStat,
      secondary_stat_total: secondaryStat,
      race_modifier: raceTraitMod.get(t.id) ?? 0,
      birthplace_modifier: bpTraitMod.get(t.id) ?? 0,
      talent_bonus:
        (ct?.talent_bonus ?? 0) + (talentBonuses.trait.get(t.id) ?? 0),
      special_modifier: ct?.special_modifier ?? 0,
      gm_bonus: ct?.gm_bonus ?? 0,
      temp_modifier: ct?.temp_modifier ?? 0,
    });
    traitTotalByName.set(t.name, row.total);
  }

  // Categories
  const characterCategoryById = new Map(
    (characterCategories ?? []).map((c) => [c.category_id, c]),
  );
  const adolCategoryRanks = adolescentGrants.category;
  const categoryTotalById = new Map<string, number>();
  for (const c of categories ?? []) {
    const cc = characterCategoryById.get(c.id);
    const playerRanks = cc?.ranks ?? 0;
    const adol = adolCategoryRanks.get(c.id) ?? 0;
    const ranksValue = ranksValueSkill(playerRanks + adol);
    const statValue =
      c.stat_id != null ? statTotalById.get(c.stat_id) ?? 0 : 0;
    const talent =
      (cc?.talent_bonus ?? 0) + (talentBonuses.category.get(c.id) ?? 0);
    const special = cc?.special_modifier ?? 0;
    const activity = cc?.activity_modifier ?? 0;
    categoryTotalById.set(
      c.id,
      ranksValue + statValue + talent + special + activity,
    );
  }

  // Skills
  const characterSkillById = new Map(
    (characterSkills ?? []).map((s) => [s.skill_id, s]),
  );
  const adolSkillRanks = adolescentGrants.skill;
  const skillTotalById = new Map<string, number>();
  const skillTotalByName = new Map<string, number>();
  for (const s of skills ?? []) {
    if (!s.id) continue;
    const cs = characterSkillById.get(s.id);
    const playerRanks = cs?.ranks ?? 0;
    const adol = adolSkillRanks.get(s.id) ?? 0;
    const statValue =
      s.stat_id != null ? statTotalById.get(s.stat_id) ?? 0 : 0;
    const categoryBonus =
      s.category_id != null
        ? categoryTotalById.get(s.category_id) ?? 0
        : 0;
    const row = computeSkillLikeRow({
      ranks: playerRanks + adol,
      stat_value: statValue,
      talent_bonus:
        (cs?.talent_bonus ?? 0) + (talentBonuses.skill.get(s.id) ?? 0),
      special_modifier: cs?.special_bonus ?? 0,
      activity_modifier: cs?.activity_modifier ?? 0,
      category_bonus: categoryBonus,
    });
    skillTotalById.set(s.id, row.total);
    skillTotalByName.set(s.name, row.total);
  }

  return {
    statTotalById,
    statTotalByCode,
    categoryTotalById,
    skillTotalById,
    skillTotalByName,
    traitTotalByName,
  };
}

/**
 * Convenience: looks up the "Wear Armor" skill total — the skill named
 * "Armor" inside the "Athletic Stamina" category. The DB has another skill
 * named "Armor" under "Crafting Lores" (smithing/lore); we explicitly
 * exclude it via the category filter.
 *
 * Returns 0 if the skill is missing or the character has no row for it.
 */
export async function loadWearArmorTotal(
  supabase: SupabaseClient,
  characterId: string,
): Promise<number> {
  const [totals, skillIdResult] = await Promise.all([
    loadCharacterTotals(supabase, characterId),
    findWearArmorSkillId(supabase, characterId),
  ]);
  if (!skillIdResult) return 0;
  return totals.skillTotalById.get(skillIdResult) ?? 0;
}

async function findWearArmorSkillId(
  supabase: SupabaseClient,
  characterId: string,
): Promise<string | null> {
  const { data: cats } = await supabase
    .from("categories")
    .select("id")
    .eq("name", "Athletic Stamina")
    .maybeSingle();
  if (!cats?.id) return null;
  const { data: rows } = await supabase
    .from("skills")
    .select("id")
    .eq("name", "Armor")
    .eq("category_id", cats.id)
    .or(`character_id.is.null,character_id.eq.${characterId}`)
    .maybeSingle();
  return rows?.id ?? null;
}
