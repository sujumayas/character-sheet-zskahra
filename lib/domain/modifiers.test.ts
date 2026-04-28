import { describe, expect, test } from "bun:test";

import { computeStatRow, computeTraitRow } from "./modifiers";

// Sample character lifted from `1. Stats & Traits` in the source
// spreadsheet. Race = Vhareth, Birthplace = Karven, no special modifiers
// except QU.special = +1. All values match the sheet's column G.

const VHARETH = {
  // stat_id placeholders — code is purely descriptive in tests.
  stats: {
    ST: { stat_bonus: 2, race_modifier: 3, special_modifier: 0, total: 5 },
    CO: { stat_bonus: 3, race_modifier: 4, special_modifier: 0, total: 7 },
    AG: { stat_bonus: 9, race_modifier: -2, special_modifier: 0, total: 7 },
    QU: { stat_bonus: 6, race_modifier: -1, special_modifier: 1, total: 6 },
    SD: { stat_bonus: 5, race_modifier: 2, special_modifier: 0, total: 7 },
    RE: { stat_bonus: 4, race_modifier: 0, special_modifier: 0, total: 4 },
    IN: { stat_bonus: 10, race_modifier: 2, special_modifier: 0, total: 12 },
    PR: { stat_bonus: 4, race_modifier: -3, special_modifier: 0, total: 1 },
  },
};

describe("computeStatRow — Vhareth L1 sample", () => {
  for (const [code, vals] of Object.entries(VHARETH.stats)) {
    test(`stat ${code} total = ${vals.total}`, () => {
      const row = computeStatRow({ stat_id: code, ...vals });
      expect(row.total).toBe(vals.total);
      expect(row.cost_total).toBe(vals.stat_bonus + vals.race_modifier);
    });
  }

  test("Quickness includes the +1 special modifier", () => {
    const row = computeStatRow({ stat_id: "QU", ...VHARETH.stats.QU });
    expect(row.total).toBe(6);
    expect(row.cost_total).toBe(5);
  });
});

describe("computeTraitRow — Vhareth L1 sample (sheet rows 25-30)", () => {
  // (race_modifier, primary_total, secondary_total, expected_total)
  const TRAIT_CASES: Array<{
    name: string;
    race: number;
    primary: number;
    secondary: number;
    expected: number;
  }> = [
    { name: "Endurance",         race: 45, primary: 7,  secondary: 7, expected: 59 },
    { name: "Power Points",      race: 0,  primary: 7,  secondary: 7, expected: 14 },
    { name: "General Knowledge", race: 20, primary: 4,  secondary: 12, expected: 36 },
    { name: "RR Will",           race: 22, primary: 7,  secondary: 7, expected: 36 },
    { name: "RR Stamina",        race: 15, primary: 7,  secondary: 7, expected: 29 },
    { name: "RR Magic",          race: 18, primary: 12, secondary: 7, expected: 37 },
  ];

  for (const c of TRAIT_CASES) {
    test(`${c.name} total = ${c.expected}`, () => {
      const row = computeTraitRow({
        trait_id: c.name,
        ranks: 0,
        primary_stat_total: c.primary,
        secondary_stat_total: c.secondary,
        race_modifier: c.race,
        birthplace_modifier: 0,
        talent_bonus: 0,
        special_modifier: 0,
      });
      expect(row.total).toBe(c.expected);
    });
  }

  test("ranks contribute via ranksValueTrait", () => {
    // 5 ranks × 5 = +25 over the base.
    const row = computeTraitRow({
      trait_id: "Endurance",
      ranks: 5,
      primary_stat_total: 7,
      secondary_stat_total: 7,
      race_modifier: 45,
      birthplace_modifier: 0,
      talent_bonus: 0,
      special_modifier: 0,
    });
    expect(row.ranks_value).toBe(25);
    expect(row.total).toBe(59 + 25);
  });
});
