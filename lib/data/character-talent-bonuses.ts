// Server-side loader. Pulls everything `aggregateTalentBonuses` needs for a
// single character and returns the 5 derived maps. Used by stats / categories
// / skills / weapons server components so each editor sees up-to-date talent
// contributions across navigations.

import {
  aggregateTalentBonuses,
  type TalentBonusMaps,
} from "@/lib/domain/talent-bonuses";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function loadCharacterTalentBonuses(
  supabase: SupabaseClient,
  characterId: string,
): Promise<TalentBonusMaps> {
  const { data: characterTalents } = await supabase
    .from("character_talents")
    .select("id, talent_id, is_active, times_taken")
    .eq("character_id", characterId);

  const ctList = characterTalents ?? [];
  if (ctList.length === 0) {
    return {
      stat: new Map(),
      trait: new Map(),
      category: new Map(),
      skill: new Map(),
      weapon: new Map(),
    };
  }

  const talentIds = Array.from(new Set(ctList.map((t) => t.talent_id)));
  const ctIds = ctList.map((t) => t.id);

  const [
    { data: statBonuses },
    { data: traitBonuses },
    { data: categoryBonuses },
    { data: skillBonuses },
    { data: weaponBonuses },
    { data: choices },
  ] = await Promise.all([
    supabase
      .from("talent_stat_bonuses")
      .select("talent_id, stat_id, bonus")
      .in("talent_id", talentIds),
    supabase
      .from("talent_trait_bonuses")
      .select("talent_id, trait_id, bonus")
      .in("talent_id", talentIds),
    supabase
      .from("talent_category_bonuses")
      .select("talent_id, category_id, bonus")
      .in("talent_id", talentIds),
    supabase
      .from("talent_skill_bonuses")
      .select("talent_id, skill_id, bonus")
      .in("talent_id", talentIds),
    supabase
      .from("talent_weapon_bonuses")
      .select("talent_id, weapon_id, bonus")
      .in("talent_id", talentIds),
    supabase
      .from("character_talent_choices")
      .select(
        "character_talent_id, choice_type, stat_id, category_id, skill_id, weapon_id, bonus",
      )
      .in("character_talent_id", ctIds),
  ]);

  return aggregateTalentBonuses({
    characterTalents: ctList.map((t) => ({
      id: t.id,
      talent_id: t.talent_id,
      is_active: t.is_active,
      times_taken: t.times_taken,
    })),
    statBonuses: (statBonuses ?? []).map((r) => ({
      talent_id: r.talent_id,
      target_id: r.stat_id,
      bonus: r.bonus,
    })),
    traitBonuses: (traitBonuses ?? []).map((r) => ({
      talent_id: r.talent_id,
      target_id: r.trait_id,
      bonus: r.bonus,
    })),
    categoryBonuses: (categoryBonuses ?? []).map((r) => ({
      talent_id: r.talent_id,
      target_id: r.category_id,
      bonus: r.bonus,
    })),
    skillBonuses: (skillBonuses ?? []).map((r) => ({
      talent_id: r.talent_id,
      target_id: r.skill_id,
      bonus: r.bonus,
    })),
    weaponBonuses: (weaponBonuses ?? []).map((r) => ({
      talent_id: r.talent_id,
      target_id: r.weapon_id,
      bonus: r.bonus,
    })),
    choices: choices ?? [],
  });
}

// Helper to flatten a Map<string, number> into a plain array shape that's
// trivially JSON-serializable across the Server→Client boundary.
export type TalentBonusEntries = ReadonlyArray<readonly [string, number]>;

export function entriesFromMap(m: Map<string, number>): TalentBonusEntries {
  return Array.from(m.entries());
}
