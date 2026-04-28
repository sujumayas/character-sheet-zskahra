import { notFound } from "next/navigation";

import { loadCharacterAdolescentGrants } from "@/lib/data/character-adolescent-grants";
import { loadCharacterTalentBonuses } from "@/lib/data/character-talent-bonuses";
import { createClient } from "@/lib/supabase/server";

import { StatsEditor } from "./stats-editor";

export default async function StatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: character },
    { data: description },
    { data: chaos },
    { data: lifePoints },
    { data: characterStats },
    { data: characterTraits },
    { data: stats },
    { data: traits },
    { data: races },
    { data: birthplaces },
    { data: professions },
    { data: statProgression },
  ] = await Promise.all([
    supabase
      .from("characters")
      .select(
        "id, name, character_name, player_name, level, status, has_profession_adaptability",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("character_description")
      .select(
        "race_id, profession_id, birthplace_id, sex_id, age, height_cm, weight_kg, appearance_roll, appearance, appearance_notes, description_notes, fate_points",
      )
      .eq("character_id", id)
      .maybeSingle(),
    supabase
      .from("character_chaos")
      .select(
        "chaos_index, chaos_track, chaos_dice, chaos_power_calculator, notes",
      )
      .eq("character_id", id)
      .maybeSingle(),
    supabase
      .from("character_life_points")
      .select(
        "current_life_points, dm_activity_modifier, has_activity_penalty_reduction, notes",
      )
      .eq("character_id", id)
      .maybeSingle(),
    supabase
      .from("character_stats")
      .select("id, stat_id, base_value, stat_bonus, race_modifier, special_modifier")
      .eq("character_id", id),
    supabase
      .from("character_traits")
      .select(
        "id, trait_id, ranks, special_modifier, talent_bonus, gm_bonus, temp_modifier",
      )
      .eq("character_id", id),
    supabase.from("stats").select("id, code, name"),
    supabase
      .from("traits")
      .select("id, name, primary_stat_id, secondary_stat_id"),
    supabase.from("races").select("id, name").order("name"),
    supabase.from("birthplaces").select("id, name").order("name"),
    supabase.from("professions").select("id, name").order("name"),
    supabase.from("stat_progression").select("stat_value, bonus"),
  ]);

  if (!character) notFound();

  const raceId = description?.race_id ?? null;
  const birthplaceId = description?.birthplace_id ?? null;

  const [
    { data: raceStatMods },
    { data: raceTraitMods },
    { data: bpStatMods },
    { data: bpTraitMods },
    { data: raceSexes },
    { data: raceAgeRanges },
    { data: raceHeightRanges },
    { data: raceWeightRanges },
    talentBonuses,
    adolescentGrants,
  ] = await Promise.all([
    raceId
      ? supabase
          .from("race_stat_modifiers")
          .select("stat_id, modifier_value")
          .eq("race_id", raceId)
      : Promise.resolve({ data: [] }),
    raceId
      ? supabase
          .from("race_trait_modifiers")
          .select("trait_id, modifier_value")
          .eq("race_id", raceId)
      : Promise.resolve({ data: [] }),
    birthplaceId
      ? supabase
          .from("birthplace_stat_modifiers")
          .select("stat_id, modifier_value")
          .eq("birthplace_id", birthplaceId)
      : Promise.resolve({ data: [] }),
    birthplaceId
      ? supabase
          .from("birthplace_trait_modifiers")
          .select("trait_id, modifier_value")
          .eq("birthplace_id", birthplaceId)
      : Promise.resolve({ data: [] }),
    raceId
      ? supabase
          .from("race_sexes")
          .select("id, name, race_id")
          .eq("race_id", raceId)
          .order("name")
      : Promise.resolve({ data: [] }),
    raceId
      ? supabase
          .from("race_age_ranges")
          .select("min_age, max_age")
          .eq("race_id", raceId)
      : Promise.resolve({ data: [] }),
    raceId
      ? supabase
          .from("race_height_ranges")
          .select("min_height_cm, max_height_cm")
          .eq("race_id", raceId)
      : Promise.resolve({ data: [] }),
    raceId
      ? supabase
          .from("race_weight_ranges")
          .select("min_weight_kg, max_weight_kg")
          .eq("race_id", raceId)
      : Promise.resolve({ data: [] }),
    loadCharacterTalentBonuses(supabase, id),
    loadCharacterAdolescentGrants(supabase, id),
  ]);

  // Aggregate race ranges across all life_stages and sexes — most permissive
  // bounds so the user can enter any valid value for the race regardless of
  // current life stage / sex selection.
  function aggregateRange(
    rows: ReadonlyArray<Record<string, unknown>> | null,
    minKey: string,
    maxKey: string,
  ): { min: number; max: number } | null {
    if (!rows || rows.length === 0) return null;
    let min = Infinity;
    let max = -Infinity;
    for (const r of rows) {
      const lo = r[minKey];
      const hi = r[maxKey];
      if (typeof lo === "number" && lo < min) min = lo;
      if (typeof hi === "number" && hi > max) max = hi;
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return { min, max };
  }
  const ageRange = aggregateRange(raceAgeRanges, "min_age", "max_age");
  const heightRange = aggregateRange(
    raceHeightRanges,
    "min_height_cm",
    "max_height_cm",
  );
  const weightRange = aggregateRange(
    raceWeightRanges,
    "min_weight_kg",
    "max_weight_kg",
  );

  return (
    <StatsEditor
      characterId={id}
      character={character}
      description={description}
      chaos={chaos}
      lifePoints={lifePoints}
      characterStats={characterStats ?? []}
      characterTraits={characterTraits ?? []}
      stats={stats ?? []}
      traits={traits ?? []}
      races={races ?? []}
      birthplaces={birthplaces ?? []}
      professions={professions ?? []}
      raceSexes={raceSexes ?? []}
      raceStatMods={raceStatMods ?? []}
      raceTraitMods={raceTraitMods ?? []}
      bpStatMods={bpStatMods ?? []}
      bpTraitMods={bpTraitMods ?? []}
      statProgression={statProgression ?? []}
      talentStatBonuses={Array.from(talentBonuses.stat.entries())}
      talentTraitBonuses={Array.from(talentBonuses.trait.entries())}
      adolescentTraitGrants={Array.from(adolescentGrants.trait.entries())}
      ageRange={ageRange}
      heightRange={heightRange}
      weightRange={weightRange}
    />
  );
}
