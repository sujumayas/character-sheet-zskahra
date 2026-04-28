import { describe, expect, test } from "bun:test";

import {
  computeWeaponTotals,
  type WeaponAffinityLink,
  type WeaponNatural,
} from "./weapon-affinity";

const naturals: WeaponNatural[] = [
  { weapon_id: "sword", natural: 80 },
  { weapon_id: "axe", natural: 20 },
  { weapon_id: "bow", natural: 0 },
];

const affinity: WeaponAffinityLink[] = [
  { source_weapon_id: "sword", target_weapon_id: "axe", modifier: -30 },
  { source_weapon_id: "axe", target_weapon_id: "sword", modifier: -30 },
];

describe("computeWeaponTotals", () => {
  test("axe wins via sword transfer (80 - 30 = 50 > 20)", () => {
    const result = computeWeaponTotals(naturals, affinity);
    const axe = result.get("axe")!;
    expect(axe.transfer_in).toBe(50);
    expect(axe.total).toBe(50);
    expect(axe.best_source_id).toBe("sword");
  });

  test("sword keeps its natural since transfer would be 20 - 30 = -10", () => {
    const result = computeWeaponTotals(naturals, affinity);
    const sword = result.get("sword")!;
    expect(sword.natural).toBe(80);
    expect(sword.total).toBe(80);
  });

  test("bow has no affinity link → falls back to -25 baseline", () => {
    const result = computeWeaponTotals(naturals, affinity);
    const bow = result.get("bow")!;
    expect(bow.transfer_in).toBe(-25);
    expect(bow.total).toBe(0);
  });
});
