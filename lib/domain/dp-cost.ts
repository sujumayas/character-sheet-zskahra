// DP cost per rank, looked up from the `stat_cost_rules` step function.
// See docs/frontend-plan.md §6.2.

export interface StatCostRule {
  stat_total: number;
  dp_cost: number;
}

export function dpCostPerRank(
  statTotal: number,
  costRules: readonly StatCostRule[],
): number {
  if (costRules.length === 0) return 0;

  const sorted = [...costRules].sort((a, b) => a.stat_total - b.stat_total);

  // Below the lowest rule, fall through to its dp_cost (the curve flattens
  // out at the bottom in the seeded data).
  let result = sorted[0].dp_cost;
  for (const rule of sorted) {
    if (rule.stat_total <= statTotal) {
      result = rule.dp_cost;
    } else {
      break;
    }
  }
  return result;
}
