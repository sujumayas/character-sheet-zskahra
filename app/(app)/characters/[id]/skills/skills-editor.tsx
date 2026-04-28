"use client";

import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DpBudget } from "@/components/sheet/dp-budget";
import { EditableNumber } from "@/components/sheet/editable-number";
import { NumberStepper } from "@/components/sheet/number-stepper";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { dpCostPerRank, type StatCostRule } from "@/lib/domain/dp-cost";
import { computeSkillLikeRow } from "@/lib/domain/modifiers";
import {
  PROFESSION_ADAPTABILITY_BONUS,
  maxRanksAt,
} from "@/lib/domain/progression";
import { ranksValueSkill } from "@/lib/domain/rules";
import { createClient } from "@/lib/supabase/client";

interface CharacterRow {
  id: string;
  level: number | null;
  has_profession_adaptability: boolean;
}

interface SkillLookup {
  id: string;
  name: string;
  category_id: string | null;
  stat_id: string | null;
  is_custom: boolean | null;
  allows_specialization: boolean | null;
  description: string | null;
  character_id: string | null;
}

interface CharacterSkillRow {
  id: string;
  skill_id: string | null;
  ranks: number | null;
  dp_allocated: number | null;
  talent_bonus: number | null;
  special_bonus: number | null;
  activity_modifier: number | null;
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

export interface SkillsEditorProps {
  characterId: string;
  character: CharacterRow;
  skills: SkillLookup[];
  characterSkills: CharacterSkillRow[];
  categories: CategoryLookup[];
  characterCategories: CharacterCategoryRow[];
  stats: StatLookup[];
  characterStats: CharacterStatRow[];
  raceStatMods: ModifierRow[];
  bpStatMods: ModifierRow[];
  statCostRules: StatCostRule[];
  levelProgression: LevelTier[];
  talentStatBonuses: ReadonlyArray<readonly [string, number]>;
  talentSkillBonuses: ReadonlyArray<readonly [string, number]>;
  adolescentSkillGrants: ReadonlyArray<readonly [string, number]>;
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
  for (const r of rows) {
    if (r.stat_id) out.set(r.stat_id, r.modifier_value);
  }
  return out;
}

export function SkillsEditor(props: SkillsEditorProps) {
  const supabase = useMemo(() => createClient(), []);
  const [skills, setSkills] = useState<SkillLookup[]>(props.skills);
  const [rows, setRows] = useState<CharacterSkillRow[]>(props.characterSkills);

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
  const characterCategoryById = useMemo(
    () => new Map(props.characterCategories.map((c) => [c.category_id, c])),
    [props.characterCategories],
  );
  const rowBySkillId = useMemo(
    () =>
      new Map(
        rows
          .filter(
            (r): r is CharacterSkillRow & { skill_id: string } =>
              r.skill_id != null,
          )
          .map((r) => [r.skill_id, r]),
      ),
    [rows],
  );

  const talentStatBonusById = useMemo(
    () => new Map(props.talentStatBonuses),
    [props.talentStatBonuses],
  );
  const talentSkillBonusById = useMemo(
    () => new Map(props.talentSkillBonuses),
    [props.talentSkillBonuses],
  );
  const adolescentSkillRanksById = useMemo(
    () => new Map(props.adolescentSkillGrants),
    [props.adolescentSkillGrants],
  );
  const adolescentCategoryRanksById = useMemo(
    () => new Map(props.adolescentCategoryGrants),
    [props.adolescentCategoryGrants],
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

  // Category bonus = ranksValueSkill(category.ranks). The category total
  // includes stat_value + activity + talent + special, but only the rank
  // portion adds independently to skills (the stat is shared between
  // category and skill so we don't double-count it; same goes for talent
  // bonuses keyed on the category rather than the skill).
  function categoryBonusForCategory(categoryId: string | null): number {
    if (!categoryId) return 0;
    const playerRanks = characterCategoryById.get(categoryId)?.ranks ?? 0;
    const adolRanks = adolescentCategoryRanksById.get(categoryId) ?? 0;
    return ranksValueSkill(playerRanks + adolRanks);
  }

  // Cross-tab DP budget (centralized: total earned across all sessions vs.
  // total spent across all editors). Local skills spend is recomputed and
  // swapped into the unified total so optimistic edits show up live.
  const dpAvailable = props.dpBudget.totalEarned;
  const derivedLevel = props.dpBudget.derivedLevel;
  const rankCap = maxRanksAt(derivedLevel);

  const dpSpentThisTab = useMemo(() => {
    let total = 0;
    for (const sk of skills) {
      const r = rowBySkillId.get(sk.id);
      if (!r || !r.ranks) continue;
      const cost = costForStat(sk.stat_id);
      total += r.ranks * cost;
    }
    return total;
  }, [skills, rowBySkillId, statTotalAndCost, props.statCostRules]);

  const dpSpent =
    props.dpBudget.totalSpent -
    props.dpBudget.thisBucketSpent +
    dpSpentThisTab;

  // Group skills by category (with collapsible sections)
  const grouped = useMemo(() => {
    const buckets = new Map<string, SkillLookup[]>();
    for (const sk of skills) {
      const key = sk.category_id ?? "uncategorized";
      const arr = buckets.get(key) ?? [];
      arr.push(sk);
      buckets.set(key, arr);
    }
    const groupOrder: { id: string; name: string }[] = [];
    for (const cat of props.categories) {
      if (buckets.has(cat.id))
        groupOrder.push({ id: cat.id, name: cat.name });
    }
    if (buckets.has("uncategorized")) {
      groupOrder.push({ id: "uncategorized", name: "Uncategorized" });
    }
    return groupOrder.map((g) => ({
      id: g.id,
      name: g.name,
      skills: (buckets.get(g.id) ?? []).sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }));
  }, [skills, props.categories]);

  const initiallyExpanded = useMemo(() => {
    const set = new Set<string>();
    for (const g of grouped) {
      const hasRanks = g.skills.some(
        (s) =>
          (rowBySkillId.get(s.id)?.ranks ?? 0) +
            (adolescentSkillRanksById.get(s.id) ?? 0) >
          0,
      );
      if (hasRanks) set.add(g.id);
    }
    return set;
  }, [grouped, rowBySkillId, adolescentSkillRanksById]);

  const [expanded, setExpanded] = useState<Set<string>>(initiallyExpanded);
  function toggleGroup(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ---- mutations ----

  async function commitSkillRanks(skill: SkillLookup, nextRanks: number) {
    const cost = costForStat(skill.stat_id);
    const dpAllocated = nextRanks * cost;
    const existing = rowBySkillId.get(skill.id);

    const optimistic: CharacterSkillRow = existing
      ? { ...existing, ranks: nextRanks, dp_allocated: dpAllocated }
      : {
          id: `optimistic-${skill.id}`,
          skill_id: skill.id,
          ranks: nextRanks,
          dp_allocated: dpAllocated,
          talent_bonus: 0,
          special_bonus: 0,
          activity_modifier: 0,
        };

    const prev = rows;
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.skill_id === skill.id);
      if (idx === -1) return [...rs, optimistic];
      const copy = [...rs];
      copy[idx] = optimistic;
      return copy;
    });

    const { data, error } = await supabase
      .from("character_skills")
      .upsert(
        {
          character_id: props.characterId,
          skill_id: skill.id,
          ranks: nextRanks,
          dp_allocated: dpAllocated,
        },
        { onConflict: "character_id,skill_id" },
      )
      .select(
        "id, skill_id, ranks, dp_allocated, talent_bonus, special_bonus, activity_modifier",
      )
      .maybeSingle();

    if (error || !data) {
      setRows(prev);
      toast.error(`Failed to save ${skill.name}: ${error?.message ?? "unknown error"}`);
      return;
    }
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.skill_id === skill.id);
      if (idx === -1) return [...rs, data];
      const copy = [...rs];
      copy[idx] = data;
      return copy;
    });
  }

  async function commitSkillField(
    skill: SkillLookup,
    patch: Partial<CharacterSkillRow>,
  ) {
    const existing = rowBySkillId.get(skill.id);
    const prev = rows;
    const optimistic: CharacterSkillRow = existing
      ? { ...existing, ...patch }
      : {
          id: `optimistic-${skill.id}`,
          skill_id: skill.id,
          ranks: 0,
          dp_allocated: 0,
          talent_bonus: 0,
          special_bonus: 0,
          activity_modifier: 0,
          ...patch,
        };
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.skill_id === skill.id);
      if (idx === -1) return [...rs, optimistic];
      const copy = [...rs];
      copy[idx] = optimistic;
      return copy;
    });

    const { data, error } = await supabase
      .from("character_skills")
      .upsert(
        {
          character_id: props.characterId,
          skill_id: skill.id,
          ...patch,
        },
        { onConflict: "character_id,skill_id" },
      )
      .select(
        "id, skill_id, ranks, dp_allocated, talent_bonus, special_bonus, activity_modifier",
      )
      .maybeSingle();

    if (error || !data) {
      setRows(prev);
      toast.error(`Failed to save ${skill.name}: ${error?.message ?? "unknown error"}`);
      return;
    }
    setRows((rs) => {
      const idx = rs.findIndex((r) => r.skill_id === skill.id);
      if (idx === -1) return [...rs, data];
      const copy = [...rs];
      copy[idx] = data;
      return copy;
    });
  }

  async function createCustomSkill(input: {
    name: string;
    category_id: string;
    stat_id: string;
    allows_specialization: boolean;
  }) {
    const { data, error } = await supabase
      .from("skills")
      .insert({
        name: input.name,
        category_id: input.category_id,
        stat_id: input.stat_id,
        allows_specialization: input.allows_specialization,
        is_custom: true,
        is_active: true,
        character_id: props.characterId,
      })
      .select(
        "id, name, category_id, stat_id, is_custom, allows_specialization, description, character_id",
      )
      .maybeSingle();
    if (error || !data) {
      toast.error(`Failed to create skill: ${error?.message ?? "unknown error"}`);
      return;
    }
    setSkills((prev) => [...prev, data]);
    toast.success(`Added custom skill: ${data.name}`);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <div className="flex items-start gap-3">
        <DpBudget
          label={
            props.character.has_profession_adaptability
              ? `Total DP (incl. +${PROFESSION_ADAPTABILITY_BONUS} adaptability) — L${derivedLevel}, max ${rankCap}/skill`
              : `Total DP — L${derivedLevel}, max ${rankCap}/skill`
          }
          spent={dpSpent}
          available={dpAvailable}
          className="flex-1"
        />
        <CustomSkillDialog
          categories={props.categories}
          stats={props.stats}
          onCreate={createCustomSkill}
        />
      </div>

      {grouped.map((group) => {
        const isOpen = expanded.has(group.id);
        return (
          <section key={group.id}>
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className="mb-2 flex w-full items-center gap-2 text-left text-sm font-semibold uppercase tracking-wide text-zinc-600 hover:text-zinc-900"
            >
              {isOpen ? (
                <ChevronDown className="size-4" />
              ) : (
                <ChevronRight className="size-4" />
              )}
              {group.name}
              <span className="ml-2 text-xs font-normal text-zinc-400">
                {group.skills.length} skills
              </span>
            </button>
            {isOpen && (
              <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th className="px-3 py-2 font-medium">Skill</th>
                      <th className="px-3 py-2 font-medium">Stat</th>
                      <th className="px-3 py-2 font-medium text-right">Cost/rank</th>
                      <th className="px-3 py-2 font-medium text-right">DP Ranks</th>
                      <th className="px-3 py-2 font-medium text-right">Ranks</th>
                      <th className="px-3 py-2 font-medium text-right">Ranks val</th>
                      <th className="px-3 py-2 font-medium text-right">Cat val</th>
                      <th className="px-3 py-2 font-medium text-right">Stat val</th>
                      <th className="px-3 py-2 font-medium text-right">Talent</th>
                      <th className="px-3 py-2 font-medium text-right">Special</th>
                      <th className="px-3 py-2 font-medium text-right">Total</th>
                      <th className="px-3 py-2 font-medium text-right">DP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {group.skills.map((sk) => {
                      const r = rowBySkillId.get(sk.id);
                      const stat = sk.stat_id ? statById.get(sk.stat_id) : null;
                      const cost = costForStat(sk.stat_id);
                      const playerRanks = r?.ranks ?? 0;
                      const adolRanks = adolescentSkillRanksById.get(sk.id) ?? 0;
                      const ranks = playerRanks + adolRanks;
                      const computed = computeSkillLikeRow({
                        ranks,
                        stat_value: statValueForStat(sk.stat_id),
                        category_bonus: categoryBonusForCategory(sk.category_id),
                        talent_bonus:
                          (r?.talent_bonus ?? 0) +
                          (talentSkillBonusById.get(sk.id) ?? 0),
                        special_modifier: r?.special_bonus ?? 0,
                        activity_modifier: r?.activity_modifier ?? 0,
                      });
                      return (
                        <tr key={sk.id}>
                          <td className="px-3 py-2 font-medium">
                            {sk.name}
                            {sk.is_custom && (
                              <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-xs uppercase tracking-wide text-zinc-500">
                                Custom
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
                              max={rankCap}
                              onCommit={(next) => commitSkillRanks(sk, next)}
                            />
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums font-medium">
                            <span>{ranks}</span>
                            {adolRanks > 0 && (
                              <span
                                title={`${playerRanks} DP rank${playerRanks === 1 ? "" : "s"} + ${adolRanks} free adolescent rank${adolRanks === 1 ? "" : "s"} from birthplace`}
                                className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700"
                              >
                                +{adolRanks}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {computed.ranks_value}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                            {computed.category_bonus}
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
                              value={r?.special_bonus ?? 0}
                              onCommit={(next) =>
                                commitSkillField(sk, { special_bonus: next })
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
            )}
          </section>
        );
      })}
    </div>
  );
}

function CustomSkillDialog({
  categories,
  stats,
  onCreate,
}: {
  categories: CategoryLookup[];
  stats: StatLookup[];
  onCreate: (input: {
    name: string;
    category_id: string;
    stat_id: string;
    allows_specialization: boolean;
  }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [statId, setStatId] = useState<string>("");
  const [allowsSpec, setAllowsSpec] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setName("");
    setCategoryId("");
    setStatId("");
    setAllowsSpec(false);
  }

  async function handleSubmit() {
    if (!name.trim() || !categoryId || !statId) return;
    setSubmitting(true);
    try {
      await onCreate({
        name: name.trim(),
        category_id: categoryId,
        stat_id: statId,
        allows_specialization: allowsSpec,
      });
      reset();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        setOpen(next);
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="shrink-0">
            <Plus className="size-4" /> Custom skill
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a custom skill</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="skill-name">Name</Label>
            <Input
              id="skill-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Category</Label>
            <Select
              value={categoryId}
              onValueChange={(v) => setCategoryId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .slice()
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Stat</Label>
            <Select value={statId} onValueChange={(v) => setStatId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a stat" />
              </SelectTrigger>
              <SelectContent>
                {stats.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {s.code ? `(${s.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allowsSpec}
              onChange={(e) => setAllowsSpec(e.target.checked)}
            />
            <span>Allows specialization</span>
          </label>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Cancel</DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={
              submitting || !name.trim() || !categoryId || !statId
            }
          >
            {submitting ? "Adding…" : "Add skill"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
