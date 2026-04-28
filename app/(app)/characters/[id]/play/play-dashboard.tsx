"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EditableNumber } from "@/components/sheet/editable-number";
import { LifePointsPanel } from "@/components/sheet/life-points-panel";
import type { ActivityModifierRule } from "@/lib/domain/combat";
import { createClient } from "@/lib/supabase/client";

interface StatRow {
  id: string;
  code: string;
  total: number;
}

interface NamedTotal {
  name: string;
  total: number;
}

interface SkillGroup {
  id: string;
  name: string;
  total: number;
  skills: Array<{ id: string; name: string; total: number }>;
}

interface GameValueState {
  gameValueId: string;
  base: number;
  total: number;
  label: string;
}

export interface PlayDashboardProps {
  characterId: string;
  hasDescriptionRow: boolean;
  hasLifePointsRow: boolean;
  hasChaosRow: boolean;
  fatePoints: number;
  currentLp: number | null;
  maxLp: number;
  permanentMod: number;
  activityRules: ActivityModifierRule[];
  deathThreshold: number;
  stats: StatRow[];
  traitsReadout: NamedTotal[];
  skillGroups: SkillGroup[];
  chaos: {
    index: number;
    track: number;
    dice: number;
    powerCalculator: number | null;
  };
  initiative: GameValueState | null;
  combatPerception: GameValueState | null;
  perceptionPassive: GameValueState | null;
  perceptionActive: GameValueState | null;
  quickPerception: GameValueState | null;
}

export function PlayDashboard(props: PlayDashboardProps) {
  const supabase = useMemo(() => createClient(), []);
  const [fatePoints, setFatePoints] = useState(props.fatePoints);
  const [chaos, setChaos] = useState(props.chaos);

  // ---- mutations ----

  async function commitFatePoints(next: number) {
    const prev = fatePoints;
    setFatePoints(next);
    const { error } = await supabase
      .from("character_description")
      .upsert(
        { character_id: props.characterId, fate_points: next },
        { onConflict: "character_id" },
      );
    if (error) {
      setFatePoints(prev);
      toast.error(`Failed to save Fate Points: ${error.message}`);
    }
  }

  async function commitGameValueBase(gameValueId: string, next: number) {
    const { error } = await supabase
      .from("character_game_values")
      .upsert(
        {
          character_id: props.characterId,
          game_value_id: gameValueId,
          base_value: next,
        },
        { onConflict: "character_id,game_value_id" },
      );
    if (error) toast.error(`Failed to save: ${error.message}`);
  }

  async function commitChaos(patch: Partial<typeof chaos>) {
    const prev = chaos;
    const next = { ...chaos, ...patch };
    setChaos(next);
    const { error } = await supabase
      .from("character_chaos")
      .upsert(
        {
          character_id: props.characterId,
          chaos_index: next.index,
          chaos_track: next.track,
          chaos_dice: next.dice,
          chaos_power_calculator: next.powerCalculator,
        },
        { onConflict: "character_id" },
      );
    if (error) {
      setChaos(prev);
      toast.error(`Failed to save chaos: ${error.message}`);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      {/* ─── Status row ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Stats
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm tabular-nums">
              {props.stats.map((s) => (
                <div key={s.id} className="flex justify-between">
                  <span className="text-zinc-500">{s.code}</span>
                  <span className="font-medium">
                    {s.total > 0 ? "+" : ""}
                    {s.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <LifePointsPanel
            characterId={props.characterId}
            initialCurrentLp={props.currentLp}
            maxLp={props.maxLp}
            initialPermanentMod={props.permanentMod}
            rules={props.activityRules}
            deathThreshold={props.deathThreshold}
            hasLifePointsRow={props.hasLifePointsRow}
          />

          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Traits
            </div>
            <ul className="mt-2 space-y-1 text-sm tabular-nums">
              {props.traitsReadout.map((t) => (
                <li key={t.name} className="flex justify-between">
                  <span className="text-zinc-600">{t.name}</span>
                  <span className="font-medium">{t.total}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Initiative
                </div>
                <div className="mt-1 max-w-24">
                  {props.initiative ? (
                    <EditableNumber
                      value={props.initiative.base}
                      onCommit={(next) =>
                        commitGameValueBase(props.initiative!.gameValueId, next)
                      }
                    />
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Fate Points
                </div>
                <div className="mt-1 max-w-24">
                  <EditableNumber
                    value={fatePoints}
                    onCommit={commitFatePoints}
                    min={0}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Perception
            </div>
            <div className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <PerceptionRow
                label="Passive"
                state={props.perceptionPassive}
                onCommit={commitGameValueBase}
              />
              <PerceptionRow
                label="Active"
                state={props.perceptionActive}
                onCommit={commitGameValueBase}
              />
              <PerceptionRow
                label="Combat"
                state={props.combatPerception}
                onCommit={commitGameValueBase}
              />
              <PerceptionRow
                label="Quick"
                state={props.quickPerception}
                onCommit={commitGameValueBase}
              />
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Chaos
            </div>
            <div className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
              <div>
                <label className="text-xs text-zinc-500">Index</label>
                <div className="mt-1">
                  <EditableNumber
                    value={chaos.index}
                    onCommit={(next) => commitChaos({ index: next })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500">Track</label>
                <div className="mt-1">
                  <EditableNumber
                    value={chaos.track}
                    onCommit={(next) => commitChaos({ track: next })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-500">Dice</label>
                <div className="mt-1">
                  <EditableNumber
                    value={chaos.dice}
                    min={0}
                    onCommit={(next) => commitChaos({ dice: next })}
                  />
                </div>
              </div>
            </div>
            <div className="mt-3 rounded border border-dashed border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-500">
              <div className="font-medium text-zinc-600">
                Chaos Power Calculator
              </div>
              <p className="mt-0.5 italic">
                TODO — magic system stubbed in the source sheet (cell I10).
                Deferred per phase 5 plan §9.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Skill grid ──────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Categories &amp; Skills
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {props.skillGroups.map((group) => (
            <div
              key={group.id}
              className="rounded-md border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-baseline justify-between border-b border-zinc-100 pb-2">
                <span className="text-sm font-semibold text-zinc-700">
                  {group.name}
                </span>
                <span className="tabular-nums text-sm font-semibold">
                  {group.total}
                </span>
              </div>
              {group.skills.length > 0 ? (
                <ul className="mt-2 space-y-0.5 text-sm tabular-nums">
                  {group.skills.map((s) => (
                    <li key={s.id} className="flex justify-between">
                      <span className="text-zinc-600">{s.name}</span>
                      <span>{s.total}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-zinc-400 italic">
                  No skills in this category.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PerceptionRow({
  label,
  state,
  onCommit,
}: {
  label: string;
  state: GameValueState | null;
  onCommit: (gameValueId: string, next: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-zinc-600">{label}</span>
      {state ? (
        <div className="w-20">
          <EditableNumber
            value={state.base}
            onCommit={(next) => onCommit(state.gameValueId, next)}
          />
        </div>
      ) : (
        <span className="text-zinc-400">—</span>
      )}
    </div>
  );
}
