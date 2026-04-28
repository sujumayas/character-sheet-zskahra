"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DpBudget } from "@/components/sheet/dp-budget";
import { EditableNumber } from "@/components/sheet/editable-number";
import { NumberStepper } from "@/components/sheet/number-stepper";
import { dpCostPerRank, type StatCostRule } from "@/lib/domain/dp-cost";
import { computeSkillLikeRow } from "@/lib/domain/modifiers";
import {
  PROFESSION_ADAPTABILITY_BONUS,
  maxRanksAt,
} from "@/lib/domain/progression";
import { createClient } from "@/lib/supabase/client";

interface CharacterRow {
  id: string;
  level: number | null;
  has_profession_adaptability: boolean;
}

interface CategoryLookup {
  id: string;
  name: string;
  stat_id: string | null;
  category_group: string | null;
}

interface CharacterCategoryRow {
  id: string;
  category_id: string;
  ranks: number;
  dp_allocated: number | null;
  talent_bonus: number | null;
  special_modifier: number | null;
  activity_modifier: number | null;
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

export interface CategoriesEditorProps {
  characterId: string;
  character: CharacterRow;
  categories: CategoryLookup[];
  characterCategories: CharacterCategoryRow[];
  stats: StatLookup[];
  characterStats: CharacterStatRow[];
  raceStatMods: ModifierRow[];
  bpStatMods: ModifierRow[];
  statCostRules: StatCostRule[];
  levelProgression: LevelTier[];
  talentStatBonuses: ReadonlyArray<readonly [string, number]>;
  talentCategoryBonuses: ReadonlyArray<readonly [string, number]>;
  adolescentCategoryGrants: ReadonlyArray<readonly [string, number]>;
  dpBudget: {
    totalEarned: number;
    totalSpent: number;
    thisBucketSpent: number;
    derivedLevel: number;
  };
}

function indexBy(rows: ModifierRow[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of rows) {
    if (row.stat_id) out.set(row.stat_id, row.modifier_value);
  }
  return out;
}

const GROUP_ORDER = ["Traits", "General", "Weapons"] as const;

export function CategoriesEditor(props: CategoriesEditorProps) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<CharacterCategoryRow[]>(
    props.characterCategories,
  );

  const statById = useMemo(
    () => new Map(props.stats.map((s) => [s.id, s])),
    [props.stats],
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
  const rowByCategoryId = useMemo(
    () => new Map(rows.map((r) => [r.category_id, r])),
    [rows],
  );

  const talentStatBonusById = useMemo(
    () => new Map(props.talentStatBonuses),
    [props.talentStatBonuses],
  );
  const talentCategoryBonusById = useMemo(
    () => new Map(props.talentCategoryBonuses),
    [props.talentCategoryBonuses],
  );
  const adolescentRanksById = useMemo(
    () => new Map(props.adolescentCategoryGrants),
    [props.adolescentCategoryGrants],
  );

  // Stat totals (for stat_value contribution) and cost-bases (for DP cost lookup).
  // Cost basis omits talent bonuses by design (plan §6.2; talent stat bonuses
  // do not retroactively cheapen ranks bought against the natural stat).
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

  // Cross-tab DP budget (centralized: total earned across all sessions vs.
  // total spent across all editors). Local categories spend swapped into the
  // unified total so optimistic edits show up live.
  const dpAvailable = props.dpBudget.totalEarned;
  const derivedLevel = props.dpBudget.derivedLevel;
  const rankCap = maxRanksAt(derivedLevel);

  const dpSpentThisTab = useMemo(() => {
    let total = 0;
    for (const cat of props.categories) {
      const r = rowByCategoryId.get(cat.id);
      if (!r) continue;
      const cost = costForStat(cat.stat_id);
      total += r.ranks * cost;
    }
    return total;
  }, [props.categories, rowByCategoryId, statTotalAndCost, props.statCostRules]);

  const dpSpent =
    props.dpBudget.totalSpent -
    props.dpBudget.thisBucketSpent +
    dpSpentThisTab;

  const groupedCategories = useMemo(() => {
    const buckets = new Map<string, CategoryLookup[]>();
    for (const cat of props.categories) {
      const key = cat.category_group ?? "General";
      const arr = buckets.get(key) ?? [];
      arr.push(cat);
      buckets.set(key, arr);
    }
    const knownOrder = GROUP_ORDER.filter((g) => buckets.has(g));
    const others = Array.from(buckets.keys())
      .filter((k) => !GROUP_ORDER.includes(k as (typeof GROUP_ORDER)[number]))
      .sort();
    return [...knownOrder, ...others].map((group) => ({
      group,
      categories: (buckets.get(group) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
  }, [props.categories]);

  async function commitCategoryRanks(category: CategoryLookup, nextRanks: number) {
    const cost = costForStat(category.stat_id);
    const dpAllocated = nextRanks * cost;
    const existing = rowByCategoryId.get(category.id);

    const optimistic: CharacterCategoryRow = existing
      ? { ...existing, ranks: nextRanks, dp_allocated: dpAllocated }
      : {
          id: `optimistic-${category.id}`,
          category_id: category.id,
          ranks: nextRanks,
          dp_allocated: dpAllocated,
          talent_bonus: 0,
          special_modifier: 0,
          activity_modifier: 0,
        };

    const prev = rows;
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.category_id === category.id);
      if (idx === -1) return [...rs, optimistic];
      const copy = [...rs];
      copy[idx] = optimistic;
      return copy;
    });

    const { data, error } = await supabase
      .from("character_categories")
      .upsert(
        {
          character_id: props.characterId,
          category_id: category.id,
          ranks: nextRanks,
          dp_allocated: dpAllocated,
        },
        { onConflict: "character_id,category_id" },
      )
      .select(
        "id, category_id, ranks, dp_allocated, talent_bonus, special_modifier, activity_modifier",
      )
      .maybeSingle();

    if (error || !data) {
      setRows(prev);
      toast.error(`Failed to save ${category.name}: ${error?.message ?? "unknown error"}`);
      return;
    }
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.category_id === category.id);
      if (idx === -1) return [...rs, data];
      const copy = [...rs];
      copy[idx] = data;
      return copy;
    });
  }

  async function commitCategoryField(
    category: CategoryLookup,
    patch: Partial<CharacterCategoryRow>,
  ) {
    const existing = rowByCategoryId.get(category.id);
    const prev = rows;

    const optimistic: CharacterCategoryRow = existing
      ? { ...existing, ...patch }
      : {
          id: `optimistic-${category.id}`,
          category_id: category.id,
          ranks: 0,
          dp_allocated: 0,
          talent_bonus: 0,
          special_modifier: 0,
          activity_modifier: 0,
          ...patch,
        };
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.category_id === category.id);
      if (idx === -1) return [...rs, optimistic];
      const copy = [...rs];
      copy[idx] = optimistic;
      return copy;
    });

    const { data, error } = await supabase
      .from("character_categories")
      .upsert(
        {
          character_id: props.characterId,
          category_id: category.id,
          ...patch,
        },
        { onConflict: "character_id,category_id" },
      )
      .select(
        "id, category_id, ranks, dp_allocated, talent_bonus, special_modifier, activity_modifier",
      )
      .maybeSingle();

    if (error || !data) {
      setRows(prev);
      toast.error(`Failed to save ${category.name}: ${error?.message ?? "unknown error"}`);
      return;
    }
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.category_id === category.id);
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
            ? `Total DP (incl. +${PROFESSION_ADAPTABILITY_BONUS} adaptability) — L${derivedLevel}, max ${rankCap}/category`
            : `Total DP — L${derivedLevel}, max ${rankCap}/category`
        }
        spent={dpSpent}
        available={dpAvailable}
      />

      {groupedCategories.map(({ group, categories }) => (
        <section key={group}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
            {group}
          </h2>
          <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Stat</th>
                  <th className="px-3 py-2 font-medium text-right">Cost/rank</th>
                  <th className="px-3 py-2 font-medium text-right">Ranks</th>
                  <th className="px-3 py-2 font-medium text-right">Ranks val</th>
                  <th className="px-3 py-2 font-medium text-right">Stat val</th>
                  <th className="px-3 py-2 font-medium text-right">Talent</th>
                  <th className="px-3 py-2 font-medium text-right">Special</th>
                  <th className="px-3 py-2 font-medium text-right">Activity</th>
                  <th className="px-3 py-2 font-medium text-right">Total</th>
                  <th className="px-3 py-2 font-medium text-right">DP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {categories.map((cat) => {
                  const row = rowByCategoryId.get(cat.id);
                  const stat = cat.stat_id ? statById.get(cat.stat_id) : null;
                  const cost = costForStat(cat.stat_id);
                  const playerRanks = row?.ranks ?? 0;
                  const adolRanks = adolescentRanksById.get(cat.id) ?? 0;
                  // Adolescent grants stack on top of paid ranks, are free
                  // (no DP), and ride the same piecewise rank curve.
                  const ranks = playerRanks + adolRanks;
                  const computed = computeSkillLikeRow({
                    ranks,
                    stat_value: statValueForStat(cat.stat_id),
                    talent_bonus:
                      (row?.talent_bonus ?? 0) +
                      (talentCategoryBonusById.get(cat.id) ?? 0),
                    special_modifier: row?.special_modifier ?? 0,
                    activity_modifier: row?.activity_modifier ?? 0,
                  });
                  return (
                    <tr key={cat.id}>
                      <td className="px-3 py-2 font-medium">
                        {cat.name}
                        {adolRanks > 0 && (
                          <span
                            title={`Free adolescent ranks from your birthplace`}
                            className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700"
                          >
                            +{adolRanks} adol
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-zinc-500">
                        {stat?.code ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                        {cost}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <NumberStepper
                          className="justify-end"
                          value={playerRanks}
                          min={0}
                          max={50}
                          onCommit={(next) => commitCategoryRanks(cat, next)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {computed.ranks_value}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {computed.stat_value}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                        {computed.talent_bonus === 0
                          ? "—"
                          : computed.talent_bonus > 0
                            ? `+${computed.talent_bonus}`
                            : computed.talent_bonus}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <EditableNumber
                          className="ml-auto w-16"
                          value={row?.special_modifier ?? 0}
                          onCommit={(next) =>
                            commitCategoryField(cat, { special_modifier: next })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <EditableNumber
                          className="ml-auto w-16"
                          value={row?.activity_modifier ?? 0}
                          onCommit={(next) =>
                            commitCategoryField(cat, { activity_modifier: next })
                          }
                        />
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold">
                        {computed.total}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                        {playerRanks * cost}
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
