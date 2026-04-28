// Weapon affinity transfer matrix. Each weapon's effective total is the
// best of its own natural value or the best transferred value from any
// other weapon the character has, applying the affinity penalty.
// See docs/frontend-plan.md §6.6.

export interface WeaponNatural {
  weapon_id: string;
  natural: number;
}

export interface WeaponAffinityLink {
  source_weapon_id: string;
  target_weapon_id: string;
  modifier: number;
}

export interface WeaponTotal {
  natural: number;
  transfer_in: number;
  best_source_id: string | null;
  total: number;
}

const NO_RANKS_BASELINE = -25;

export function computeWeaponTotals(
  naturals: readonly WeaponNatural[],
  affinity: readonly WeaponAffinityLink[],
): Map<string, WeaponTotal> {
  const links = new Map<string, WeaponAffinityLink>();
  for (const link of affinity) {
    links.set(`${link.source_weapon_id}->${link.target_weapon_id}`, link);
  }

  const out = new Map<string, WeaponTotal>();
  for (const target of naturals) {
    let bestTransfer = -Infinity;
    let bestSource: string | null = null;
    for (const source of naturals) {
      if (source.weapon_id === target.weapon_id) continue;
      const link = links.get(`${source.weapon_id}->${target.weapon_id}`);
      if (!link) continue;
      const candidate = source.natural + link.modifier;
      if (candidate > bestTransfer) {
        bestTransfer = candidate;
        bestSource = source.weapon_id;
      }
    }
    const transferIn =
      bestTransfer === -Infinity ? NO_RANKS_BASELINE : bestTransfer;
    out.set(target.weapon_id, {
      natural: target.natural,
      transfer_in: transferIn,
      best_source_id: bestSource,
      total: Math.max(target.natural, transferIn),
    });
  }
  return out;
}
