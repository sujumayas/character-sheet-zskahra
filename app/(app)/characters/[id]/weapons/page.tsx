import { notFound } from "next/navigation";

import { loadCharacterAdolescentGrants } from "@/lib/data/character-adolescent-grants";
import {
  ensureWeaponPoolChoice,
  loadPendingChoices,
} from "@/lib/data/character-pending-choices";
import { loadCharacterTalentBonuses } from "@/lib/data/character-talent-bonuses";
import { aggregateCharacterDp } from "@/lib/domain/dp-budget";
import type { LevelTier } from "@/lib/domain/progression";
import { createClient } from "@/lib/supabase/server";

import { WeaponsEditor } from "./weapons-editor";

export default async function WeaponsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: character },
    { data: description },
    { data: weapons },
    { data: weaponAffinity },
    { data: characterWeaponSkill },
    { data: categories },
    { data: characterCategories },
    { data: stats },
    { data: characterStats },
    { data: statCostRules },
    { data: levelProgression },
  ] = await Promise.all([
    supabase
      .from("characters")
      .select("id, level, has_profession_adaptability")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("character_description")
      .select("race_id, birthplace_id")
      .eq("character_id", id)
      .maybeSingle(),
    supabase
      .from("weapons")
      .select("id, name, category_id, stat_id")
      .order("name"),
    supabase
      .from("weapon_affinity")
      .select("source_weapon_id, target_weapon_id, affinity_modifier"),
    supabase
      .from("character_weapon_skill")
      .select(
        "id, weapon_id, ranks, dp_allocated, talent_bonus, special_bonus, activity_modifier, adolescent_ranks, package_ranks",
      )
      .eq("character_id", id),
    supabase
      .from("categories")
      .select("id, name, stat_id, category_group")
      .order("name"),
    supabase
      .from("character_categories")
      .select("category_id, ranks")
      .eq("character_id", id),
    supabase.from("stats").select("id, code, name"),
    supabase
      .from("character_stats")
      .select("stat_id, stat_bonus, special_modifier")
      .eq("character_id", id),
    supabase.from("stat_cost_rules").select("stat_total, dp_cost"),
    supabase
      .from("level_progression")
      .select("level, min_total_dp, max_total_dp"),
  ]);

  if (!character) notFound();

  const tiers: LevelTier[] = (levelProgression ?? []).map((t) => ({
    level: t.level,
    min_total_dp: t.min_total_dp,
    max_total_dp: t.max_total_dp ?? Number.MAX_SAFE_INTEGER,
  }));
  const dpBudget = await aggregateCharacterDp(supabase, id, tiers, {
    hasProfessionAdaptability: character.has_profession_adaptability,
  });

  // Materialize the persistent weapon-pool choice from the current
  // birthplace (idempotent UPSERT). The editor reads `ranks_total` from
  // this table — `ensure...` keeps it coherent if the player changed
  // birthplace since their last visit.
  await ensureWeaponPoolChoice(supabase, id);
  const pendingChoices = await loadPendingChoices(supabase, id);
  const weaponPool = pendingChoices.get("weapon_pool") ?? null;

  const raceId = description?.race_id ?? null;
  const birthplaceId = description?.birthplace_id ?? null;

  const [
    { data: raceStatMods },
    { data: bpStatMods },
    talentBonuses,
    adolescentGrants,
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
    loadCharacterTalentBonuses(supabase, id),
    loadCharacterAdolescentGrants(supabase, id),
  ]);

  return (
    <WeaponsEditor
      characterId={id}
      character={character}
      weapons={weapons ?? []}
      weaponAffinity={weaponAffinity ?? []}
      characterWeaponSkill={characterWeaponSkill ?? []}
      categories={categories ?? []}
      characterCategories={characterCategories ?? []}
      stats={stats ?? []}
      characterStats={characterStats ?? []}
      raceStatMods={raceStatMods ?? []}
      bpStatMods={bpStatMods ?? []}
      statCostRules={statCostRules ?? []}
      levelProgression={levelProgression ?? []}
      talentStatBonuses={Array.from(talentBonuses.stat.entries())}
      talentWeaponBonuses={Array.from(talentBonuses.weapon.entries())}
      adolescentCategoryGrants={Array.from(adolescentGrants.category.entries())}
      adolescentWeaponPoolRanks={weaponPool?.ranks_total ?? 0}
      adolescentWeaponPoolBreakdown={adolescentGrants.weapon_pool_breakdown}
      pendingWeaponPool={
        weaponPool
          ? { id: weaponPool.id, ranksTotal: weaponPool.ranks_total }
          : null
      }
      dpBudget={{
        totalEarned: dpBudget.totalEarned,
        totalSpent: dpBudget.totalSpent,
        thisBucketSpent: dpBudget.byBucket.weapons,
        derivedLevel: dpBudget.derivedLevel,
      }}
    />
  );
}
