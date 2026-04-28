"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EditableNumber } from "@/components/sheet/editable-number";
import { EditableText } from "@/components/sheet/editable-text";
import { NumberStepper } from "@/components/sheet/number-stepper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { computeStatRow, computeTraitRow } from "@/lib/domain/modifiers";
import { createClient } from "@/lib/supabase/client";

const STAT_DISPLAY_ORDER = [
  "ST",
  "CO",
  "AG",
  "QU",
  "SD",
  "RE",
  "IN",
  "PR",
] as const;

const TRAIT_DISPLAY_ORDER = [
  "Endurance",
  "Power Points",
  "General Knowledge",
  "RR Will",
  "RR Stamina",
  "RR Magic",
] as const;

type Modifier = { stat_id?: string; trait_id?: string; modifier_value: number };

interface CharacterRow {
  id: string;
  name: string;
  character_name: string | null;
  player_name: string | null;
  level: number | null;
  status: string | null;
  has_profession_adaptability: boolean;
}

interface DescriptionRow {
  race_id: string | null;
  profession_id: string | null;
  birthplace_id: string | null;
  sex_id: string | null;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  appearance_roll: number | null;
  appearance: number | null;
  appearance_notes: string | null;
  description_notes: string | null;
  fate_points: number | null;
}

interface ChaosRow {
  chaos_index: number | null;
  chaos_track: number | null;
  chaos_dice: number | null;
  chaos_power_calculator: number | null;
  notes: string | null;
}

interface LifePointsRow {
  current_life_points: number | null;
  dm_activity_modifier: number | null;
  has_activity_penalty_reduction: boolean | null;
  notes: string | null;
}

interface CharacterStat {
  id: string;
  stat_id: string | null;
  base_value: number | null;
  stat_bonus: number | null;
  race_modifier: number | null;
  special_modifier: number | null;
}

interface CharacterTrait {
  id: string;
  trait_id: string;
  ranks: number;
  special_modifier: number;
  talent_bonus: number;
  gm_bonus: number;
  temp_modifier: number;
}

interface StatLookup {
  id: string;
  code: string | null;
  name: string;
}

interface TraitLookup {
  id: string;
  name: string;
  primary_stat_id: string | null;
  secondary_stat_id: string | null;
}

interface StatProgressionEntry {
  stat_value: number;
  bonus: number;
}

interface NamedRow {
  id: string;
  name: string;
}

interface RaceSex {
  id: string;
  race_id: string;
  name: string;
}

export interface StatsEditorProps {
  characterId: string;
  character: CharacterRow;
  description: DescriptionRow | null;
  chaos: ChaosRow | null;
  lifePoints: LifePointsRow | null;
  characterStats: CharacterStat[];
  characterTraits: CharacterTrait[];
  stats: StatLookup[];
  traits: TraitLookup[];
  races: NamedRow[];
  birthplaces: NamedRow[];
  professions: NamedRow[];
  raceSexes: RaceSex[];
  raceStatMods: Modifier[];
  raceTraitMods: Modifier[];
  bpStatMods: Modifier[];
  bpTraitMods: Modifier[];
  statProgression: StatProgressionEntry[];
  talentStatBonuses: ReadonlyArray<readonly [string, number]>;
  talentTraitBonuses: ReadonlyArray<readonly [string, number]>;
  adolescentTraitGrants: ReadonlyArray<readonly [string, number]>;
}

function indexBy<K extends keyof Modifier>(
  rows: Modifier[] | null | undefined,
  key: K,
): Map<string, number> {
  const out = new Map<string, number>();
  if (!rows) return out;
  for (const row of rows) {
    const id = row[key];
    if (typeof id === "string") out.set(id, row.modifier_value);
  }
  return out;
}

function bonusForStatValue(
  value: number | null,
  progression: StatProgressionEntry[],
): number {
  if (value == null) return 0;
  if (progression.length === 0) return 0;
  const sorted = [...progression].sort((a, b) => a.stat_value - b.stat_value);
  let bonus = sorted[0].bonus;
  for (const row of sorted) {
    if (row.stat_value <= value) bonus = row.bonus;
    else break;
  }
  return bonus;
}

function signed(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

export function StatsEditor(props: StatsEditorProps) {
  const supabase = useMemo(() => createClient(), []);

  const [character, setCharacter] = useState(props.character);
  const [description, setDescription] = useState<DescriptionRow>(
    props.description ?? {
      race_id: null,
      profession_id: null,
      birthplace_id: null,
      sex_id: null,
      age: null,
      height_cm: null,
      weight_kg: null,
      appearance_roll: null,
      appearance: null,
      appearance_notes: null,
      description_notes: null,
      fate_points: 0,
    },
  );
  const [characterStats, setCharacterStats] = useState(props.characterStats);
  const [characterTraits, setCharacterTraits] = useState(props.characterTraits);
  const [chaos, setChaos] = useState<ChaosRow>(
    props.chaos ?? {
      chaos_index: 0,
      chaos_track: 0,
      chaos_dice: 0,
      chaos_power_calculator: 0,
      notes: null,
    },
  );
  const [lifePoints, setLifePoints] = useState<LifePointsRow>(
    props.lifePoints ?? {
      current_life_points: 0,
      dm_activity_modifier: 0,
      has_activity_penalty_reduction: false,
      notes: null,
    },
  );

  const statByCode = useMemo(
    () =>
      new Map(
        props.stats
          .filter((s): s is StatLookup & { code: string } => s.code != null)
          .map((s) => [s.code, s]),
      ),
    [props.stats],
  );
  const statById = useMemo(
    () => new Map(props.stats.map((s) => [s.id, s])),
    [props.stats],
  );
  const traitByName = useMemo(
    () => new Map(props.traits.map((t) => [t.name, t])),
    [props.traits],
  );
  const characterStatById = useMemo(
    () => new Map(characterStats.map((s) => [s.stat_id, s])),
    [characterStats],
  );
  const characterTraitById = useMemo(
    () => new Map(characterTraits.map((t) => [t.trait_id, t])),
    [characterTraits],
  );

  const raceStatById = useMemo(
    () => indexBy(props.raceStatMods, "stat_id"),
    [props.raceStatMods],
  );
  const raceTraitById = useMemo(
    () => indexBy(props.raceTraitMods, "trait_id"),
    [props.raceTraitMods],
  );
  const bpStatById = useMemo(
    () => indexBy(props.bpStatMods, "stat_id"),
    [props.bpStatMods],
  );
  const bpTraitById = useMemo(
    () => indexBy(props.bpTraitMods, "trait_id"),
    [props.bpTraitMods],
  );

  const talentStatBonusById = useMemo(
    () => new Map(props.talentStatBonuses),
    [props.talentStatBonuses],
  );
  const talentTraitBonusById = useMemo(
    () => new Map(props.talentTraitBonuses),
    [props.talentTraitBonuses],
  );
  const adolescentTraitRanksById = useMemo(
    () => new Map(props.adolescentTraitGrants),
    [props.adolescentTraitGrants],
  );

  const computedStatRows = useMemo(
    () =>
      STAT_DISPLAY_ORDER.map((code) => {
        const stat = statByCode.get(code);
        if (!stat) return null;
        const cs = characterStatById.get(stat.id);
        const raceMod = (raceStatById.get(stat.id) ?? 0) + (bpStatById.get(stat.id) ?? 0);
        const row = computeStatRow({
          stat_id: stat.id,
          stat_bonus: cs?.stat_bonus ?? 0,
          race_modifier: raceMod,
          special_modifier: cs?.special_modifier ?? 0,
          talent_bonus: talentStatBonusById.get(stat.id) ?? 0,
        });
        return { stat, row, character_stat: cs };
      }).filter((entry) => entry !== null),
    [statByCode, characterStatById, raceStatById, bpStatById, talentStatBonusById],
  );

  const statTotalById = useMemo(
    () => new Map(computedStatRows.map((e) => [e.stat.id, e.row.total])),
    [computedStatRows],
  );

  const computedTraitRows = useMemo(
    () =>
      TRAIT_DISPLAY_ORDER.map((traitName) => {
        const trait = traitByName.get(traitName);
        if (!trait) return null;
        const ct = characterTraitById.get(trait.id);
        const playerRanks = ct?.ranks ?? 0;
        const adolRanks = adolescentTraitRanksById.get(trait.id) ?? 0;
        const row = computeTraitRow({
          trait_id: trait.id,
          ranks: playerRanks + adolRanks,
          primary_stat_total: trait.primary_stat_id
            ? statTotalById.get(trait.primary_stat_id) ?? 0
            : 0,
          secondary_stat_total: trait.secondary_stat_id
            ? statTotalById.get(trait.secondary_stat_id) ?? 0
            : 0,
          race_modifier: raceTraitById.get(trait.id) ?? 0,
          birthplace_modifier: bpTraitById.get(trait.id) ?? 0,
          talent_bonus:
            (ct?.talent_bonus ?? 0) +
            (talentTraitBonusById.get(trait.id) ?? 0),
          special_modifier: ct?.special_modifier ?? 0,
          gm_bonus: ct?.gm_bonus ?? 0,
          temp_modifier: ct?.temp_modifier ?? 0,
        });
        return { trait, row, character_trait: ct, adolescent_ranks: adolRanks };
      }).filter((entry) => entry !== null),
    [
      traitByName,
      characterTraitById,
      raceTraitById,
      bpTraitById,
      statTotalById,
      talentTraitBonusById,
      adolescentTraitRanksById,
    ],
  );

  const presenceTotal =
    statTotalById.get(statByCode.get("PR")?.id ?? "") ?? 0;
  const computedAppearance =
    description.appearance_roll != null
      ? description.appearance_roll + presenceTotal
      : null;

  // ----- mutations -----

  async function updateCharacter(patch: Partial<CharacterRow>) {
    const prev = character;
    setCharacter((c) => ({ ...c, ...patch }));
    const { error } = await supabase
      .from("characters")
      .update(patch)
      .eq("id", props.characterId);
    if (error) {
      setCharacter(prev);
      toast.error(`Failed to save: ${error.message}`);
    }
  }

  async function updateDescription(patch: Partial<DescriptionRow>) {
    const prev = description;
    setDescription((d) => ({ ...d, ...patch }));
    const { error } = await supabase
      .from("character_description")
      .upsert(
        { character_id: props.characterId, ...description, ...patch },
        { onConflict: "character_id" },
      );
    if (error) {
      setDescription(prev);
      toast.error(`Failed to save: ${error.message}`);
    }
  }

  async function updateStat(
    rowId: string,
    statId: string,
    patch: { base_value?: number; stat_bonus?: number; special_modifier?: number },
  ) {
    const prev = characterStats;
    setCharacterStats((rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    );
    const { error } = await supabase
      .from("character_stats")
      .update(patch)
      .eq("id", rowId);
    if (error) {
      setCharacterStats(prev);
      toast.error(`Failed to save ${statById.get(statId)?.code ?? "stat"}: ${error.message}`);
    }
  }

  async function updateTrait(
    rowId: string,
    patch: { ranks?: number; special_modifier?: number },
  ) {
    const prev = characterTraits;
    setCharacterTraits((rows) =>
      rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
    );
    const { error } = await supabase
      .from("character_traits")
      .update(patch)
      .eq("id", rowId);
    if (error) {
      setCharacterTraits(prev);
      toast.error(`Failed to save trait: ${error.message}`);
    }
  }

  async function updateChaos(patch: Partial<ChaosRow>) {
    const prev = chaos;
    setChaos((c) => ({ ...c, ...patch }));
    const { error } = await supabase
      .from("character_chaos")
      .upsert(
        { character_id: props.characterId, ...chaos, ...patch },
        { onConflict: "character_id" },
      );
    if (error) {
      setChaos(prev);
      toast.error(`Failed to save chaos: ${error.message}`);
    }
  }

  async function updateLifePoints(patch: Partial<LifePointsRow>) {
    const prev = lifePoints;
    setLifePoints((c) => ({ ...c, ...patch }));
    const merged = { ...lifePoints, ...patch };
    const { error } = await supabase
      .from("character_life_points")
      .upsert(
        {
          character_id: props.characterId,
          current_life_points: merged.current_life_points ?? 0,
          dm_activity_modifier: merged.dm_activity_modifier ?? 0,
          has_activity_penalty_reduction:
            merged.has_activity_penalty_reduction ?? false,
          notes: merged.notes,
        },
        { onConflict: "character_id" },
      );
    if (error) {
      setLifePoints(prev);
      toast.error(`Failed to save life points: ${error.message}`);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <IdentityCard
        character={character}
        description={description}
        appearance={computedAppearance}
        races={props.races}
        birthplaces={props.birthplaces}
        professions={props.professions}
        raceSexes={props.raceSexes}
        onUpdateCharacter={updateCharacter}
        onUpdateDescription={updateDescription}
      />

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Stats
        </h2>
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Stat</th>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium text-right">Pct</th>
                <th className="px-3 py-2 font-medium text-right">Bonus</th>
                <th className="px-3 py-2 font-medium text-right">Race</th>
                <th className="px-3 py-2 font-medium text-right">Talent</th>
                <th className="px-3 py-2 font-medium text-right">Special</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {computedStatRows.map(({ stat, row, character_stat }) => (
                <tr key={stat.id}>
                  <td className="px-3 py-2 font-medium">{stat.name}</td>
                  <td className="px-3 py-2 text-zinc-500">{stat.code}</td>
                  <td className="px-3 py-2 text-right">
                    {character_stat ? (
                      <EditableNumber
                        className="ml-auto w-20"
                        value={character_stat.base_value}
                        min={1}
                        max={100}
                        onCommit={(next) => {
                          const bonus = bonusForStatValue(next, props.statProgression);
                          updateStat(character_stat.id, stat.id, {
                            base_value: next,
                            stat_bonus: bonus,
                          });
                        }}
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.stat_bonus}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                    {signed(row.race_modifier)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                    {row.talent_bonus === 0 ? "—" : signed(row.talent_bonus)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {character_stat ? (
                      <EditableNumber
                        className="ml-auto w-16"
                        value={character_stat.special_modifier}
                        onCommit={(next) =>
                          updateStat(character_stat.id, stat.id, {
                            special_modifier: next,
                          })
                        }
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Traits
        </h2>
        <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Trait</th>
                <th className="px-3 py-2 font-medium text-right">Race</th>
                <th className="px-3 py-2 font-medium text-right">Birthplace</th>
                <th className="px-3 py-2 font-medium text-right">Ranks</th>
                <th className="px-3 py-2 font-medium text-right">Stat Sum</th>
                <th className="px-3 py-2 font-medium text-right">Talent</th>
                <th className="px-3 py-2 font-medium text-right">Special</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {computedTraitRows.map(({ trait, row, character_trait, adolescent_ranks }) => (
                <tr key={trait.id}>
                  <td className="px-3 py-2 font-medium">
                    {trait.name}
                    {adolescent_ranks > 0 && (
                      <span
                        title="Free adolescent ranks from your birthplace"
                        className="ml-2 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700"
                      >
                        +{adolescent_ranks} adol
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                    {signed(row.race_modifier)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                    {signed(row.birthplace_modifier)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {character_trait ? (
                      <div className="flex items-center justify-end gap-2">
                        <NumberStepper
                          value={character_trait.ranks}
                          min={0}
                          max={20}
                          onCommit={(next) =>
                            updateTrait(character_trait.id, { ranks: next })
                          }
                        />
                        <span className="w-8 text-right tabular-nums text-zinc-500">
                          {row.ranks_value === 0 ? "0" : signed(row.ranks_value)}
                        </span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.stat_value}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                    {row.talent_bonus === 0 ? "—" : signed(row.talent_bonus)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {character_trait ? (
                      <EditableNumber
                        className="ml-auto w-16"
                        value={character_trait.special_modifier}
                        onCommit={(next) =>
                          updateTrait(character_trait.id, {
                            special_modifier: next,
                          })
                        }
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">
                    {row.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <ChaosCard chaos={chaos} onUpdate={updateChaos} />
        <LifePointsCard lifePoints={lifePoints} onUpdate={updateLifePoints} />
      </div>
    </div>
  );
}

function IdentityCard({
  character,
  description,
  appearance,
  races,
  birthplaces,
  professions,
  raceSexes,
  onUpdateCharacter,
  onUpdateDescription,
}: {
  character: CharacterRow;
  description: DescriptionRow;
  appearance: number | null;
  races: NamedRow[];
  birthplaces: NamedRow[];
  professions: NamedRow[];
  raceSexes: RaceSex[];
  onUpdateCharacter: (patch: Partial<CharacterRow>) => void;
  onUpdateDescription: (patch: Partial<DescriptionRow>) => void;
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
        Identity
      </h2>
      <div className="mt-3 grid gap-x-4 gap-y-3 text-sm md:grid-cols-3">
        <FieldEditor label="Character name">
          <EditableText
            value={character.character_name ?? character.name}
            onCommit={(next) =>
              onUpdateCharacter({ character_name: next || null })
            }
          />
        </FieldEditor>
        <FieldEditor label="Player name">
          <EditableText
            value={character.player_name}
            onCommit={(next) => onUpdateCharacter({ player_name: next || null })}
          />
        </FieldEditor>
        <FieldEditor label="Profession Adaptability">
          <label className="inline-flex h-7 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!character.has_profession_adaptability}
              onChange={(e) =>
                onUpdateCharacter({ has_profession_adaptability: e.target.checked })
              }
            />
            <span className="text-zinc-600">+15 DP at L1</span>
          </label>
        </FieldEditor>

        <FieldEditor label="Race">
          <div className="flex flex-col gap-1">
            <NullableSelect
              value={description.race_id}
              options={races}
              placeholder="Select race"
              onChange={(id) =>
                onUpdateDescription({ race_id: id, sex_id: null })
              }
            />
            {description.race_id && (
              <span
                title="race_adolescent_rank_rules has no data yet (plan §10)"
                className="text-xs text-amber-700"
              >
                Race adolescent grants: TBD (not yet seeded)
              </span>
            )}
          </div>
        </FieldEditor>
        <FieldEditor label="Profession">
          <NullableSelect
            value={description.profession_id}
            options={professions}
            placeholder={professions.length ? "Select profession" : "No data"}
            onChange={(id) => onUpdateDescription({ profession_id: id })}
            disabled={professions.length === 0}
          />
        </FieldEditor>
        <FieldEditor label="Birthplace">
          <NullableSelect
            value={description.birthplace_id}
            options={birthplaces}
            placeholder="Select birthplace"
            onChange={(id) => onUpdateDescription({ birthplace_id: id })}
          />
        </FieldEditor>
        <FieldEditor label="Sex">
          <NullableSelect
            value={description.sex_id}
            options={raceSexes}
            placeholder={raceSexes.length ? "Select sex" : "Pick a race first"}
            onChange={(id) => onUpdateDescription({ sex_id: id })}
            disabled={raceSexes.length === 0}
          />
        </FieldEditor>
        <FieldEditor label="Age">
          <EditableNumber
            value={description.age}
            min={0}
            max={9999}
            onCommit={(next) => onUpdateDescription({ age: next })}
          />
        </FieldEditor>

        <FieldEditor label="Height (cm)">
          <EditableNumber
            value={description.height_cm}
            min={0}
            max={400}
            onCommit={(next) => onUpdateDescription({ height_cm: next })}
          />
        </FieldEditor>
        <FieldEditor label="Weight (kg)">
          <EditableNumber
            value={description.weight_kg}
            min={0}
            max={500}
            onCommit={(next) => onUpdateDescription({ weight_kg: next })}
          />
        </FieldEditor>
        <FieldEditor label="Fate points">
          <EditableNumber
            value={description.fate_points}
            min={0}
            max={20}
            onCommit={(next) => onUpdateDescription({ fate_points: next })}
          />
        </FieldEditor>

        <FieldEditor label="Appearance roll">
          <EditableNumber
            value={description.appearance_roll}
            min={1}
            max={100}
            onCommit={(next) => onUpdateDescription({ appearance_roll: next })}
          />
        </FieldEditor>
        <FieldEditor label="Appearance">
          <div className="flex h-7 items-center text-sm font-medium tabular-nums">
            {appearance ?? "—"}
          </div>
        </FieldEditor>
      </div>

      <div className="mt-4">
        <FieldEditor label="Appearance notes">
          <EditableText
            value={description.appearance_notes}
            placeholder="Eyes, hair, scars…"
            onCommit={(next) =>
              onUpdateDescription({ appearance_notes: next || null })
            }
          />
        </FieldEditor>
      </div>
    </section>
  );
}

function ChaosCard({
  chaos,
  onUpdate,
}: {
  chaos: ChaosRow;
  onUpdate: (patch: Partial<ChaosRow>) => void;
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
        Chaos
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <FieldEditor label="Index">
          <EditableNumber
            value={chaos.chaos_index}
            min={0}
            onCommit={(next) => onUpdate({ chaos_index: next })}
          />
        </FieldEditor>
        <FieldEditor label="Track">
          <EditableNumber
            value={chaos.chaos_track}
            min={0}
            onCommit={(next) => onUpdate({ chaos_track: next })}
          />
        </FieldEditor>
        <FieldEditor label="Dice">
          <EditableNumber
            value={chaos.chaos_dice}
            min={0}
            onCommit={(next) => onUpdate({ chaos_dice: next })}
          />
        </FieldEditor>
        <FieldEditor label="Power calculator">
          <EditableNumber
            value={chaos.chaos_power_calculator}
            min={0}
            onCommit={(next) => onUpdate({ chaos_power_calculator: next })}
          />
        </FieldEditor>
      </div>
    </section>
  );
}

function LifePointsCard({
  lifePoints,
  onUpdate,
}: {
  lifePoints: LifePointsRow;
  onUpdate: (patch: Partial<LifePointsRow>) => void;
}) {
  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
        Life Points
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <FieldEditor label="Current">
          <EditableNumber
            value={lifePoints.current_life_points}
            onCommit={(next) => onUpdate({ current_life_points: next })}
          />
        </FieldEditor>
        <FieldEditor label="DM activity mod">
          <EditableNumber
            value={lifePoints.dm_activity_modifier}
            onCommit={(next) => onUpdate({ dm_activity_modifier: next })}
          />
        </FieldEditor>
        <FieldEditor label="Activity penalty reduction">
          <label className="inline-flex h-7 items-center gap-2">
            <input
              type="checkbox"
              checked={!!lifePoints.has_activity_penalty_reduction}
              onChange={(e) =>
                onUpdate({ has_activity_penalty_reduction: e.target.checked })
              }
            />
            <span className="text-zinc-600">Yes</span>
          </label>
        </FieldEditor>
      </div>
    </section>
  );
}

function FieldEditor({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      {children}
    </div>
  );
}

function NullableSelect({
  value,
  options,
  placeholder,
  onChange,
  disabled,
}: {
  value: string | null;
  options: NamedRow[];
  placeholder: string;
  onChange: (next: string | null) => void;
  disabled?: boolean;
}) {
  const labelById = new Map(options.map((o) => [o.id, o.name]));
  return (
    <Select
      value={value ?? ""}
      onValueChange={(next) => onChange(next === "" ? null : next)}
      disabled={disabled}
    >
      <SelectTrigger size="sm" className="w-full">
        <SelectValue placeholder={placeholder}>
          {(current) => labelById.get(current as string) ?? placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
