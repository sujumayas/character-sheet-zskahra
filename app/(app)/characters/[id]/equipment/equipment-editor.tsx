"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EditableNumber } from "@/components/sheet/editable-number";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  armorTotals,
  computeArmorRow,
  computeShield,
} from "@/lib/domain/equipment";
import { createClient } from "@/lib/supabase/client";

interface ArmorTypeRow {
  id: string;
  name: string;
  full_armor_bonus: number;
  min_penalty: number;
  max_penalty: number;
  display_order: number;
}

interface BodyPartRow {
  id: string;
  name: string;
  percent_covered: number;
  display_order: number;
}

interface ShieldRow {
  id: string;
  name: string;
  untrained_db: number;
  trained_db: number;
  crit_damage_type: string;
  crit_size_modifier: string;
  hits: number | null;
  weight_lb: number;
  notes: string | null;
  display_order: number;
}

interface CharacterArmorRow {
  id: string;
  body_part_id: string;
  armor_type_id: string;
  crafting_multiplier: number | null;
  notes: string | null;
}

interface CharacterShieldRow {
  id: string;
  shield_id: string;
  special_bonus: number;
  is_trained: boolean;
  hits_used: number;
  notes: string | null;
}

export interface EquipmentEditorProps {
  characterId: string;
  hasDescriptionRow: boolean;
  wearArmorScore: number;
  armorTypes: ArmorTypeRow[];
  bodyParts: BodyPartRow[];
  shields: ShieldRow[];
  characterArmor: CharacterArmorRow[];
  characterShield: CharacterShieldRow | null;
}

export function EquipmentEditor(props: EquipmentEditorProps) {
  const supabase = useMemo(() => createClient(), []);

  // Wear Armor is auto-derived from the "Armor" skill (Athletic Stamina).
  // The page recomputes on every load; we mirror it here for the per-part
  // penalty preview. Read-only — edits happen on the Skills page.
  const wearArmor = props.wearArmorScore;
  const [armorRows, setArmorRows] = useState<CharacterArmorRow[]>(
    props.characterArmor,
  );
  const [shieldRow, setShieldRow] = useState<CharacterShieldRow | null>(
    props.characterShield,
  );

  const armorTypeById = useMemo(
    () => new Map(props.armorTypes.map((a) => [a.id, a])),
    [props.armorTypes],
  );
  const shieldById = useMemo(
    () => new Map(props.shields.map((s) => [s.id, s])),
    [props.shields],
  );
  const armorByBodyPartId = useMemo(
    () => new Map(armorRows.map((r) => [r.body_part_id, r])),
    [armorRows],
  );

  // Compute per-body-part rows + totals
  const computedRows = useMemo(() => {
    return props.bodyParts.map((bp) => {
      const armor = armorByBodyPartId.get(bp.id);
      const armorType = armor ? armorTypeById.get(armor.armor_type_id) : null;
      const input = {
        bodyPartId: bp.id,
        bodyPartName: bp.name,
        percentCovered: bp.percent_covered,
        armorTypeId: armorType?.id ?? null,
        armorTypeName: armorType?.name ?? "None",
        fullArmorBonus: armorType?.full_armor_bonus ?? 0,
        minPenalty: armorType?.min_penalty ?? 0,
        maxPenalty: armorType?.max_penalty ?? 0,
        craftingMultiplier: armor?.crafting_multiplier ?? null,
      };
      const computed = computeArmorRow(input, wearArmor);
      return { bp, armor, armorType, input, computed };
    });
  }, [props.bodyParts, armorByBodyPartId, armorTypeById, wearArmor]);

  const totals = useMemo(
    () => armorTotals(computedRows.map((r) => r.computed)),
    [computedRows],
  );

  const shieldData = useMemo(() => {
    if (!shieldRow) return null;
    const ref = shieldById.get(shieldRow.shield_id);
    if (!ref) return null;
    const computed = computeShield(
      {
        trainedDb: ref.trained_db,
        untrainedDb: ref.untrained_db,
        hits: ref.hits ?? ref.trained_db * 3,
        weightLb: ref.weight_lb,
      },
      shieldRow.is_trained,
      shieldRow.special_bonus,
      shieldRow.hits_used,
    );
    return { ref, row: shieldRow, computed };
  }, [shieldRow, shieldById]);

  // ---- mutations ----

  async function commitArmorChoice(bodyPartId: string, armorTypeId: string | null) {
    const prev = armorRows;
    if (!armorTypeId) {
      // delete
      setArmorRows((rs) => rs.filter((r) => r.body_part_id !== bodyPartId));
      const { error } = await supabase
        .from("character_armor")
        .delete()
        .eq("character_id", props.characterId)
        .eq("body_part_id", bodyPartId);
      if (error) {
        setArmorRows(prev);
        toast.error(`Failed to clear armor: ${error.message}`);
      }
      return;
    }

    const existing = armorByBodyPartId.get(bodyPartId);
    const optimistic: CharacterArmorRow = existing
      ? { ...existing, armor_type_id: armorTypeId }
      : {
          id: `optimistic-${bodyPartId}`,
          body_part_id: bodyPartId,
          armor_type_id: armorTypeId,
          crafting_multiplier: null,
          notes: null,
        };
    setArmorRows((rs) => {
      const idx = rs.findIndex((r) => r.body_part_id === bodyPartId);
      if (idx === -1) return [...rs, optimistic];
      const copy = [...rs];
      copy[idx] = optimistic;
      return copy;
    });

    const { data, error } = await supabase
      .from("character_armor")
      .upsert(
        {
          character_id: props.characterId,
          body_part_id: bodyPartId,
          armor_type_id: armorTypeId,
          crafting_multiplier: existing?.crafting_multiplier ?? null,
        },
        { onConflict: "character_id,body_part_id" },
      )
      .select("id, body_part_id, armor_type_id, crafting_multiplier, notes")
      .maybeSingle();

    if (error || !data) {
      setArmorRows(prev);
      toast.error(`Failed to save armor: ${error?.message ?? "unknown error"}`);
      return;
    }
    setArmorRows((rs) => {
      const idx = rs.findIndex((r) => r.body_part_id === bodyPartId);
      if (idx === -1) return [...rs, data];
      const copy = [...rs];
      copy[idx] = data;
      return copy;
    });
  }

  async function commitCraftingMultiplier(bodyPartId: string, next: number) {
    const existing = armorByBodyPartId.get(bodyPartId);
    if (!existing) {
      // No armor on this part — ignore (UI disables the input in this case)
      return;
    }
    const prev = armorRows;
    const value = next === 0 ? null : next;
    setArmorRows((rs) =>
      rs.map((r) =>
        r.body_part_id === bodyPartId ? { ...r, crafting_multiplier: value } : r,
      ),
    );
    const { error } = await supabase
      .from("character_armor")
      .update({ crafting_multiplier: value })
      .eq("character_id", props.characterId)
      .eq("body_part_id", bodyPartId);
    if (error) {
      setArmorRows(prev);
      toast.error(`Failed to save multiplier: ${error.message}`);
    }
  }

  async function commitShieldChoice(shieldId: string | null) {
    const prev = shieldRow;
    if (!shieldId) {
      setShieldRow(null);
      const { error } = await supabase
        .from("character_shield")
        .delete()
        .eq("character_id", props.characterId);
      if (error) {
        setShieldRow(prev);
        toast.error(`Failed to clear shield: ${error.message}`);
      }
      return;
    }

    const optimistic: CharacterShieldRow = prev
      ? { ...prev, shield_id: shieldId }
      : {
          id: "optimistic-shield",
          shield_id: shieldId,
          special_bonus: 0,
          is_trained: false,
          hits_used: 0,
          notes: null,
        };
    setShieldRow(optimistic);
    const { data, error } = await supabase
      .from("character_shield")
      .upsert(
        {
          character_id: props.characterId,
          shield_id: shieldId,
          special_bonus: prev?.special_bonus ?? 0,
          is_trained: prev?.is_trained ?? false,
          hits_used: prev?.hits_used ?? 0,
        },
        { onConflict: "character_id" },
      )
      .select("id, shield_id, special_bonus, is_trained, hits_used, notes")
      .maybeSingle();
    if (error || !data) {
      setShieldRow(prev);
      toast.error(`Failed to save shield: ${error?.message ?? "unknown error"}`);
      return;
    }
    setShieldRow(data);
  }

  async function commitShieldField(patch: Partial<CharacterShieldRow>) {
    if (!shieldRow) return;
    const prev = shieldRow;
    const optimistic = { ...shieldRow, ...patch };
    setShieldRow(optimistic);
    const { data, error } = await supabase
      .from("character_shield")
      .update(patch)
      .eq("character_id", props.characterId)
      .select("id, shield_id, special_bonus, is_trained, hits_used, notes")
      .maybeSingle();
    if (error || !data) {
      setShieldRow(prev);
      toast.error(`Failed to save shield: ${error?.message ?? "unknown error"}`);
      return;
    }
    setShieldRow(data);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <header className="rounded-md border border-zinc-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs uppercase tracking-wide text-zinc-500">
              Wear Armor skill total
            </label>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {wearArmor}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Auto-derived from your Skills page (Athletic Stamina → Armor).
              Drives the per-part penalty clamp.
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Armor BD
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {totals.armorBd}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Σ per-part Total (defensive bonus from worn armor).
            </p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              Total Armor Penalty
            </div>
            <div
              className={`mt-1 text-2xl font-semibold tabular-nums ${
                totals.totalPenalty < 0 ? "text-red-700" : "text-zinc-900"
              }`}
            >
              {totals.totalPenalty}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Σ (% covered × per-part penalty), rounded.
            </p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Armor by Body Part
        </h2>
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Part</th>
                <th className="px-3 py-2 font-medium">Material</th>
                <th className="px-3 py-2 font-medium text-right">Crafting ×</th>
                <th className="px-3 py-2 font-medium text-right">Bonus</th>
                <th className="px-3 py-2 font-medium text-right">Total</th>
                <th className="px-3 py-2 font-medium text-right">Penalty</th>
                <th className="px-3 py-2 font-medium text-right">% covered</th>
                <th className="px-3 py-2 font-medium text-right">Weighted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {computedRows.map(({ bp, armor, computed }) => {
                const isEquipped = armor != null;
                return (
                  <tr key={bp.id}>
                    <td className="px-3 py-2 font-medium">{bp.name}</td>
                    <td className="px-3 py-2">
                      <Select
                        value={armor?.armor_type_id ?? "__none__"}
                        onValueChange={(v) =>
                          commitArmorChoice(
                            bp.id,
                            v === "__none__" ? null : (v as string),
                          )
                        }
                      >
                        <SelectTrigger size="sm" className="w-full min-w-40">
                          <SelectValue placeholder="None">
                            {(current) =>
                              current === "__none__" || current == null
                                ? "None"
                                : armorTypeById.get(current as string)?.name ??
                                  "None"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">None</SelectItem>
                          {props.armorTypes.map((at) => (
                            <SelectItem key={at.id} value={at.id}>
                              {at.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <EditableNumber
                        className="ml-auto w-16"
                        value={armor?.crafting_multiplier ?? null}
                        disabled={!isEquipped}
                        placeholder={isEquipped ? "1.0" : ""}
                        onCommit={(next) => commitCraftingMultiplier(bp.id, next)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                      {computed.bonus}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">
                      {computed.total}
                    </td>
                    <td
                      className={`px-3 py-2 text-right tabular-nums ${
                        computed.penalty < 0 ? "text-red-700" : "text-zinc-600"
                      }`}
                    >
                      {computed.penalty}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-500">
                      {(bp.percent_covered * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-zinc-600">
                      {computed.weightedPenalty.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-zinc-50">
              <tr>
                <td colSpan={4} className="px-3 py-2 text-right text-xs uppercase tracking-wide text-zinc-500">
                  Totals
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold">
                  {totals.armorBd}
                </td>
                <td
                  className={`px-3 py-2 text-right tabular-nums font-semibold ${
                    totals.totalPenalty < 0 ? "text-red-700" : ""
                  }`}
                >
                  {totals.totalPenalty}
                </td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Shield
        </h2>
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs uppercase tracking-wide text-zinc-500">
                Shield
              </label>
              <div className="mt-1">
                <Select
                  value={shieldRow?.shield_id ?? "__none__"}
                  onValueChange={(v) =>
                    commitShieldChoice(v === "__none__" ? null : (v as string))
                  }
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {props.shields.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {shieldData ? (
              <>
                <div>
                  <label className="text-xs uppercase tracking-wide text-zinc-500">
                    Trained
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={shieldData.row.is_trained}
                      onChange={(e) =>
                        commitShieldField({ is_trained: e.target.checked })
                      }
                    />
                    <span className="text-sm tabular-nums text-zinc-600">
                      Untrained {shieldData.ref.untrained_db} /
                      Trained {shieldData.ref.trained_db}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-zinc-500">
                    Special bonus
                  </label>
                  <div className="mt-1 max-w-24">
                    <EditableNumber
                      value={shieldData.row.special_bonus}
                      onCommit={(next) =>
                        commitShieldField({ special_bonus: next })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-zinc-500">
                    Active DB
                  </label>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">
                    {shieldData.computed.activeDb}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-zinc-500">
                    1st Crit
                  </label>
                  <div className="mt-1 text-sm capitalize">
                    {shieldData.ref.crit_damage_type} −
                    {" "}{shieldData.ref.crit_size_modifier}
                  </div>
                  {shieldData.ref.notes && (
                    <p className="mt-1 text-xs text-amber-700">
                      {shieldData.ref.notes}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-zinc-500">
                    Hits used
                  </label>
                  <div className="mt-1 max-w-24">
                    <EditableNumber
                      value={shieldData.row.hits_used}
                      min={0}
                      onCommit={(next) =>
                        commitShieldField({ hits_used: next })
                      }
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 tabular-nums">
                    {shieldData.computed.hitsRemaining} /{" "}
                    {shieldData.ref.hits ?? shieldData.ref.trained_db * 3} remaining
                  </p>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-zinc-500">
                    Weight
                  </label>
                  <div className="mt-1 text-sm tabular-nums">
                    {shieldData.ref.weight_lb} lb · {shieldData.computed.weightKg} kg
                  </div>
                </div>
              </>
            ) : (
              <div className="col-span-full text-sm text-zinc-500">
                No shield equipped.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
