import { notFound } from "next/navigation";

import { loadCharacterAdolescentGrants } from "@/lib/data/character-adolescent-grants";
import { loadCharacterTalentBonuses } from "@/lib/data/character-talent-bonuses";
import {
  derivedInitiative,
  quickPerception,
} from "@/lib/domain/combat";
import { armorTotals, computeArmorRow, computeShield } from "@/lib/domain/equipment";
import {
  computeSkillLikeRow,
  computeStatRow,
  computeTraitRow,
} from "@/lib/domain/modifiers";
import { ranksValueSkill } from "@/lib/domain/rules";
import { createClient } from "@/lib/supabase/server";

import { CombatDashboard } from "./combat-dashboard";

export default async function CombatPage({
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
    { data: weapons },
    { data: characterWeaponSkill },
    { data: gameValues },
    { data: characterGameValues },
    { data: armorTypes },
    { data: bodyParts },
    { data: shields },
    { data: characterArmor },
    { data: characterShield },
    { data: activityRules },
  ] = await Promise.all([
    supabase
      .from("characters")
      .select("id, level, has_profession_adaptability")
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
    supabase
      .from("weapons")
      .select("id, name, category_id, stat_id")
      .order("name"),
    supabase
      .from("character_weapon_skill")
      .select(
        "weapon_id, ranks, talent_bonus, special_bonus, activity_modifier, adolescent_ranks, package_ranks",
      )
      .eq("character_id", id),
    supabase.from("game_values").select("id, code, name"),
    supabase
      .from("character_game_values")
      .select("game_value_id, base_value, total_value")
      .eq("character_id", id),
    supabase
      .from("armor_types")
      .select(
        "id, name, full_armor_bonus, min_penalty, max_penalty, display_order",
      )
      .eq("is_active", true),
    supabase
      .from("body_parts")
      .select("id, name, percent_covered, display_order")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("shields")
      .select(
        "id, name, untrained_db, trained_db, crit_damage_type, crit_size_modifier, hits, weight_lb",
      )
      .eq("is_active", true),
    supabase
      .from("character_armor")
      .select("body_part_id, armor_type_id, crafting_multiplier")
      .eq("character_id", id),
    supabase
      .from("character_shield")
      .select("shield_id, special_bonus, is_trained, hits_used")
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

  // ---- Derived computations ----

  const statById = new Map((stats ?? []).map((s) => [s.id, s]));
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

  // Stat totals — needed for cost basis, dodge, perception, traits, skills.
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

  function statTotalByCode(code: string): number {
    for (const [, v] of statTotals) {
      if (v.code.toLowerCase() === code.toLowerCase()) return v.total;
    }
    return 0;
  }

  // Death threshold = -CO_percentile. The percentile lives on
  // `character_stats.stat_roll` (the d100 roll); the analysis points at
  // `1. Stats & Traits`!C14`. Fall back to 0 if missing.
  const coStat = (stats ?? []).find(
    (s) => (s.code ?? "").toLowerCase() === "co",
  );
  const coPercentile = coStat
    ? (characterStats ?? []).find((cs) => cs.stat_id === coStat.id)
        ?.stat_bonus ?? 0
    : 0;
  // We don't have the d100 roll exposed here; use the stat total bonus as a
  // best-effort death threshold display. Player edits the override in the
  // future Stats page if needed.
  const deathThreshold = -Math.abs(coPercentile);

  // Trait totals (for the dashboard readout).
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

  // Category totals (for Combat Styles + Warfare and as input for skills).
  const characterCategoryById = new Map(
    (characterCategories ?? []).map((c) => [c.category_id, c]),
  );
  const adolCategoryRanks = new Map(
    Array.from(adolescentGrants.category.entries()),
  );
  const categoryTotals = new Map<string, number>(); // by name
  const categoryBonusById = new Map<string, number>(); // by id (for skill computation)
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
    categoryTotals.set(c.name, total);
    categoryBonusById.set(c.id, total);
  }

  // Skill totals — by name, for the dashboard's grid.
  const characterSkillById = new Map(
    (characterSkills ?? []).map((s) => [s.skill_id, s]),
  );
  const adolSkillRanks = new Map(
    Array.from(adolescentGrants.skill.entries()),
  );
  const skillTotals = new Map<string, number>();
  const skillTotalById = new Map<string, number>();
  for (const s of skills ?? []) {
    if (!s.id) continue;
    const cs = characterSkillById.get(s.id);
    const playerRanks = cs?.ranks ?? 0;
    const adol = adolSkillRanks.get(s.id) ?? 0;
    const statValue =
      s.stat_id != null ? statTotals.get(s.stat_id)?.total ?? 0 : 0;
    const categoryBonus =
      s.category_id != null ? categoryBonusById.get(s.category_id) ?? 0 : 0;
    const row = computeSkillLikeRow({
      ranks: playerRanks + adol,
      stat_value: statValue,
      talent_bonus:
        (cs?.talent_bonus ?? 0) + (talentBonuses.skill.get(s.id) ?? 0),
      special_modifier: cs?.special_bonus ?? 0,
      activity_modifier: cs?.activity_modifier ?? 0,
      category_bonus: categoryBonus,
    });
    skillTotals.set(s.name, row.total);
    skillTotalById.set(s.id, row.total);
  }

  // Weapon naturals — for OB list. Reuses the formula from weapons-editor.
  const characterWeaponSkillByWeaponId = new Map(
    (characterWeaponSkill ?? [])
      .filter(
        (r): r is typeof r & { weapon_id: string } => r.weapon_id != null,
      )
      .map((r) => [r.weapon_id, r]),
  );
  const weaponTotals = (weapons ?? []).map((w) => {
    const cws = characterWeaponSkillByWeaponId.get(w.id);
    const playerRanks = cws?.ranks ?? 0;
    const adol = cws?.adolescent_ranks ?? 0;
    const pkg = cws?.package_ranks ?? 0;
    const ranks = playerRanks + adol + pkg;
    const ranksValue = ranksValueSkill(ranks);
    const statValue =
      w.stat_id != null ? statTotals.get(w.stat_id)?.total ?? 0 : 0;
    const categoryBonus =
      w.category_id != null ? categoryBonusById.get(w.category_id) ?? 0 : 0;
    const talent =
      (cws?.talent_bonus ?? 0) + (talentBonuses.weapon.get(w.id) ?? 0);
    const special = cws?.special_bonus ?? 0;
    const total = ranksValue + categoryBonus + statValue + talent + special;
    return {
      weapon_id: w.id,
      name: w.name,
      stat_code: w.stat_id ? statById.get(w.stat_id)?.code ?? "" : "",
      ranks,
      total,
    };
  });

  // Armor & shield totals.
  const armorTypeById = new Map((armorTypes ?? []).map((a) => [a.id, a]));
  const characterArmorByBodyPartId = new Map(
    (characterArmor ?? []).map((r) => [r.body_part_id, r]),
  );
  // "Wear Armor" — sheet H1 = '2.2 General Skills'!M11, the skill named
  // "Armor" inside the "Athletic Stamina" category. There is a second
  // "Armor" skill under "Crafting Lores" (smithing lore) that is NOT the
  // same — match on (category, name) to pick the right one.
  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));
  const wearArmorSkill = (skills ?? []).find((s) => {
    const cat = s.category_id ? categoryById.get(s.category_id) : null;
    return s.name === "Armor" && cat?.name === "Athletic Stamina";
  });
  const wearArmor = wearArmorSkill
    ? skillTotalById.get(wearArmorSkill.id) ?? 0
    : 0;
  const armorRows = (bodyParts ?? []).map((bp) => {
    const armor = characterArmorByBodyPartId.get(bp.id);
    const armorType = armor ? armorTypeById.get(armor.armor_type_id) : null;
    const computed = computeArmorRow(
      {
        bodyPartId: bp.id,
        bodyPartName: bp.name,
        percentCovered: bp.percent_covered,
        armorTypeId: armorType?.id ?? null,
        armorTypeName: armorType?.name ?? "None",
        fullArmorBonus: armorType?.full_armor_bonus ?? 0,
        minPenalty: armorType?.min_penalty ?? 0,
        maxPenalty: armorType?.max_penalty ?? 0,
        craftingMultiplier: armor?.crafting_multiplier ?? null,
      },
      wearArmor,
    );
    return {
      body_part_id: bp.id,
      body_part_name: bp.name,
      armor_type_name: armorType?.name ?? "None",
      bonus: computed.bonus,
      total: computed.total,
      penalty: computed.penalty,
    };
  });
  const armorTotalsResult = armorTotals(
    armorRows.map((r) => ({
      bonus: r.bonus,
      total: r.total,
      penalty: r.penalty,
      weightedPenalty:
        ((bodyParts ?? []).find((bp) => bp.id === r.body_part_id)
          ?.percent_covered ?? 0) * r.penalty,
    })),
  );

  const shieldById = new Map((shields ?? []).map((s) => [s.id, s]));
  const shieldDetails = characterShield
    ? (() => {
        const ref = shieldById.get(characterShield.shield_id);
        if (!ref) return null;
        const computed = computeShield(
          {
            trainedDb: ref.trained_db,
            untrainedDb: ref.untrained_db,
            hits: ref.hits ?? ref.trained_db * 3,
            weightLb: ref.weight_lb,
          },
          characterShield.is_trained,
          characterShield.special_bonus,
          characterShield.hits_used,
        );
        return {
          name: ref.name,
          activeDb: computed.activeDb,
          hitsRemaining: computed.hitsRemaining,
          hitsTotal: ref.hits ?? ref.trained_db * 3,
          critDamage: ref.crit_damage_type,
          critSize: ref.crit_size_modifier,
          hits_used: characterShield.hits_used,
        };
      })()
    : null;

  // Game-value rows (for inline editing).
  const gameValueByCode = new Map(
    (gameValues ?? []).map((g) => [g.code, g]),
  );
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

  // ---- Auto-derived game values (override `total` with computed values) ----
  //
  // Sheet rules implemented (see docs/sheet-references/formulas.md):
  //   perception_passive  ← skill "Perception Passive" total
  //   perception_active   ← skill "Perception Active" total
  //   quick_perception    ← perception_active − 30
  //   initiative          ← qu_total + ag_total + armor_penalty + base_value
  //                          (`base_value` is a manual offset; armor_penalty
  //                           is non-positive)
  //   db_shield (init wise) is computed inline by the dashboard via
  //   initiativeWithShield() — already done.
  //
  // Manual / no formula on the sheet:
  //   db (defense base), combat_perception, fate_points → kept manual.
  function overrideTotal(
    code: string,
    derivedTotal: number,
  ): ReturnType<typeof gameValueState> {
    const state = gameValueState(code);
    if (!state) return null;
    return { ...state, total: derivedTotal };
  }

  const passiveSkill = (skills ?? []).find(
    (s) => s.name === "Perception Passive",
  );
  const activeSkill = (skills ?? []).find(
    (s) => s.name === "Perception Active",
  );
  const passiveTotal = passiveSkill
    ? skillTotalById.get(passiveSkill.id) ?? 0
    : 0;
  const activeTotal = activeSkill
    ? skillTotalById.get(activeSkill.id) ?? 0
    : 0;

  const initiativeRow = characterGameValueById.get(
    gameValueByCode.get("initiative")?.id ?? "",
  );
  const initiativeManualOffset = initiativeRow?.base_value ?? 0;

  return (
    <CombatDashboard
      characterId={id}
      level={character.level ?? null}
      hasDescriptionRow={description != null}
      hasLifePointsRow={lifePoints != null}
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
      quTotal={statTotalByCode("qu")}
      acrobaticsTotal={skillTotals.get("Acrobatics") ?? 0}
      weaponTotals={weaponTotals}
      categoryTotals={[
        { name: "Combat Styles", total: categoryTotals.get("Combat Styles") ?? 0 },
        { name: "Warfare", total: categoryTotals.get("Warfare") ?? 0 },
      ]}
      skillTotals={Array.from(skillTotals.entries()).map(([name, total]) => ({
        name,
        total,
      }))}
      armorBd={armorTotalsResult.armorBd}
      armorPenalty={armorTotalsResult.totalPenalty}
      armorRows={armorRows}
      shield={shieldDetails}
      initiative={overrideTotal(
        "initiative",
        derivedInitiative({
          quTotal: statTotalByCode("qu"),
          agTotal: statTotalByCode("ag"),
          armorPenalty: armorTotalsResult.totalPenalty,
          manualOffset: initiativeManualOffset,
        }),
      )}
      db={gameValueState("db")}
      dbShield={gameValueState("db_shield")}
      perceptionPassive={overrideTotal("perception_passive", passiveTotal)}
      perceptionActive={overrideTotal("perception_active", activeTotal)}
      combatPerception={gameValueState("combat_perception")}
      quickPerception={overrideTotal(
        "quick_perception",
        quickPerception(activeTotal),
      )}
      bmrNoArmor={gameValueState("bmr_no_armor")}
      bmrWithArmor={gameValueState("bmr_with_armor")}
    />
  );
}
