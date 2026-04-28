import { describe, expect, test } from "bun:test";

import { dpCostPerRank, type StatCostRule } from "./dp-cost";

// Subset of the seeded `stat_cost_rules` curve. Real table is 44 rows; these
// cover the boundaries that matter for L1 character stat totals (-3..+25).
const RULES: StatCostRule[] = [
  { stat_total: -18, dp_cost: 4 },
  { stat_total: 0, dp_cost: 4 },
  { stat_total: 3, dp_cost: 4 },
  { stat_total: 4, dp_cost: 3 },
  { stat_total: 7, dp_cost: 3 },
  { stat_total: 8, dp_cost: 2 },
  { stat_total: 25, dp_cost: 2 },
];

describe("dpCostPerRank", () => {
  test("Vhareth L1 sample: ST=5, CO=7, AG=7, QU=5 (cost-total) all cost 3 DP", () => {
    expect(dpCostPerRank(5, RULES)).toBe(3);
    expect(dpCostPerRank(7, RULES)).toBe(3);
  });

  test("Vhareth L1 sample: IN=12 costs 2 DP", () => {
    expect(dpCostPerRank(12, RULES)).toBe(2);
  });

  test("Vhareth L1 sample: PR=1 costs 4 DP", () => {
    expect(dpCostPerRank(1, RULES)).toBe(4);
  });

  test("flat below the lowest rule", () => {
    expect(dpCostPerRank(-99, RULES)).toBe(4);
  });

  test("empty rules → 0", () => {
    expect(dpCostPerRank(5, [])).toBe(0);
  });
});
