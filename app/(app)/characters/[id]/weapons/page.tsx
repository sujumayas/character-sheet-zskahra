import { notFound } from "next/navigation";

import { loadCharacterTalentBonuses } from "@/lib/data/character-talent-bonuses";
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

  const raceId = description?.race_id ?? null;
  const birthplaceId = description?.birthplace_id ?? null;

  const [{ data: raceStatMods }, { data: bpStatMods }, talentBonuses] =
    await Promise.all([
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
    />
  );
}
