import { notFound } from "next/navigation";

import { loadCharacterAdolescentGrants } from "@/lib/data/character-adolescent-grants";
import { loadCharacterTalentBonuses } from "@/lib/data/character-talent-bonuses";
import {
  computeSkillLikeRow,
  computeStatRow,
  computeTraitRow,
} from "@/lib/domain/modifiers";
import { ranksValueSkill } from "@/lib/domain/rules";
import { createClient } from "@/lib/supabase/server";

import { PlayDashboard } from "./play-dashboard";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: character },
    { data: description },
    { data: lifePoints },
    { data: stats },
    { data: characterStats },
    { data: traits },
    { data: characterTraits },
    { data: categories },
    { data: characterCategories },
    { data: skills },
    { data: characterSkills },
    { data: gameValues },
    { data: characterGameValues },
    { data: characterChaos },
    { data: activityRules },
  ] = await Promise.all([
    supabase
      .from("characters")
      .select("id")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("character_description")
      .select("race_id, birthplace_id, fate_points")
      .eq("character_id", id)
      .maybeSingle(),
    supabase
      .from("character_life_points")
      .select(
        "current_life_points, dm_activity_modifier, has_activity_penalty_reduction",
      )
      .eq("character_id", id)
      .maybeSingle(),
    supabase.from("stats").select("id, code, name"),
    supabase
      .from("character_stats")
      .select("stat_id, stat_bonus, special_modifier"),
    supabase
      .from("traits")
      .select("id, name, primary_stat_id, secondary_stat_id"),
    supabase
      .from("character_traits")
      .select(
        "trait_id, ranks, special_modifier, talent_bonus, gm_bonus, temp_modifier",
      )
      .eq("character_id", id),
    supabase
      .from("categories")
      .select("id, name, stat_id, category_group"),
    supabase
      .from("character_categories")
      .select(
        "category_id, ranks, talent_bonus, special_modifier, activity_modifier",
      )
      .eq("character_id", id),
    supabase
      .from("skills")
      .select("id, name, category_id, stat_id")
      .or(`character_id.is.null,character_id.eq.${id}`),
    supabase
      .from("character_skills")
      .select(
        "skill_id, ranks, talent_bonus, special_bonus, activity_modifier",
      )
      .eq("character_id", id),
    supabase.from("game_values").select("id, code, name"),
    supabase
      .from("character_game_values")
      .select("game_value_id, base_value, total_value")
      .eq("character_id", id),
    supabase
      .from("character_chaos")
      .select(
        "chaos_index, chaos_track, chaos_dice, chaos_power_calculator, notes",
      )
      .eq("character_id", id)
      .maybeSingle(),
    supabase
      .from("life_activity_modifier_rules")
      .select("threshold_percent, modifier_value, applies_to, is_active")
      .eq("is_active", true)
      .eq("applies_to", "physical"),
  ]);

  if (!character) notFound();

  const raceId = description?.race_id ?? null;
  const birthplaceId = description?.birthplace_id ?? null;

  const [
    { data: raceStatMods },
    { data: bpStatMods },
    { data: raceTraitMods },
    { data: bpTraitMods },
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
    loadCharacterTalentBonuses(supabase, id),
    loadCharacterAdolescentGrants(supabase, id),
  ]);

  // ---- Computations ----

  const characterStatById = new Map(
    (characterStats ?? [])
      .filter((s): s is typeof s & { stat_id: string } => s.stat_id != null)
      .map((s) => [s.stat_id, s]),
  );
  const raceStatMod = new Map(
    (raceStatMods ?? []).map((m) => [m.stat_id, m.modifier_value] as const),
  );
  const bpStatMod = new Map(
    (bpStatMods ?? []).map((m) => [m.stat_id, m.modifier_value] as const),
  );

  const statTotals = new Map<string, { code: string; total: number }>();
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
    statTotals.set(s.id, { code: s.code ?? s.name, total: row.total });
  }

  const coStat = (stats ?? []).find(
    (s) => (s.code ?? "").toLowerCase() === "co",
  );
  const coBonus = coStat
    ? (characterStats ?? []).find((cs) => cs.stat_id === coStat.id)
        ?.stat_bonus ?? 0
    : 0;
  const deathThreshold = -Math.abs(coBonus);

  // Trait totals
  const raceTraitMod = new Map(
    (raceTraitMods ?? []).map((m) => [m.trait_id, m.modifier_value] as const),
  );
  const bpTraitMod = new Map(
    (bpTraitMods ?? []).map((m) => [m.trait_id, m.modifier_value] as const),
  );
  const characterTraitById = new Map(
    (characterTraits ?? []).map((t) => [t.trait_id, t]),
  );
  const traitTotals = new Map<string, number>();
  for (const t of traits ?? []) {
    const ct = characterTraitById.get(t.id);
    const primaryStat =
      t.primary_stat_id != null
        ? statTotals.get(t.primary_stat_id)?.total ?? 0
        : 0;
    const secondaryStat =
      t.secondary_stat_id != null
        ? statTotals.get(t.secondary_stat_id)?.total ?? 0
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
    traitTotals.set(t.name, row.total);
  }

  // Category + skill totals
  const characterCategoryById = new Map(
    (characterCategories ?? []).map((c) => [c.category_id, c]),
  );
  const adolCategoryRanks = new Map(
    Array.from(adolescentGrants.category.entries()),
  );
  const categoryTotalById = new Map<string, number>();
  for (const c of categories ?? []) {
    const cc = characterCategoryById.get(c.id);
    const playerRanks = cc?.ranks ?? 0;
    const adol = adolCategoryRanks.get(c.id) ?? 0;
    const ranksValue = ranksValueSkill(playerRanks + adol);
    const statValue =
      c.stat_id != null ? statTotals.get(c.stat_id)?.total ?? 0 : 0;
    const talent =
      (cc?.talent_bonus ?? 0) + (talentBonuses.category.get(c.id) ?? 0);
    const special = cc?.special_modifier ?? 0;
    const activity = cc?.activity_modifier ?? 0;
    const total = ranksValue + statValue + talent + special + activity;
    categoryTotalById.set(c.id, total);
  }

  const characterSkillById = new Map(
    (characterSkills ?? []).map((s) => [s.skill_id, s]),
  );
  const adolSkillRanks = new Map(
    Array.from(adolescentGrants.skill.entries()),
  );
  const skillTotalById = new Map<string, number>();
  for (const s of skills ?? []) {
    if (!s.id) continue;
    const cs = characterSkillById.get(s.id);
    const playerRanks = cs?.ranks ?? 0;
    const adol = adolSkillRanks.get(s.id) ?? 0;
    const statValue =
      s.stat_id != null ? statTotals.get(s.stat_id)?.total ?? 0 : 0;
    const categoryBonus =
      s.category_id != null ? categoryTotalById.get(s.category_id) ?? 0 : 0;
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
  }

  // Group skills under their categories. Limit to 'General' category_group
  // (Traits live in the top readout; Weapons have their own tab).
  const generalCategories = (categories ?? []).filter(
    (c) => c.category_group === "General",
  );
  const skillsByCategoryId = new Map<string, Array<{ id: string; name: string }>>();
  for (const s of skills ?? []) {
    if (!s.category_id) continue;
    const arr = skillsByCategoryId.get(s.category_id) ?? [];
    arr.push({ id: s.id, name: s.name });
    skillsByCategoryId.set(s.category_id, arr);
  }
  const skillGroups = generalCategories
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({
      id: c.id,
      name: c.name,
      total: categoryTotalById.get(c.id) ?? 0,
      skills: (skillsByCategoryId.get(c.id) ?? [])
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((s) => ({
          id: s.id,
          name: s.name,
          total: skillTotalById.get(s.id) ?? 0,
        })),
    }));

  // Game-value rows (for inline editing)
  const gameValueByCode = new Map((gameValues ?? []).map((g) => [g.code, g]));
  const characterGameValueById = new Map(
    (characterGameValues ?? []).map((g) => [g.game_value_id, g]),
  );

  function gameValueState(code: string) {
    const def = gameValueByCode.get(code);
    if (!def) return null;
    const row = characterGameValueById.get(def.id);
    return {
      gameValueId: def.id,
      base: row?.base_value ?? 0,
      total: row?.total_value ?? row?.base_value ?? 0,
      label: def.name,
    };
  }

  return (
    <PlayDashboard
      characterId={id}
      hasDescriptionRow={description != null}
      hasLifePointsRow={lifePoints != null}
      hasChaosRow={characterChaos != null}
      fatePoints={description?.fate_points ?? 0}
      currentLp={lifePoints?.current_life_points ?? null}
      maxLp={traitTotals.get("Endurance") ?? 0}
      permanentMod={lifePoints?.dm_activity_modifier ?? 0}
      activityRules={(activityRules ?? []).map((r) => ({
        threshold_percent: Number(r.threshold_percent),
        modifier_value: r.modifier_value,
      }))}
      deathThreshold={deathThreshold}
      stats={Array.from(statTotals.entries()).map(([id, v]) => ({
        id,
        code: v.code,
        total: v.total,
      }))}
      traitsReadout={[
        { name: "General Knowledge", total: traitTotals.get("General Knowledge") ?? 0 },
        { name: "RR Will", total: traitTotals.get("RR Will") ?? 0 },
        { name: "RR Stamina", total: traitTotals.get("RR Stamina") ?? 0 },
        { name: "RR Magic", total: traitTotals.get("RR Magic") ?? 0 },
      ]}
      skillGroups={skillGroups}
      chaos={{
        index: characterChaos?.chaos_index ?? 0,
        track: characterChaos?.chaos_track ?? 0,
        dice: characterChaos?.chaos_dice ?? 0,
        powerCalculator: characterChaos?.chaos_power_calculator ?? null,
      }}
      initiative={gameValueState("initiative")}
      combatPerception={gameValueState("combat_perception")}
      perceptionPassive={gameValueState("perception_passive")}
      perceptionActive={gameValueState("perception_active")}
      quickPerception={gameValueState("quick_perception")}
    />
  );
}
