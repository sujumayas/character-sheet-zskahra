// Level ↔ DP helpers backed by the `level_progression` table.
// See docs/frontend-plan.md §6 + locked decision #4 (Profession Adaptability).

export const PROFESSION_ADAPTABILITY_BONUS = 15;

export interface LevelTier {
  level: number;
  min_total_dp: number;
  max_total_dp: number;
}

/** Resolve the character's current level from their cumulative earned DP. */
export function levelFromTotalDp(
  totalDp: number,
  tiers: readonly LevelTier[],
): number {
  if (tiers.length === 0) return 1;
  const sorted = [...tiers].sort((a, b) => a.level - b.level);
  let level = sorted[0].level;
  for (const tier of sorted) {
    if (totalDp >= tier.min_total_dp) {
      level = tier.level;
    } else {
      break;
    }
  }
  return level;
}

/**
 * Total DP the character has access to at `level`. Adds the +15 advantage
 * when Profession Adaptability is enabled (locked decision #4 — applied
 * uniformly across levels until the rules diverge).
 */
export function dpAvailableAtLevel(
  level: number,
  tiers: readonly LevelTier[],
  options: { hasProfessionAdaptability?: boolean } = {},
): number {
  const tier = tiers.find((t) => t.level === level);
  if (!tier) return 0;
  return (
    tier.min_total_dp +
    (options.hasProfessionAdaptability ? PROFESSION_ADAPTABILITY_BONUS : 0)
  );
}

/**
 * Hard cap on ranks per skill/category/weapon at the given level (Zskahra
 * house rule: 3 per level + 3 starter). At level 1 the cap is 6, at level 2
 * it is 9, and so on. Clamped at minimum 6 (level 1).
 */
export function maxRanksAt(level: number): number {
  const safeLevel = Math.max(level, 1);
  return 3 * safeLevel + 3;
}
