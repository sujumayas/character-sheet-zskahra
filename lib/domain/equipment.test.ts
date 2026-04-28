import { describe, expect, test } from "bun:test";

import {
  armorTotals,
  computeArmorRow,
  computeShield,
  type ArmorRowInput,
} from "./equipment";

const platePart = (
  bodyPartName: string,
  percentCovered: number,
): ArmorRowInput => ({
  bodyPartId: bodyPartName.toLowerCase(),
  bodyPartName,
  percentCovered,
  armorTypeId: "plate",
  armorTypeName: "Plate",
  fullArmorBonus: 60,
  minPenalty: -20,
  maxPenalty: -100,
  craftingMultiplier: null,
});

const noneRow = (
  bodyPartName: string,
  percentCovered: number,
): ArmorRowInput => ({
  bodyPartId: bodyPartName.toLowerCase(),
  bodyPartName,
  percentCovered,
  armorTypeId: null,
  armorTypeName: "None",
  fullArmorBonus: 0,
  minPenalty: 0,
  maxPenalty: 0,
  craftingMultiplier: null,
});

describe("computeArmorRow — bonus", () => {
  test("Plate on Torso (0.28) at no multiplier rounds to 17", () => {
    const row = computeArmorRow(platePart("Torso/Back", 0.28), 0);
    expect(row.bonus).toBe(17);
    expect(row.total).toBe(17);
  });

  test("None has zero bonus regardless of body part", () => {
    const row = computeArmorRow(noneRow("Head", 0.15), 0);
    expect(row.bonus).toBe(0);
    expect(row.total).toBe(0);
    expect(row.penalty).toBe(0);
  });

  test("crafting multiplier 1.5 multiplies the bonus", () => {
    const row = computeArmorRow(
      { ...platePart("Torso/Back", 0.28), craftingMultiplier: 1.5 },
      0,
    );
    expect(row.bonus).toBe(17);
    expect(row.total).toBe(26); // round(17 * 1.5) = 26
  });
});

describe("computeArmorRow — penalty (full clamp)", () => {
  test("Plate + Wear Armor 0 → max penalty -100 (no clamp benefit)", () => {
    const row = computeArmorRow(platePart("Torso/Back", 0.28), 0);
    expect(row.penalty).toBe(-100);
  });

  test("Plate + Wear Armor 80 → floored at min penalty -20", () => {
    const row = computeArmorRow(platePart("Torso/Back", 0.28), 80);
    expect(row.penalty).toBe(-20);
  });

  test("Plate + Wear Armor 50 → partial: -100 + 50 = -50", () => {
    const row = computeArmorRow(platePart("Torso/Back", 0.28), 50);
    expect(row.penalty).toBe(-50);
  });

  test("Plate + Wear Armor 200 → still floored at -20 (cannot go positive)", () => {
    const row = computeArmorRow(platePart("Torso/Back", 0.28), 200);
    expect(row.penalty).toBe(-20);
  });

  test("Plate + Wear Armor -13 → ceilinged at max -100 (NOT -113, sheet bug)", () => {
    const row = computeArmorRow(platePart("Torso/Back", 0.28), -13);
    expect(row.penalty).toBe(-100);
  });

  test("Mail/Scale (max=-60, min=-10) + Wear Armor 30 → -30", () => {
    const row = computeArmorRow(
      {
        bodyPartId: "torso",
        bodyPartName: "Torso/Back",
        percentCovered: 0.28,
        armorTypeId: "mail",
        armorTypeName: "Mail/Scale",
        fullArmorBonus: 40,
        minPenalty: -10,
        maxPenalty: -60,
        craftingMultiplier: null,
      },
      30,
    );
    expect(row.penalty).toBe(-30);
  });

  test("Plain Clothes always 0 penalty", () => {
    const row = computeArmorRow(
      {
        bodyPartId: "torso",
        bodyPartName: "Torso/Back",
        percentCovered: 0.28,
        armorTypeId: "plain",
        armorTypeName: "Plain Clothes",
        fullArmorBonus: 10,
        minPenalty: 0,
        maxPenalty: 0,
        craftingMultiplier: null,
      },
      -50,
    );
    expect(row.penalty).toBe(0);
  });
});

describe("armorTotals", () => {
  test("Plate everywhere with Wear Armor 80 → BD ≈ 60×Σ% (rounding noise), penalty -20", () => {
    const parts: Array<[string, number]> = [
      ["Head", 0.15],
      ["Torso/Back", 0.28],
      ["Stomach/Hip", 0.21],
      ["Arms", 0.15],
      ["Hands", 0.05],
      ["Legs", 0.12],
      ["Feet", 0.03],
    ];
    const rows = parts.map(([name, pct]) =>
      computeArmorRow(platePart(name, pct), 80),
    );
    const totals = armorTotals(rows);
    // Sum of round(60 * pct): 9 + 17 + 13 + 9 + 3 + 7 + 2 = 60
    expect(totals.armorBd).toBe(60);
    // round(sum(pct * -20)) = round(-19.8) = -20
    expect(totals.totalPenalty).toBe(-20);
  });

  test("All None → 0 / 0", () => {
    const parts: Array<[string, number]> = [
      ["Head", 0.15],
      ["Torso/Back", 0.28],
    ];
    const rows = parts.map(([name, pct]) =>
      computeArmorRow(noneRow(name, pct), 0),
    );
    expect(armorTotals(rows)).toEqual({ armorBd: 0, totalPenalty: 0 });
  });
});

describe("computeShield", () => {
  test("Buckler trained, no special bonus", () => {
    const s = computeShield(
      { trainedDb: 15, untrainedDb: 0, hits: 45, weightLb: 4 },
      true,
      0,
      0,
    );
    expect(s.activeDb).toBe(15);
    expect(s.hitsRemaining).toBe(45);
    expect(s.weightKg).toBe(1.8);
  });

  test("Buckler untrained → 0 DB", () => {
    const s = computeShield(
      { trainedDb: 15, untrainedDb: 0, hits: 45, weightLb: 4 },
      false,
      0,
      0,
    );
    expect(s.activeDb).toBe(0);
  });

  test("Special bonus stacks on top", () => {
    const s = computeShield(
      { trainedDb: 25, untrainedDb: 10, hits: 75, weightLb: 15 },
      true,
      5,
      10,
    );
    expect(s.activeDb).toBe(30);
    expect(s.hitsRemaining).toBe(65);
    expect(s.weightKg).toBe(6.8);
  });

  test("hitsRemaining clamps to 0 (cannot go negative)", () => {
    const s = computeShield(
      { trainedDb: 15, untrainedDb: 0, hits: 45, weightLb: 4 },
      true,
      0,
      999,
    );
    expect(s.hitsRemaining).toBe(0);
  });

  test("Wall Shield kg conversion: 30 lb × 0.45359237 = 13.6 kg", () => {
    const s = computeShield(
      { trainedDb: 40, untrainedDb: 20, hits: 120, weightLb: 30 },
      true,
      0,
      0,
    );
    expect(s.weightKg).toBe(13.6);
  });
});
