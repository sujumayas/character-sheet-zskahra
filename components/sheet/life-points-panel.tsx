"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EditableNumber } from "@/components/sheet/editable-number";
import {
  activityModifier,
  activityThresholdLabels,
  type ActivityModifierRule,
} from "@/lib/domain/combat";
import { createClient } from "@/lib/supabase/client";

export interface LifePointsPanelProps {
  characterId: string;
  initialCurrentLp: number | null;
  maxLp: number;
  initialPermanentMod: number;
  rules: ActivityModifierRule[];
  deathThreshold: number; // negative number, e.g. -64
  hasLifePointsRow: boolean;
  /** When true, hides the Permanent Mod editor (player view). */
  hidePermanentMod?: boolean;
}

export function LifePointsPanel(props: LifePointsPanelProps) {
  const supabase = useMemo(() => createClient(), []);
  const [currentLp, setCurrentLp] = useState(
    props.initialCurrentLp ?? props.maxLp,
  );
  const [permanentMod, setPermanentMod] = useState(props.initialPermanentMod);

  const activity = activityModifier(
    currentLp,
    props.maxLp,
    props.rules,
    permanentMod,
  );
  const labels = activityThresholdLabels(props.maxLp, props.rules);

  async function commit(patch: { currentLp?: number; permanentMod?: number }) {
    const next = { currentLp, permanentMod, ...patch };
    const prev = { currentLp, permanentMod };
    if (patch.currentLp !== undefined) setCurrentLp(patch.currentLp);
    if (patch.permanentMod !== undefined) setPermanentMod(patch.permanentMod);

    const { error } = await supabase
      .from("character_life_points")
      .upsert(
        {
          character_id: props.characterId,
          current_life_points: next.currentLp,
          dm_activity_modifier: next.permanentMod,
        },
        { onConflict: "character_id" },
      );
    if (error) {
      setCurrentLp(prev.currentLp);
      setPermanentMod(prev.permanentMod);
      toast.error(`Failed to save LP: ${error.message}`);
    }
  }

  const lpRatio =
    props.maxLp > 0 ? Math.max(0, Math.min(1, currentLp / props.maxLp)) : 0;
  const lpColor =
    lpRatio > 0.75
      ? "bg-emerald-500"
      : lpRatio > 0.5
        ? "bg-amber-400"
        : lpRatio > 0.25
          ? "bg-orange-500"
          : "bg-red-600";

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-xs uppercase tracking-wide text-zinc-500">
              Life Points
            </span>
            <span className="text-xs tabular-nums text-zinc-500">
              max {props.maxLp}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="w-24">
              <EditableNumber
                value={currentLp}
                onCommit={(next) => commit({ currentLp: next })}
              />
            </div>
            <span className="text-zinc-400">/</span>
            <span className="text-lg tabular-nums text-zinc-700">
              {props.maxLp}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full transition-all ${lpColor}`}
              style={{ width: `${lpRatio * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Activity Modifier
          </div>
          <div
            className={`mt-1 text-2xl font-semibold tabular-nums ${
              activity < 0 ? "text-red-700" : "text-zinc-900"
            }`}
          >
            {activity > 0 ? "+" : ""}
            {activity}
          </div>
          <ul className="mt-2 space-y-0.5 text-xs text-zinc-500 tabular-nums">
            {labels.map((l) => (
              <li
                key={l.threshold_percent}
                className={
                  currentLp <= l.lp_threshold ? "font-semibold text-red-700" : ""
                }
              >
                ≤{l.lp_threshold} ({l.threshold_percent}%) → {l.modifier}
              </li>
            ))}
            <li className="text-zinc-400">Death at {props.deathThreshold}</li>
          </ul>
        </div>
      </div>

      {!props.hidePermanentMod && (
        <div className="mt-4 flex items-center gap-3">
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Permanent Mod
          </label>
          <div className="w-20">
            <EditableNumber
              value={permanentMod}
              onCommit={(next) => commit({ permanentMod: next })}
            />
          </div>
          <span className="text-xs text-zinc-500">
            Stacks on top of activity modifier (DM-applied wound penalties).
          </span>
        </div>
      )}
    </div>
  );
}
