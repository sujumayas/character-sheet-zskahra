import { notFound } from "next/navigation";

import { aggregateCharacterDp } from "@/lib/domain/dp-budget";
import type { LevelTier } from "@/lib/domain/progression";
import { createClient } from "@/lib/supabase/server";

import { TalentsEditor } from "./talents-editor";

export default async function TalentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: character }, { data: description }] = await Promise.all([
    supabase
      .from("characters")
      .select("id, level, has_profession_adaptability")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("character_description")
      .select("race_id")
      .eq("character_id", id)
      .maybeSingle(),
  ]);

  if (!character) notFound();
  const raceId = description?.race_id ?? null;

  const [
    { data: talents },
    { data: characterTalents },
    { data: characterTalentChoices },
    { data: requirements },
    { data: stats },
    { data: categories },
    { data: skills },
    { data: weapons },
    { data: raceTalents },
  ] = await Promise.all([
    supabase
      .from("talents")
      .select(
        "id, name, talent_type, cost, description, is_level_1_only, max_times_per_character, requires_dm_approval",
      )
      .eq("is_active", true)
      .order("name"),
    supabase
      .from("character_talents")
      .select(
        "id, talent_id, times_taken, acquired_level, approved_by_dm, is_active, notes",
      )
      .eq("character_id", id),
    supabase
      .from("character_talent_choices")
      .select(
        "id, character_talent_id, choice_type, stat_id, category_id, skill_id, weapon_id, bonus, notes",
      ),
    supabase
      .from("talent_requirements")
      .select("talent_id, target_name, operator, required_value"),
    supabase.from("stats").select("id, code, name").order("name"),
    supabase
      .from("categories")
      .select("id, name, category_group")
      .order("name"),
    supabase
      .from("skills")
      .select("id, name, character_id")
      .or(`character_id.is.null,character_id.eq.${id}`)
      .order("name"),
    supabase.from("weapons").select("id, name").order("name"),
    raceId
      ? supabase
          .from("race_talents")
          .select("talent_id")
          .eq("race_id", raceId)
      : Promise.resolve({ data: [] }),
  ]);

  const ctIds = new Set((characterTalents ?? []).map((ct) => ct.id));
  const scopedChoices = (characterTalentChoices ?? []).filter((c) =>
    ctIds.has(c.character_talent_id),
  );

  const { data: levelProgression } = await supabase
    .from("level_progression")
    .select("level, min_total_dp, max_total_dp");
  const tiers: LevelTier[] = (levelProgression ?? []).map((t) => ({
    level: t.level,
    min_total_dp: t.min_total_dp,
    max_total_dp: t.max_total_dp ?? Number.MAX_SAFE_INTEGER,
  }));
  const dpBudget = await aggregateCharacterDp(supabase, id, tiers, {
    hasProfessionAdaptability: character.has_profession_adaptability,
  });

  return (
    <TalentsEditor
      characterId={id}
      character={character}
      talents={talents ?? []}
      characterTalents={characterTalents ?? []}
      characterTalentChoices={scopedChoices}
      talentRequirements={requirements ?? []}
      raceTalentIds={(raceTalents ?? []).map((r) => r.talent_id)}
      stats={stats ?? []}
      categories={categories ?? []}
      skills={skills ?? []}
      weapons={weapons ?? []}
      dpBudget={{
        totalEarned: dpBudget.totalEarned,
        totalSpent: dpBudget.totalSpent,
        thisBucketSpent: dpBudget.byBucket.talents,
        derivedLevel: dpBudget.derivedLevel,
      }}
    />
  );
}
