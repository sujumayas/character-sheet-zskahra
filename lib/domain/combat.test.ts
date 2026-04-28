import { describe, expect, test } from "bun:test";

import {
  activityModifier,
  activityThresholdLabels,
  dodgeManeuver,
  initiativeWithShield,
  MOVEMENT_TIERS,
  SHIELD_INITIATIVE_PENALTY,
} from "./combat";

const RULES = [
  { threshold_percent: 25, modifier_value: -30 },
  { threshold_percent: 50, modifier_value: -20 },
  { threshold_percent: 75, modifier_value: -10 },
];

describe("dodgeManeuver", () => {
  test("Quickness wins when Qu×2 > Acrobatics", () => {
    expect(dodgeManeuver(10, 15)).toBe(40); // max(20, 15) + 20
  });
  test("Acrobatics wins when high", () => {
    expect(dodgeManeuver(5, 80)).toBe(100); // max(10, 80) + 20
  });
  test("ties go to Qu (max picks the first equal)", () => {
    expect(dodgeManeuver(10, 20)).toBe(40);
  });
  test("zero stats still produce the +20 floor", () => {
    expect(dodgeManeuver(0, 0)).toBe(20);
  });
});

describe("activityModifier — DB-driven", () => {
  test("100% LP (full health) → 0", () => {
    expect(activityModifier(100, 100, RULES)).toBe(0);
  });
  test("76% LP → 0 (above 75% threshold)", () => {
    expect(activityModifier(76, 100, RULES)).toBe(0);
  });
  test("75% LP exactly → −10 (sheet uses > comparison; we use ≤)", () => {
    expect(activityModifier(75, 100, RULES)).toBe(-10);
  });
  test("60% LP → −10", () => {
    expect(activityModifier(60, 100, RULES)).toBe(-10);
  });
  test("50% LP exactly → −20", () => {
    expect(activityModifier(50, 100, RULES)).toBe(-20);
  });
  test("25% LP exactly → −30", () => {
    expect(activityModifier(25, 100, RULES)).toBe(-30);
  });
  test("0 LP → −30", () => {
    expect(activityModifier(0, 100, RULES)).toBe(-30);
  });
  test("permanent modifier stacks on top", () => {
    expect(activityModifier(60, 100, RULES, -5)).toBe(-15);
    expect(activityModifier(100, 100, RULES, -5)).toBe(-5);
  });
  test("empty rules → just the permanent mod", () => {
    expect(activityModifier(0, 100, [], -3)).toBe(-3);
    expect(activityModifier(0, 100, [])).toBe(0);
  });
  test("rounddown matches sheet (74 LP / 75% → 55)", () => {
    // Sheet: rounddown(74 * 0.75, 0) = 55. Our floor(74*0.75)=55. LP=55 → ≤55 → -10.
    expect(activityModifier(55, 74, RULES)).toBe(-10);
    expect(activityModifier(56, 74, RULES)).toBe(0);
  });
});

describe("activityThresholdLabels", () => {
  test("returns 75/50/25% in descending order with floored LP values", () => {
    const labels = activityThresholdLabels(74, RULES);
    expect(labels).toEqual([
      { threshold_percent: 75, lp_threshold: 55, modifier: -10 },
      { threshold_percent: 50, lp_threshold: 37, modifier: -20 },
      { threshold_percent: 25, lp_threshold: 18, modifier: -30 },
    ]);
  });
});

describe("initiativeWithShield", () => {
  test("subtracts 5 from base", () => {
    expect(initiativeWithShield(18)).toBe(13);
    expect(initiativeWithShield(0)).toBe(-5);
  });
  test("constant matches Anima rule", () => {
    expect(SHIELD_INITIATIVE_PENALTY).toBe(5);
  });
});

describe("MOVEMENT_TIERS", () => {
  test("five tiers in order with multipliers 1..5", () => {
    expect(MOVEMENT_TIERS.map((t) => t.name)).toEqual([
      "Walk",
      "Run",
      "Fast Run",
      "Sprint",
      "Dash",
    ]);
    expect(MOVEMENT_TIERS.map((t) => t.multiplier)).toEqual([1, 2, 3, 4, 5]);
  });
});
