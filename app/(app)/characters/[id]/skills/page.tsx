import { notFound } from "next/navigation";

import { loadCharacterAdolescentGrants } from "@/lib/data/character-adolescent-grants";
import { loadCharacterTalentBonuses } from "@/lib/data/character-talent-bonuses";
import { aggregateCharacterDp } from "@/lib/domain/dp-budget";
import type { LevelTier } from "@/lib/domain/progression";
import { createClient } from "@/lib/supabase/server";

import { SkillsEditor } from "./skills-editor";

export default async function SkillsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: character },
    { data: description },
    { data: skills },
    { data: characterSkills },
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
      .from("skills")
      .select(
        "id, name, category_id, stat_id, is_custom, allows_specialization, description, character_id",
      )
      .or(`character_id.is.null,character_id.eq.${id}`)
      .order("name"),
    supabase
      .from("character_skills")
      .select(
        "id, skill_id, ranks, dp_allocated, talent_bonus, special_bonus, activity_modifier",
      )
      .eq("character_id", id),
    supabase
      .from("categories")
      .select("id, name, stat_id, category_group")
      .order("name"),
    supabase
      .from("character_categories")
      .select(
        "category_id, ranks, talent_bonus, special_modifier, activity_modifier",
      )
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
    <SkillsEditor
      characterId={id}
      character={character}
      skills={skills ?? []}
      characterSkills={characterSkills ?? []}
      categories={categories ?? []}
      characterCategories={characterCategories ?? []}
      stats={stats ?? []}
      characterStats={characterStats ?? []}
      raceStatMods={raceStatMods ?? []}
      bpStatMods={bpStatMods ?? []}
      statCostRules={statCostRules ?? []}
      levelProgression={levelProgression ?? []}
      talentStatBonuses={Array.from(talentBonuses.stat.entries())}
      talentSkillBonuses={Array.from(talentBonuses.skill.entries())}
      adolescentSkillGrants={Array.from(adolescentGrants.skill.entries())}
      adolescentCategoryGrants={Array.from(adolescentGrants.category.entries())}
      dpBudget={{
        totalEarned: dpBudget.totalEarned,
        totalSpent: dpBudget.totalSpent,
        thisBucketSpent: dpBudget.byBucket.skills,
        derivedLevel: dpBudget.derivedLevel,
      }}
    />
  );
}
