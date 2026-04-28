"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DpBudget } from "@/components/sheet/dp-budget";
import { EditableNumber } from "@/components/sheet/editable-number";
import { NumberStepper } from "@/components/sheet/number-stepper";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { dpCostPerRank, type StatCostRule } from "@/lib/domain/dp-cost";
import {
  PROFESSION_ADAPTABILITY_BONUS,
  dpAvailableAtLevel,
} from "@/lib/domain/progression";
import { ranksValueSkill } from "@/lib/domain/rules";
import {
  computeWeaponTotals,
  type WeaponAffinityLink,
} from "@/lib/domain/weapon-affinity";
import { createClient } from "@/lib/supabase/client";

interface CharacterRow {
  id: string;
  level: number | null;
  has_profession_adaptability: boolean;
}

interface WeaponLookup {
  id: string;
  name: string;
  category_id: string | null;
  stat_id: string | null;
}

interface AffinityRow {
  source_weapon_id: string;
  target_weapon_id: string;
  affinity_modifier: number;
}

interface CharacterWeaponSkillRow {
  id: string;
  weapon_id: string | null;
  ranks: number | null;
  dp_allocated: number | null;
  talent_bonus: number | null;
  special_bonus: number | null;
  activity_modifier: number | null;
  adolescent_ranks: number | null;
  package_ranks: number | null;
}

interface CategoryLookup {
  id: string;
  name: string;
  stat_id: string | null;
  category_group: string | null;
}

interface CharacterCategoryRow {
  category_id: string;
  ranks: number;
}

interface StatLookup {
  id: string;
  code: string | null;
  name: string;
}

interface CharacterStatRow {
  stat_id: string | null;
  stat_bonus: number | null;
  special_modifier: number | null;
}

interface ModifierRow {
  stat_id?: string;
  modifier_value: number;
}

interface LevelTier {
  level: number | null;
  min_total_dp: number | null;
  max_total_dp: number | null;
}

export interface WeaponsEditorProps {
  characterId: string;
  character: CharacterRow;
  weapons: WeaponLookup[];
  weaponAffinity: AffinityRow[];
  characterWeaponSkill: CharacterWeaponSkillRow[];
  categories: CategoryLookup[];
  characterCategories: CharacterCategoryRow[];
  stats: StatLookup[];
  characterStats: CharacterStatRow[];
  raceStatMods: ModifierRow[];
  bpStatMods: ModifierRow[];
  statCostRules: StatCostRule[];
  levelProgression: LevelTier[];
  talentStatBonuses: ReadonlyArray<readonly [string, number]>;
  talentWeaponBonuses: ReadonlyArray<readonly [string, number]>;
}

function indexBy(rows: ModifierRow[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const r of rows) {
    if (r.stat_id) out.set(r.stat_id, r.modifier_value);
  }
  return out;
}

export function WeaponsEditor(props: WeaponsEditorProps) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<CharacterWeaponSkillRow[]>(
    props.characterWeaponSkill,
  );

  const statById = useMemo(
    () => new Map(props.stats.map((s) => [s.id, s])),
    [props.stats],
  );
  const weaponById = useMemo(
    () => new Map(props.weapons.map((w) => [w.id, w])),
    [props.weapons],
  );
  const characterStatByStatId = useMemo(
    () =>
      new Map(
        props.characterStats
          .filter(
            (s): s is CharacterStatRow & { stat_id: string } =>
              s.stat_id != null,
          )
          .map((s) => [s.stat_id, s]),
      ),
    [props.characterStats],
  );
  const raceStatById = useMemo(
    () => indexBy(props.raceStatMods),
    [props.raceStatMods],
  );
  const bpStatById = useMemo(
    () => indexBy(props.bpStatMods),
    [props.bpStatMods],
  );
  const characterCategoryById = useMemo(
    () => new Map(props.characterCategories.map((c) => [c.category_id, c])),
    [props.characterCategories],
  );
  const rowByWeaponId = useMemo(
    () =>
      new Map(
        rows
          .filter(
            (r): r is CharacterWeaponSkillRow & { weapon_id: string } =>
              r.weapon_id != null,
          )
          .map((r) => [r.weapon_id, r]),
      ),
    [rows],
  );

  const talentStatBonusById = useMemo(
    () => new Map(props.talentStatBonuses),
    [props.talentStatBonuses],
  );
  const talentWeaponBonusById = useMemo(
    () => new Map(props.talentWeaponBonuses),
    [props.talentWeaponBonuses],
  );

  const statTotalAndCost = useMemo(() => {
    const totals = new Map<string, { total: number; cost_basis: number }>();
    for (const stat of props.stats) {
      const cs = characterStatByStatId.get(stat.id);
      const statBonus = cs?.stat_bonus ?? 0;
      const raceMod = (raceStatById.get(stat.id) ?? 0) + (bpStatById.get(stat.id) ?? 0);
      const special = cs?.special_modifier ?? 0;
      const talent = talentStatBonusById.get(stat.id) ?? 0;
      totals.set(stat.id, {
        total: statBonus + raceMod + special + talent,
        cost_basis: statBonus + raceMod,
      });
    }
    return totals;
  }, [props.stats, characterStatByStatId, raceStatById, bpStatById, talentStatBonusById]);

  function costForStat(statId: string | null): number {
    if (!statId) return 3;
    const basis = statTotalAndCost.get(statId)?.cost_basis ?? 0;
    return dpCostPerRank(basis, props.statCostRules);
  }

  function statValueForStat(statId: string | null): number {
    if (!statId) return 0;
    return statTotalAndCost.get(statId)?.total ?? 0;
  }

  function categoryBonusForCategory(categoryId: string | null): number {
    if (!categoryId) return 0;
    const cc = characterCategoryById.get(categoryId);
    if (!cc) return 0;
    return ranksValueSkill(cc.ranks);
  }

  // Per-weapon natural value, plus computed transfer values across the
  // affinity matrix.
  const naturals = useMemo(() => {
    return props.weapons.map((w) => {
      const r = rowByWeaponId.get(w.id);
      const ranks = (r?.ranks ?? 0) + (r?.adolescent_ranks ?? 0) + (r?.package_ranks ?? 0);
      const ranksValue = ranksValueSkill(ranks);
      const stat = statValueForStat(w.stat_id);
      const cat = categoryBonusForCategory(w.category_id);
      const talent =
        (r?.talent_bonus ?? 0) + (talentWeaponBonusById.get(w.id) ?? 0);
      const special = r?.special_bonus ?? 0;
      const natural = ranksValue + cat + stat + talent + special;
      return {
        weapon_id: w.id,
        ranks,
        own_ranks: r?.ranks ?? 0,
        adolescent_ranks: r?.adolescent_ranks ?? 0,
        package_ranks: r?.package_ranks ?? 0,
        ranksValue,
        cat,
        stat,
        talent,
        special,
        natural,
      };
    });
  }, [
    props.weapons,
    rowByWeaponId,
    statTotalAndCost,
    characterCategoryById,
    talentWeaponBonusById,
  ]);

  const affinityLinks: WeaponAffinityLink[] = useMemo(
    () =>
      props.weaponAffinity.map((a) => ({
        source_weapon_id: a.source_weapon_id,
        target_weapon_id: a.target_weapon_id,
        modifier: a.affinity_modifier,
      })),
    [props.weaponAffinity],
  );

  const totals = useMemo(
    () =>
      computeWeaponTotals(
        naturals.map((n) => ({ weapon_id: n.weapon_id, natural: n.natural })),
        affinityLinks,
      ),
    [naturals, affinityLinks],
  );

  // DP available
  const dpAvailable = useMemo(() => {
    const tiers = props.levelProgression
      .filter(
        (t): t is { level: number; min_total_dp: number; max_total_dp: number } =>
          t.level != null && t.min_total_dp != null && t.max_total_dp != null,
      )
      .map((t) => ({
        level: t.level,
        min_total_dp: t.min_total_dp,
        max_total_dp: t.max_total_dp,
      }));
    return dpAvailableAtLevel(props.character.level ?? 1, tiers, {
      hasProfessionAdaptability: props.character.has_profession_adaptability,
    });
  }, [
    props.levelProgression,
    props.character.level,
    props.character.has_profession_adaptability,
  ]);

  const dpSpent = useMemo(() => {
    let total = 0;
    for (const w of props.weapons) {
      const r = rowByWeaponId.get(w.id);
      if (!r || !r.ranks) continue;
      const cost = costForStat(w.stat_id);
      total += r.ranks * cost;
    }
    return total;
  }, [props.weapons, rowByWeaponId, statTotalAndCost, props.statCostRules]);

  const groupedWeapons = useMemo(() => {
    const buckets = new Map<string, WeaponLookup[]>();
    for (const w of props.weapons) {
      const key = w.category_id ?? "uncategorized";
      const arr = buckets.get(key) ?? [];
      arr.push(w);
      buckets.set(key, arr);
    }
    const ordered: { id: string; name: string; weapons: WeaponLookup[] }[] = [];
    for (const cat of props.categories) {
      if (buckets.has(cat.id)) {
        ordered.push({
          id: cat.id,
          name: cat.name,
          weapons: (buckets.get(cat.id) ?? []).sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        });
      }
    }
    if (buckets.has("uncategorized")) {
      ordered.push({
        id: "uncategorized",
        name: "Uncategorized",
        weapons: (buckets.get("uncategorized") ?? []).sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      });
    }
    return ordered;
  }, [props.weapons, props.categories]);

  // ---- mutations ----

  async function commitWeaponRanks(weapon: WeaponLookup, nextRanks: number) {
    const cost = costForStat(weapon.stat_id);
    const dpAllocated = nextRanks * cost;
    const existing = rowByWeaponId.get(weapon.id);

    const optimistic: CharacterWeaponSkillRow = existing
      ? { ...existing, ranks: nextRanks, dp_allocated: dpAllocated }
      : {
          id: `optimistic-${weapon.id}`,
          weapon_id: weapon.id,
          ranks: nextRanks,
          dp_allocated: dpAllocated,
          talent_bonus: 0,
          special_bonus: 0,
          activity_modifier: 0,
          adolescent_ranks: 0,
          package_ranks: 0,
        };
    const prev = rows;
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.weapon_id === weapon.id);
      if (idx === -1) return [...rs, optimistic];
      const copy = [...rs];
      copy[idx] = optimistic;
      return copy;
    });

    const { data, error } = await supabase
      .from("character_weapon_skill")
      .upsert(
        {
          character_id: props.characterId,
          weapon_id: weapon.id,
          ranks: nextRanks,
          dp_allocated: dpAllocated,
        },
        { onConflict: "character_id,weapon_id" },
      )
      .select(
        "id, weapon_id, ranks, dp_allocated, talent_bonus, special_bonus, activity_modifier, adolescent_ranks, package_ranks",
      )
      .maybeSingle();

    if (error || !data) {
      setRows(prev);
      toast.error(`Failed to save ${weapon.name}: ${error?.message ?? "unknown error"}`);
      return;
    }
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.weapon_id === weapon.id);
      if (idx === -1) return [...rs, data];
      const copy = [...rs];
      copy[idx] = data;
      return copy;
    });
  }

  async function commitWeaponField(
    weapon: WeaponLookup,
    patch: Partial<CharacterWeaponSkillRow>,
  ) {
    const existing = rowByWeaponId.get(weapon.id);
    const prev = rows;
    const optimistic: CharacterWeaponSkillRow = existing
      ? { ...existing, ...patch }
      : {
          id: `optimistic-${weapon.id}`,
          weapon_id: weapon.id,
          ranks: 0,
          dp_allocated: 0,
          talent_bonus: 0,
          special_bonus: 0,
          activity_modifier: 0,
          adolescent_ranks: 0,
          package_ranks: 0,
          ...patch,
        };
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.weapon_id === weapon.id);
      if (idx === -1) return [...rs, optimistic];
      const copy = [...rs];
      copy[idx] = optimistic;
      return copy;
    });

    const { data, error } = await supabase
      .from("character_weapon_skill")
      .upsert(
        {
          character_id: props.characterId,
          weapon_id: weapon.id,
          ...patch,
        },
        { onConflict: "character_id,weapon_id" },
      )
      .select(
        "id, weapon_id, ranks, dp_allocated, talent_bonus, special_bonus, activity_modifier, adolescent_ranks, package_ranks",
      )
      .maybeSingle();

    if (error || !data) {
      setRows(prev);
      toast.error(`Failed to save ${weapon.name}: ${error?.message ?? "unknown error"}`);
      return;
    }
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.weapon_id === weapon.id);
      if (idx === -1) return [...rs, data];
      const copy = [...rs];
      copy[idx] = data;
      return copy;
    });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <DpBudget
        label={
          props.character.has_profession_adaptability
            ? `Weapons DP (incl. +${PROFESSION_ADAPTABILITY_BONUS} adaptability)`
            : "Weapons DP"
        }
        spent={dpSpent}
        available={dpAvailable}
      />

      {groupedWeapons.map((group) => (
        <section key={group.id}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
            {group.name}
          </h2>
          <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Weapon</th>
                  <th className="px-3 py-2 font-medium">Stat</th>
                  <th className="px-3 py-2 font-medium text-right">Cost/rank</th>
                  <th className="px-3 py-2 font-medium text-right">Ranks</th>
                  <th className="px-3 py-2 font-medium text-right">Adol.</th>
                  <th className="px-3 py-2 font-medium text-right">Cat val</th>
                  <th className="px-3 py-2 font-medium text-right">Stat val</th>
                  <th className="px-3 py-2 font-medium text-right">Talent</th>
                  <th className="px-3 py-2 font-medium text-right">Special</th>
                  <th className="px-3 py-2 font-medium text-right">Natural</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {group.weapons.map((w) => {
                  const stat = w.stat_id ? statById.get(w.stat_id) : null;
                  const cost = costForStat(w.stat_id);
                  const r = rowByWeaponId.get(w.id);
                  const n = naturals.find((nn) => nn.weapon_id === w.id);
                  if (!n) return null;
                  const t = totals.get(w.id);
                  const usedAffinity =
                    t && t.transfer_in > n.natural && t.best_source_id;
                  const sourceWeapon = usedAffinity
                    ? weaponById.get(t!.best_source_id!)
                    : null;
                  const affinityLink = usedAffinity
                    ? affinityLinks.find(
                        (a) =>
                          a.source_weapon_id === t!.best_source_id &&
                          a.target_weapon_id === w.id,
                      )
                    : null;
                  return (
                    <tr key={w.id}>
                      <td className="px-3 py-2 font-medium">{w.name}</td>
                      <td className="px-3 py-2 text-zinc-500">
                        {stat?.code ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                        {cost}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <NumberStepper
                          className="justify-end"
                          value={n.own_ranks}
                          min={0}
                          max={50}
                          onCommit={(next) => commitWeaponRanks(w, next)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-500">
                        {n.adolescent_ranks + n.package_ranks > 0
                          ? `+${n.adolescent_ranks + n.package_ranks}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                        {n.cat}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {n.stat}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                        {n.talent}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <EditableNumber
                          className="ml-auto w-16"
                          value={r?.special_bonus ?? 0}
                          onCommit={(next) =>
                            commitWeaponField(w, { special_bonus: next })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {n.natural}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {usedAffinity && sourceWeapon && affinityLink ? (
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <span className="cursor-help underline decoration-dotted underline-offset-2 tabular-nums font-semibold">
                                  {t!.total}
                                </span>
                              }
                            />
                            <TooltipContent>
                              via {sourceWeapon.name} ({affinityLink.modifier})
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="tabular-nums font-semibold">
                            {t?.total ?? n.natural}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
