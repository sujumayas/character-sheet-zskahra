"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EditableNumber } from "@/components/sheet/editable-number";
import { LifePointsPanel } from "@/components/sheet/life-points-panel";
import {
  type ActivityModifierRule,
  dodgeManeuver,
  initiativeWithShield,
  MOVEMENT_TIERS,
} from "@/lib/domain/combat";
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

interface WeaponTotal {
  weapon_id: string;
  name: string;
  stat_code: string;
  ranks: number;
  total: number;
}

interface ArmorRow {
  body_part_id: string;
  body_part_name: string;
  armor_type_name: string;
  bonus: number;
  total: number;
  penalty: number;
}

interface ShieldDetails {
  name: string;
  activeDb: number;
  hitsRemaining: number;
  hitsTotal: number;
  critDamage: string;
  critSize: string;
  hits_used: number;
}

interface GameValueState {
  gameValueId: string;
  base: number;
  total: number;
  label: string;
}

export interface CombatDashboardProps {
  characterId: string;
  level: number | null;
  hasDescriptionRow: boolean;
  hasLifePointsRow: boolean;
  fatePoints: number;
  currentLp: number | null;
  maxLp: number;
  permanentMod: number;
  activityRules: ActivityModifierRule[];
  deathThreshold: number;
  stats: StatRow[];
  traitsReadout: NamedTotal[];
  quTotal: number;
  acrobaticsTotal: number;
  weaponTotals: WeaponTotal[];
  categoryTotals: NamedTotal[];
  skillTotals: NamedTotal[];
  armorBd: number;
  armorPenalty: number;
  armorRows: ArmorRow[];
  shield: ShieldDetails | null;
  initiative: GameValueState | null;
  db: GameValueState | null;
  dbShield: GameValueState | null;
  perceptionPassive: GameValueState | null;
  perceptionActive: GameValueState | null;
  combatPerception: GameValueState | null;
  quickPerception: GameValueState | null;
  bmrNoArmor: GameValueState | null;
  bmrWithArmor: GameValueState | null;
}

const COMBAT_STYLES = ["Dirty Fighting", "Double Weapon", "Weapon & Shield", "Two Weapon Combo"];
const DEFENSIVE_MANEUVERS = ["Acrobatics", "Jumping", "Wrestling", "Brawling"];
const WARFARE_SKILLS = ["Command", "Logistics", "Strategy", "Tactics"];
const EXPLORATION = ["Climbing", "Ambush", "Sniping", "Stalking/Hiding"];
const ANIMAL = ["Animal Handling", "Beastmastery", "Mounted Combat", "Riding"];

export function CombatDashboard(props: CombatDashboardProps) {
  const supabase = useMemo(() => createClient(), []);
  const [fatePoints, setFatePoints] = useState(props.fatePoints);

  const skillByName = useMemo(
    () => new Map(props.skillTotals.map((s) => [s.name, s.total])),
    [props.skillTotals],
  );
  const categoryByName = useMemo(
    () => new Map(props.categoryTotals.map((c) => [c.name, c.total])),
    [props.categoryTotals],
  );

  const dodge = dodgeManeuver(props.quTotal, props.acrobaticsTotal);
  const initShield =
    props.initiative != null
      ? initiativeWithShield(props.initiative.total)
      : null;

  const armorPenalty = props.armorPenalty;

  function withPenalty(value: number): string {
    return `${value} | ${value + armorPenalty}`;
  }

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
    if (error) {
      toast.error(`Failed to save: ${error.message}`);
    }
  }

  async function commitShieldHits(next: number) {
    if (!props.shield) return;
    const { error } = await supabase
      .from("character_shield")
      .update({ hits_used: next })
      .eq("character_id", props.characterId);
    if (error) {
      toast.error(`Failed to save shield hits: ${error.message}`);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      {/* ─── Status row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Stats + Traits + LP */}
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
        </div>

        {/* Initiative + Perception + Fate + Traits */}
        <div className="space-y-4">
          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-zinc-500">
                  Initiative (base)
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
                <p className="mt-1 text-xs text-zinc-500">
                  w/Shield: {initShield ?? "—"} (−5)
                </p>
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
      </div>

      {/* ─── Defense ────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Defense
        </h2>
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ScalarBlock
              label="DB base"
              state={props.db}
              onCommit={commitGameValueBase}
            />
            <ScalarBlock
              label="Shield DB"
              state={props.dbShield}
              onCommit={commitGameValueBase}
            />
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Armor DB
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">
                {props.armorBd}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Sum across {props.armorRows.length} body parts.
              </p>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-zinc-500">
                Armor Penalty
              </div>
              <div
                className={`mt-1 text-2xl font-semibold tabular-nums ${
                  armorPenalty < 0 ? "text-red-700" : "text-zinc-900"
                }`}
              >
                {armorPenalty}
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Applied as a global penalty to skill rolls (right-side
                values below).
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-md border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Body Part</th>
                  <th className="px-3 py-2 font-medium">Material</th>
                  <th className="px-3 py-2 font-medium text-right">Total DB</th>
                  <th className="px-3 py-2 font-medium text-right">Penalty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {props.armorRows.map((r) => (
                  <tr key={r.body_part_id}>
                    <td className="px-3 py-2 font-medium">{r.body_part_name}</td>
                    <td className="px-3 py-2 text-zinc-500">
                      {r.armor_type_name}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {r.total}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${
                        r.penalty < 0 ? "text-red-700" : "text-zinc-500"
                      }`}
                    >
                      {r.penalty}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {props.shield && (
            <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50/40 p-3">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Shield
                  </div>
                  <div className="mt-1 font-medium">{props.shield.name}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Active DB
                  </div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">
                    {props.shield.activeDb}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Crit
                  </div>
                  <div className="mt-1 capitalize">
                    {props.shield.critDamage} − {props.shield.critSize}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500">
                    Hits used
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-20">
                      <EditableNumber
                        value={props.shield.hits_used}
                        min={0}
                        onCommit={commitShieldHits}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 tabular-nums">
                      / {props.shield.hitsTotal}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Offensive Bonus ────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Offensive Bonus / Weapon Dexterity
        </h2>
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Weapon</th>
                <th className="px-3 py-2 font-medium">Stat</th>
                <th className="px-3 py-2 font-medium text-right">Ranks</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
                <th className="px-3 py-2 font-medium text-right">+armor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {props.weaponTotals.map((w) => (
                <tr key={w.weapon_id}>
                  <td className="px-3 py-2 font-medium">{w.name}</td>
                  <td className="px-3 py-2 text-zinc-500">{w.stat_code}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                    {w.ranks}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {w.total}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-zinc-500">
                    {w.total + armorPenalty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Maneuvers & Combat Skills ──────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Maneuvers & Combat Skills
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SkillCard
            title="Combat Styles"
            categoryName="Combat Styles"
            categoryTotal={categoryByName.get("Combat Styles") ?? 0}
            skills={COMBAT_STYLES}
            skillByName={skillByName}
            withPenalty={withPenalty}
          />
          <SkillCard
            title="Defensive Maneuvers"
            specialRow={{
              label: "Dodge Maneuver",
              value: dodge,
              hint: "max(qu×2, Acrobatics) + 20",
            }}
            skills={DEFENSIVE_MANEUVERS}
            skillByName={skillByName}
            withPenalty={withPenalty}
          />
          <SkillCard
            title="Warfare"
            categoryName="Warfare"
            categoryTotal={categoryByName.get("Warfare") ?? 0}
            skills={WARFARE_SKILLS}
            skillByName={skillByName}
            withPenalty={withPenalty}
          />
          <SkillCard
            title="Exploration / Stealth"
            skills={EXPLORATION}
            skillByName={skillByName}
            withPenalty={withPenalty}
          />
          <SkillCard
            title="Animal & Mount"
            skills={ANIMAL}
            skillByName={skillByName}
            withPenalty={withPenalty}
          />
          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Magic — Weaving (stub)
            </div>
            <ul className="mt-2 space-y-1 text-sm tabular-nums">
              <li className="flex justify-between text-zinc-400">
                <span>Spell slot 1</span>
                <span className="italic">TODO</span>
              </li>
              <li className="flex justify-between text-zinc-400">
                <span>Spell slot 2</span>
                <span className="italic">TODO</span>
              </li>
              <li className="flex justify-between">
                <span className="text-zinc-700">Attunement</span>
                <span>{skillByName.get("Attunement") ?? "—"}</span>
              </li>
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              Magic system not finalized; deferred per phase 5 plan §2 row #11.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Movement ───────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Movement
        </h2>
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <ScalarBlock
              label="BMR (no armor)"
              state={props.bmrNoArmor}
              onCommit={commitGameValueBase}
            />
            <ScalarBlock
              label="BMR (with armor)"
              state={props.bmrWithArmor}
              onCommit={commitGameValueBase}
            />
          </div>
          <div className="mt-4 overflow-x-auto rounded-md border border-zinc-200">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Pace</th>
                  <th className="px-3 py-2 font-medium text-right">×</th>
                  <th className="px-3 py-2 font-medium text-right">No armor</th>
                  <th className="px-3 py-2 font-medium text-right">With armor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {MOVEMENT_TIERS.map((tier) => (
                  <tr key={tier.name}>
                    <td className="px-3 py-2 font-medium">{tier.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-500">
                      ×{tier.multiplier}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {props.bmrNoArmor
                        ? props.bmrNoArmor.total * tier.multiplier
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {props.bmrWithArmor
                        ? props.bmrWithArmor.total * tier.multiplier
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            BMR ladder (height + Quickness → base BMR) not yet seeded; edit the
            two values above directly.
          </p>
        </div>
      </section>
    </div>
  );
}

function ScalarBlock({
  label,
  state,
  onCommit,
}: {
  label: string;
  state: GameValueState | null;
  onCommit: (gameValueId: string, next: number) => void;
}) {
  if (!state) {
    return (
      <div>
        <div className="text-xs uppercase tracking-wide text-zinc-500">
          {label}
        </div>
        <div className="mt-1 text-zinc-400">—</div>
      </div>
    );
  }
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className="w-20">
          <EditableNumber
            value={state.base}
            onCommit={(next) => onCommit(state.gameValueId, next)}
          />
        </div>
        <span className="text-xs tabular-nums text-zinc-400">
          total {state.total}
        </span>
      </div>
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

interface SkillCardProps {
  title: string;
  categoryName?: string;
  categoryTotal?: number;
  specialRow?: { label: string; value: number; hint?: string };
  skills: string[];
  skillByName: Map<string, number>;
  withPenalty: (value: number) => string;
}

function SkillCard(props: SkillCardProps) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {props.title}
      </div>
      <ul className="mt-2 space-y-1 text-sm tabular-nums">
        {props.categoryName && props.categoryTotal != null && (
          <li className="flex justify-between border-b border-zinc-100 pb-1">
            <span className="font-medium text-zinc-700">
              {props.categoryName}
            </span>
            <span className="font-medium">
              {props.withPenalty(props.categoryTotal)}
            </span>
          </li>
        )}
        {props.specialRow && (
          <li className="flex justify-between border-b border-zinc-100 pb-1">
            <span
              className="font-medium text-zinc-700"
              title={props.specialRow.hint}
            >
              {props.specialRow.label}
            </span>
            <span className="font-medium">
              {props.withPenalty(props.specialRow.value)}
            </span>
          </li>
        )}
        {props.skills.map((skillName) => {
          const total = props.skillByName.get(skillName);
          return (
            <li key={skillName} className="flex justify-between">
              <span className="text-zinc-600">{skillName}</span>
              <span>
                {total != null ? props.withPenalty(total) : "—"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
