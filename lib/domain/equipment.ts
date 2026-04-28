// Armor + shield calculations. See docs/sheet-analysis/Equipment.md and
// docs/phase5-plan.md §4. Penalty clamp diverges from the source sheet
// (which under-clamped) and from a naïve fix to MAX (which over-clamps);
// we apply the full clamp on both ends.

export interface ArmorRowInput {
  bodyPartId: string;
  bodyPartName: string;
  percentCovered: number;
  armorTypeId: string | null;
  armorTypeName: string;
  fullArmorBonus: number;
  minPenalty: number;
  maxPenalty: number;
  craftingMultiplier: number | null;
}

export interface ArmorRowComputed {
  bonus: number;
  total: number;
  penalty: number;
  weightedPenalty: number;
}

export function computeArmorRow(
  row: ArmorRowInput,
  wearArmor: number,
): ArmorRowComputed {
  const bonus = Math.round(row.fullArmorBonus * row.percentCovered);
  const total =
    row.craftingMultiplier == null
      ? bonus
      : Math.round(bonus * row.craftingMultiplier);
  // min_penalty and max_penalty are both ≤ 0; max_penalty is more negative
  // (e.g. Plate: max=-100, min=-20). Wear Armor improves the value upward
  // toward min_penalty (the floor benefit) but cannot push it past
  // max_penalty (the worst case).
  const raw = row.maxPenalty + wearArmor;
  const penalty = Math.max(
    row.maxPenalty,
    Math.min(row.minPenalty, raw),
  );
  const weightedPenalty = row.percentCovered * penalty;
  return { bonus, total, penalty, weightedPenalty };
}

export interface ArmorTotals {
  armorBd: number;
  totalPenalty: number;
}

export function armorTotals(
  rows: readonly ArmorRowComputed[],
): ArmorTotals {
  const armorBd = rows.reduce((sum, r) => sum + r.total, 0);
  const totalPenalty = Math.round(
    rows.reduce((sum, r) => sum + r.weightedPenalty, 0),
  );
  return { armorBd, totalPenalty };
}

export interface ShieldRulesInput {
  trainedDb: number;
  untrainedDb: number;
  hits: number;
  weightLb: number;
}

export interface ShieldComputed {
  activeDb: number;
  hitsRemaining: number;
  weightKg: number;
}

export function computeShield(
  rules: ShieldRulesInput,
  isTrained: boolean,
  specialBonus: number,
  hitsUsed: number,
): ShieldComputed {
  const base = isTrained ? rules.trainedDb : rules.untrainedDb;
  const activeDb = base + specialBonus;
  const hitsRemaining = Math.max(0, rules.hits - hitsUsed);
  const weightKg = Math.round(rules.weightLb * 0.45359237 * 10) / 10;
  return { activeDb, hitsRemaining, weightKg };
}
