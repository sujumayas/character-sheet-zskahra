import { describe, expect, test } from "bun:test";

import {
  PROFESSION_ADAPTABILITY_BONUS,
  dpAvailableAtLevel,
  levelFromTotalDp,
  maxRanksAt,
  type LevelTier,
} from "./progression";

const TIERS: LevelTier[] = [
  { level: 1, min_total_dp: 140, max_total_dp: 194 },
  { level: 2, min_total_dp: 195, max_total_dp: 249 },
  { level: 3, min_total_dp: 250, max_total_dp: 304 },
];

describe("levelFromTotalDp", () => {
  test("at L1 boundary", () => {
    expect(levelFromTotalDp(140, TIERS)).toBe(1);
    expect(levelFromTotalDp(150, TIERS)).toBe(1);
    expect(levelFromTotalDp(194, TIERS)).toBe(1);
  });

  test("at L2 boundary", () => {
    expect(levelFromTotalDp(195, TIERS)).toBe(2);
    expect(levelFromTotalDp(249, TIERS)).toBe(2);
  });

  test("below L1 still resolves to L1", () => {
    expect(levelFromTotalDp(0, TIERS)).toBe(1);
  });
});

describe("dpAvailableAtLevel", () => {
  test("L1 base = 140", () => {
    expect(dpAvailableAtLevel(1, TIERS)).toBe(140);
  });

  test("L1 + Profession Adaptability = 155", () => {
    expect(
      dpAvailableAtLevel(1, TIERS, { hasProfessionAdaptability: true }),
    ).toBe(140 + PROFESSION_ADAPTABILITY_BONUS);
  });

  test("L3 base = 250", () => {
    expect(dpAvailableAtLevel(3, TIERS)).toBe(250);
  });

  test("unknown level → 0", () => {
    expect(dpAvailableAtLevel(99, TIERS)).toBe(0);
  });
});

describe("maxRanksAt (Zskahra house rule: 3 per level + 3)", () => {
  test("L1 → 6", () => {
    expect(maxRanksAt(1)).toBe(6);
  });

  test("L2 → 9", () => {
    expect(maxRanksAt(2)).toBe(9);
  });

  test("L5 → 18", () => {
    expect(maxRanksAt(5)).toBe(18);
  });

  test("clamps level<1 to L1 floor (6)", () => {
    expect(maxRanksAt(0)).toBe(6);
    expect(maxRanksAt(-3)).toBe(6);
  });
});
