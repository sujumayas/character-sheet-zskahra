"use client";

import { ChevronDown, ChevronRight, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DpBudget } from "@/components/sheet/dp-budget";
import { EditableNumber } from "@/components/sheet/editable-number";
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
import { createClient } from "@/lib/supabase/client";

interface CharacterRow {
  id: string;
  level: number | null;
  has_profession_adaptability: boolean;
}

interface TalentLookup {
  id: string;
  name: string;
  talent_type: string;
  cost: number;
  description: string | null;
  is_level_1_only: boolean;
  max_times_per_character: number;
  requires_dm_approval: boolean;
}

interface CharacterTalentRow {
  id: string;
  talent_id: string;
  times_taken: number;
  acquired_level: number | null;
  approved_by_dm: boolean;
  is_active: boolean;
  notes: string | null;
}

export interface ChoiceRow {
  id: string;
  character_talent_id: string;
  choice_type: string;
  stat_id: string | null;
  category_id: string | null;
  skill_id: string | null;
  weapon_id: string | null;
  bonus: number;
  notes: string | null;
}

interface RequirementRow {
  talent_id: string;
  target_name: string;
  operator: string;
  required_value: number | null;
}

interface NamedRow {
  id: string;
  name: string;
}

interface StatLookup extends NamedRow {
  code: string | null;
}

interface CategoryLookup extends NamedRow {
  category_group: string | null;
}

interface SkillLookup extends NamedRow {
  character_id: string | null;
}

export interface TalentsEditorProps {
  characterId: string;
  character: CharacterRow;
  talents: TalentLookup[];
  characterTalents: CharacterTalentRow[];
  characterTalentChoices: ChoiceRow[];
  talentRequirements: RequirementRow[];
  raceTalentIds: string[];
  stats: StatLookup[];
  categories: CategoryLookup[];
  skills: SkillLookup[];
  weapons: NamedRow[];
}

type SectionKey = "racial" | "main" | "secondary" | "flaw";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "racial", label: "Racial" },
  { key: "main", label: "Main Talents" },
  { key: "secondary", label: "Secondary Talents" },
  { key: "flaw", label: "Flaws" },
];

export function TalentsEditor(props: TalentsEditorProps) {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<CharacterTalentRow[]>(props.characterTalents);
  const [choices, setChoices] = useState<ChoiceRow[]>(
    props.characterTalentChoices,
  );

  const talentById = useMemo(
    () => new Map(props.talents.map((t) => [t.id, t])),
    [props.talents],
  );
  const requirementsByTalent = useMemo(() => {
    const out = new Map<string, RequirementRow[]>();
    for (const r of props.talentRequirements) {
      const arr = out.get(r.talent_id) ?? [];
      arr.push(r);
      out.set(r.talent_id, arr);
    }
    return out;
  }, [props.talentRequirements]);
  const raceTalentSet = useMemo(
    () => new Set(props.raceTalentIds),
    [props.raceTalentIds],
  );
  const choicesByCharacterTalent = useMemo(() => {
    const out = new Map<string, ChoiceRow[]>();
    for (const c of choices) {
      const arr = out.get(c.character_talent_id) ?? [];
      arr.push(c);
      out.set(c.character_talent_id, arr);
    }
    return out;
  }, [choices]);

  // ---- DP totals ----
  // Talent DP cost is signed: flaws have negative cost, so they ADD to budget.
  // We render "spent" as the absolute talent cost net (positive = DP burned).
  const dpSpentOnTalents = useMemo(() => {
    let total = 0;
    for (const r of rows) {
      if (!r.is_active) continue;
      const t = talentById.get(r.talent_id);
      if (!t) continue;
      total += t.cost * Math.max(1, r.times_taken);
    }
    return total;
  }, [rows, talentById]);

  // ---- group by section ----
  const sectioned = useMemo(() => {
    const by: Record<SectionKey, CharacterTalentRow[]> = {
      racial: [],
      main: [],
      secondary: [],
      flaw: [],
    };
    for (const r of rows) {
      const t = talentById.get(r.talent_id);
      if (!t) continue;
      if (raceTalentSet.has(r.talent_id)) {
        by.racial.push(r);
        continue;
      }
      if (t.talent_type === "main") by.main.push(r);
      else if (t.talent_type === "secondary") by.secondary.push(r);
      else if (t.talent_type === "flaw") by.flaw.push(r);
    }
    return by;
  }, [rows, talentById, raceTalentSet]);

  // ---- mutations ----

  async function addTalent(talent: TalentLookup) {
    // For racial-section talents we still write talent_type as-is; the section
    // is determined by whether the talent appears in race_talents.
    const { data, error } = await supabase
      .from("character_talents")
      .insert({
        character_id: props.characterId,
        talent_id: talent.id,
        times_taken: 1,
        acquired_level: props.character.level ?? 1,
        is_active: true,
        approved_by_dm: !talent.requires_dm_approval,
      })
      .select(
        "id, talent_id, times_taken, acquired_level, approved_by_dm, is_active, notes",
      )
      .maybeSingle();

    if (error || !data) {
      toast.error(`Failed to add ${talent.name}: ${error?.message ?? "unknown error"}`);
      return;
    }
    setRows((prev) => [...prev, data]);
    toast.success(`Added ${talent.name}`);
  }

  async function removeTalent(row: CharacterTalentRow) {
    const prev = rows;
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    const { error } = await supabase
      .from("character_talents")
      .delete()
      .eq("id", row.id);
    if (error) {
      setRows(prev);
      toast.error(`Failed to remove: ${error.message}`);
    }
  }

  async function updateRow(
    row: CharacterTalentRow,
    patch: Partial<CharacterTalentRow>,
  ) {
    const prev = rows;
    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    const { error } = await supabase
      .from("character_talents")
      .update(patch)
      .eq("id", row.id);
    if (error) {
      setRows(prev);
      toast.error(`Failed to save: ${error.message}`);
    }
  }

  async function addChoice(
    row: CharacterTalentRow,
    input: {
      choice_type: string;
      target_id: string;
      bonus: number;
    },
  ) {
    const insert: Partial<ChoiceRow> & {
      character_talent_id: string;
      choice_type: string;
      bonus: number;
    } = {
      character_talent_id: row.id,
      choice_type: input.choice_type,
      bonus: input.bonus,
    };
    if (input.choice_type === "stat") insert.stat_id = input.target_id;
    if (input.choice_type === "category") insert.category_id = input.target_id;
    if (input.choice_type === "skill") insert.skill_id = input.target_id;
    if (input.choice_type === "weapon") insert.weapon_id = input.target_id;

    const { data, error } = await supabase
      .from("character_talent_choices")
      .insert(insert)
      .select(
        "id, character_talent_id, choice_type, stat_id, category_id, skill_id, weapon_id, bonus, notes",
      )
      .maybeSingle();
    if (error || !data) {
      toast.error(`Failed to add choice: ${error?.message ?? "unknown error"}`);
      return;
    }
    setChoices((prev) => [...prev, data]);
  }

  async function removeChoice(choice: ChoiceRow) {
    const prev = choices;
    setChoices((cs) => cs.filter((c) => c.id !== choice.id));
    const { error } = await supabase
      .from("character_talent_choices")
      .delete()
      .eq("id", choice.id);
    if (error) {
      setChoices(prev);
      toast.error(`Failed to remove choice: ${error.message}`);
    }
  }

  // ----- render -----

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <DpBudget
        label="Talents DP (active only)"
        spent={dpSpentOnTalents}
        available={0 /* talent DP draws from the same pool; budget tracked on Categories/Skills/Weapons. Show this as informational. */}
      />

      {SECTIONS.map((section) => (
        <TalentSection
          key={section.key}
          section={section}
          characterTalents={sectioned[section.key]}
          talents={props.talents}
          allCharacterTalents={rows}
          raceTalentIds={props.raceTalentIds}
          talentById={talentById}
          requirementsByTalent={requirementsByTalent}
          choicesByCharacterTalent={choicesByCharacterTalent}
          stats={props.stats}
          categories={props.categories}
          skills={props.skills}
          weapons={props.weapons}
          onAdd={addTalent}
          onRemove={removeTalent}
          onUpdate={updateRow}
          onAddChoice={addChoice}
          onRemoveChoice={removeChoice}
        />
      ))}
    </div>
  );
}

// ---------- section ----------

interface TalentSectionProps {
  section: { key: SectionKey; label: string };
  characterTalents: CharacterTalentRow[];
  talents: TalentLookup[];
  allCharacterTalents: CharacterTalentRow[];
  raceTalentIds: string[];
  talentById: Map<string, TalentLookup>;
  requirementsByTalent: Map<string, RequirementRow[]>;
  choicesByCharacterTalent: Map<string, ChoiceRow[]>;
  stats: StatLookup[];
  categories: CategoryLookup[];
  skills: SkillLookup[];
  weapons: NamedRow[];
  onAdd: (talent: TalentLookup) => void;
  onRemove: (row: CharacterTalentRow) => void;
  onUpdate: (
    row: CharacterTalentRow,
    patch: Partial<CharacterTalentRow>,
  ) => void;
  onAddChoice: (
    row: CharacterTalentRow,
    input: { choice_type: string; target_id: string; bonus: number },
  ) => void;
  onRemoveChoice: (choice: ChoiceRow) => void;
}

function TalentSection(props: TalentSectionProps) {
  const candidates = useMemo(() => {
    const taken = new Set(
      props.allCharacterTalents.map((r) => r.talent_id),
    );
    if (props.section.key === "racial") {
      return props.talents.filter(
        (t) => props.raceTalentIds.includes(t.id) && !taken.has(t.id),
      );
    }
    return props.talents.filter(
      (t) =>
        t.talent_type === props.section.key &&
        !props.raceTalentIds.includes(t.id) &&
        !taken.has(t.id),
    );
  }, [
    props.talents,
    props.section.key,
    props.allCharacterTalents,
    props.raceTalentIds,
  ]);

  const sectionDpCost = useMemo(() => {
    let total = 0;
    for (const r of props.characterTalents) {
      if (!r.is_active) continue;
      const t = props.talentById.get(r.talent_id);
      if (!t) continue;
      total += t.cost * Math.max(1, r.times_taken);
    }
    return total;
  }, [props.characterTalents, props.talentById]);

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
          {props.section.label}
        </h2>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="tabular-nums">
            {props.characterTalents.length} taken · {sectionDpCost >= 0 ? "+" : ""}
            {sectionDpCost} DP
          </span>
          <CatalogPickerDialog
            sectionLabel={props.section.label}
            candidates={candidates}
            requirementsByTalent={props.requirementsByTalent}
            onPick={props.onAdd}
          />
        </div>
      </div>
      {props.characterTalents.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-200 bg-zinc-50/50 px-4 py-6 text-center text-sm text-zinc-400">
          None taken.
        </p>
      ) : (
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
          <ul className="divide-y divide-zinc-100">
            {props.characterTalents
              .slice()
              .sort((a, b) => {
                const ta = props.talentById.get(a.talent_id)?.name ?? "";
                const tb = props.talentById.get(b.talent_id)?.name ?? "";
                return ta.localeCompare(tb);
              })
              .map((r) => (
                <CharacterTalentRowView
                  key={r.id}
                  row={r}
                  talent={props.talentById.get(r.talent_id) ?? null}
                  requirements={
                    props.requirementsByTalent.get(r.talent_id) ?? []
                  }
                  choices={props.choicesByCharacterTalent.get(r.id) ?? []}
                  stats={props.stats}
                  categories={props.categories}
                  skills={props.skills}
                  weapons={props.weapons}
                  onUpdate={(patch) => props.onUpdate(r, patch)}
                  onRemove={() => props.onRemove(r)}
                  onAddChoice={(input) => props.onAddChoice(r, input)}
                  onRemoveChoice={props.onRemoveChoice}
                />
              ))}
          </ul>
        </div>
      )}
    </section>
  );
}

// ---------- per-talent row ----------

interface CharacterTalentRowViewProps {
  row: CharacterTalentRow;
  talent: TalentLookup | null;
  requirements: RequirementRow[];
  choices: ChoiceRow[];
  stats: StatLookup[];
  categories: CategoryLookup[];
  skills: SkillLookup[];
  weapons: NamedRow[];
  onUpdate: (patch: Partial<CharacterTalentRow>) => void;
  onRemove: () => void;
  onAddChoice: (input: {
    choice_type: string;
    target_id: string;
    bonus: number;
  }) => void;
  onRemoveChoice: (choice: ChoiceRow) => void;
}

function CharacterTalentRowView(props: CharacterTalentRowViewProps) {
  const [open, setOpen] = useState(false);
  const t = props.talent;
  if (!t) {
    return (
      <li className="px-4 py-3 text-sm text-zinc-500">
        Unknown talent (id: {props.row.talent_id})
        <Button variant="ghost" size="sm" className="ml-2" onClick={props.onRemove}>
          Remove
        </Button>
      </li>
    );
  }

  const cost = t.cost * Math.max(1, props.row.times_taken);
  const isFlaw = cost < 0;

  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Collapse" : "Expand"}
          className="mt-0.5 text-zinc-400 hover:text-zinc-700"
        >
          {open ? (
            <ChevronDown className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-sm font-medium text-zinc-900">{t.name}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-xs tabular-nums ${
                isFlaw
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-zinc-100 text-zinc-700"
              }`}
            >
              {cost >= 0 ? "+" : ""}
              {cost} DP
            </span>
            {t.is_level_1_only && (
              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                L1 only
              </span>
            )}
            {t.requires_dm_approval && (
              <span
                className={`rounded px-1.5 py-0.5 text-xs ${
                  props.row.approved_by_dm
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {props.row.approved_by_dm ? "DM approved" : "Awaiting DM"}
              </span>
            )}
          </div>
          {t.description && (
            <p className="mt-1 text-xs text-zinc-500">{t.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-zinc-600">
            <input
              type="checkbox"
              className="size-3.5 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
              checked={props.row.is_active}
              onChange={(e) =>
                props.onUpdate({ is_active: e.target.checked })
              }
            />
            Apply
          </label>
          <Button
            variant="ghost"
            size="sm"
            className="text-zinc-500 hover:text-red-600"
            onClick={props.onRemove}
            aria-label="Remove talent"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-3 ml-7 space-y-3 border-l-2 border-zinc-100 pl-4">
          {props.requirements.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Requirements
              </div>
              <ul className="mt-1 space-y-0.5 text-xs text-zinc-600">
                {props.requirements.map((req, i) => (
                  <li key={i}>
                    {req.target_name} {req.operator} {req.required_value}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-2">
              <span className="text-zinc-500">Times taken</span>
              <EditableNumber
                className="w-14"
                value={props.row.times_taken}
                onCommit={(n) =>
                  props.onUpdate({
                    times_taken: Math.max(
                      1,
                      Math.min(t.max_times_per_character, n),
                    ),
                  })
                }
              />
              <span className="text-zinc-400">
                / max {t.max_times_per_character}
              </span>
            </label>

            <label className="flex items-center gap-2">
              <span className="text-zinc-500">Acquired at level</span>
              <EditableNumber
                className="w-14"
                value={props.row.acquired_level ?? 1}
                onCommit={(n) =>
                  props.onUpdate({ acquired_level: Math.max(1, n) })
                }
              />
            </label>
          </div>

          <ChoicesSubform
            row={props.row}
            choices={props.choices}
            stats={props.stats}
            categories={props.categories}
            skills={props.skills}
            weapons={props.weapons}
            onAdd={props.onAddChoice}
            onRemove={props.onRemoveChoice}
          />
        </div>
      )}
    </li>
  );
}

// ---------- choices subform ----------

interface ChoicesSubformProps {
  row: CharacterTalentRow;
  choices: ChoiceRow[];
  stats: StatLookup[];
  categories: CategoryLookup[];
  skills: SkillLookup[];
  weapons: NamedRow[];
  onAdd: (input: {
    choice_type: string;
    target_id: string;
    bonus: number;
  }) => void;
  onRemove: (choice: ChoiceRow) => void;
}

function ChoicesSubform(props: ChoicesSubformProps) {
  const [type, setType] = useState<string>("stat");
  const [targetId, setTargetId] = useState<string>("");
  const [bonus, setBonus] = useState<number>(1);

  const targetOptions: NamedRow[] = useMemo(() => {
    switch (type) {
      case "stat":
        return props.stats.map((s) => ({
          id: s.id,
          name: `${s.code ?? "?"} — ${s.name}`,
        }));
      case "category":
        return props.categories;
      case "skill":
        return props.skills.map((s) => ({
          id: s.id,
          name: s.name + (s.character_id ? " (custom)" : ""),
        }));
      case "weapon":
        return props.weapons;
      default:
        return [];
    }
  }, [type, props.stats, props.categories, props.skills, props.weapons]);

  function targetLabelFor(c: ChoiceRow): string {
    switch (c.choice_type) {
      case "stat": {
        const s = props.stats.find((x) => x.id === c.stat_id);
        return s ? `${s.code ?? "?"} — ${s.name}` : c.stat_id ?? "?";
      }
      case "category":
        return (
          props.categories.find((x) => x.id === c.category_id)?.name ?? "?"
        );
      case "skill":
        return props.skills.find((x) => x.id === c.skill_id)?.name ?? "?";
      case "weapon":
        return props.weapons.find((x) => x.id === c.weapon_id)?.name ?? "?";
      default:
        return c.choice_type;
    }
  }

  function handleAdd() {
    if (!targetId) {
      toast.error("Pick a target first.");
      return;
    }
    props.onAdd({ choice_type: type, target_id: targetId, bonus });
    setTargetId("");
    setBonus(1);
  }

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Player choices
      </div>
      {props.choices.length > 0 ? (
        <ul className="mt-1 space-y-1 text-xs">
          {props.choices.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-2 rounded bg-zinc-50 px-2 py-1"
            >
              <span className="text-zinc-500 capitalize">{c.choice_type}</span>
              <span className="font-medium text-zinc-800">{targetLabelFor(c)}</span>
              <span className="tabular-nums text-zinc-700">
                {c.bonus >= 0 ? "+" : ""}
                {c.bonus}
              </span>
              <button
                type="button"
                aria-label="Remove choice"
                className="ml-auto text-zinc-400 hover:text-red-600"
                onClick={() => props.onRemove(c)}
              >
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-zinc-400">No choices recorded.</p>
      )}

      <div className="mt-2 flex flex-wrap items-end gap-2">
        <div>
          <Label className="text-xs text-zinc-500">Type</Label>
          <Select
            value={type}
            onValueChange={(v) => {
              setType(v ?? "stat");
              setTargetId("");
            }}
          >
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stat">Stat</SelectItem>
              <SelectItem value="category">Category</SelectItem>
              <SelectItem value="skill">Skill</SelectItem>
              <SelectItem value="weapon">Weapon</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[12rem] flex-1">
          <Label className="text-xs text-zinc-500">Target</Label>
          <Select
            value={targetId}
            onValueChange={(v) => setTargetId(v ?? "")}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Pick a target…" />
            </SelectTrigger>
            <SelectContent>
              {targetOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-zinc-500">Bonus</Label>
          <EditableNumber
            className="w-16"
            value={bonus}
            onCommit={(n) => setBonus(n)}
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          onClick={handleAdd}
        >
          <Plus className="size-3" /> Add choice
        </Button>
      </div>
    </div>
  );
}

// ---------- catalog picker ----------

interface CatalogPickerDialogProps {
  sectionLabel: string;
  candidates: TalentLookup[];
  requirementsByTalent: Map<string, RequirementRow[]>;
  onPick: (talent: TalentLookup) => void;
}

function CatalogPickerDialog(props: CatalogPickerDialogProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return props.candidates;
    return props.candidates.filter((t) => {
      if (t.name.toLowerCase().includes(q)) return true;
      if (t.description?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [props.candidates, query]);

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-7">
            <Plus className="size-3" /> Add talent
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add {props.sectionLabel}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <Search className="size-4 text-zinc-400" />
          <Input
            placeholder="Search by name or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1"
            autoFocus
          />
        </div>
        <div className="max-h-[60vh] overflow-y-auto rounded-md border border-zinc-200">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-zinc-400">
              {props.candidates.length === 0
                ? "No talents available in this section."
                : "No matches."}
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {filtered.map((t) => {
                const reqs = props.requirementsByTalent.get(t.id) ?? [];
                return (
                  <li key={t.id} className="px-3 py-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-medium text-zinc-900">
                            {t.name}
                          </span>
                          <span
                            className={`text-xs tabular-nums ${
                              t.cost < 0 ? "text-emerald-700" : "text-zinc-500"
                            }`}
                          >
                            {t.cost >= 0 ? "+" : ""}
                            {t.cost} DP
                          </span>
                        </div>
                        {t.description && (
                          <p className="mt-0.5 text-xs text-zinc-500">
                            {t.description}
                          </p>
                        )}
                        {reqs.length > 0 && (
                          <p className="mt-0.5 text-xs text-zinc-400">
                            Requires:{" "}
                            {reqs
                              .map(
                                (r) =>
                                  `${r.target_name} ${r.operator} ${r.required_value}`,
                              )
                              .join(", ")}
                          </p>
                        )}
                      </div>
                      <DialogClose
                        render={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => props.onPick(t)}
                          >
                            Add
                          </Button>
                        }
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost" />}>Close</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
