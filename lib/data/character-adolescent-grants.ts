// Server-side loader. Resolves a character's free adolescent rank grants from
// their birthplace's rules in `birthplace_adolescent_rank_rules`. The rules
// table is the source of truth for category/skill/trait grants — they cost
// no DP and contribute directly to the row's ranks. Weapon picks are returned
// as a single pool of "free weapon ranks" that the player allocates per
// weapon via `character_weapon_skill.adolescent_ranks`.

import type { SupabaseClient } from "@supabase/supabase-js";

export interface CharacterAdolescentGrants {
  birthplace_id: string | null;
  // Sum of grants per target_id (multiple cultures shouldn't apply, but the
  // sum is robust against any future rule duplication).
  category: Map<string, number>;
  skill: Map<string, number>;
  trait: Map<string, number>;
  // Free weapon ranks: weapon_pick_1 and weapon_pick_2 are surfaced as a
  // single combined pool. The player picks weapons in the weapons editor.
  weapon_pool_ranks: number;
  // Notes of the original sheet rows for tooltip display.
  weapon_pool_breakdown: Array<{ slot: 1 | 2; ranks: number; notes: string | null }>;
}

const EMPTY_GRANTS = (birthplaceId: string | null): CharacterAdolescentGrants => ({
  birthplace_id: birthplaceId,
  category: new Map(),
  skill: new Map(),
  trait: new Map(),
  weapon_pool_ranks: 0,
  weapon_pool_breakdown: [],
});

export async function loadCharacterAdolescentGrants(
  supabase: SupabaseClient,
  characterId: string,
): Promise<CharacterAdolescentGrants> {
  const { data: desc } = await supabase
    .from("character_description")
    .select("birthplace_id")
    .eq("character_id", characterId)
    .maybeSingle();

  const birthplaceId = desc?.birthplace_id ?? null;
  if (!birthplaceId) return EMPTY_GRANTS(null);

  const { data: rules } = await supabase
    .from("birthplace_adolescent_rank_rules")
    .select(
      "target_type, category_id, skill_id, trait_id, ranks_granted, notes",
    )
    .eq("birthplace_id", birthplaceId);

  const grants = EMPTY_GRANTS(birthplaceId);
  for (const r of rules ?? []) {
    const ranks = r.ranks_granted ?? 0;
    if (ranks <= 0) continue;
    switch (r.target_type) {
      case "category":
        if (r.category_id)
          grants.category.set(
            r.category_id,
            (grants.category.get(r.category_id) ?? 0) + ranks,
          );
        break;
      case "skill":
        if (r.skill_id)
          grants.skill.set(
            r.skill_id,
            (grants.skill.get(r.skill_id) ?? 0) + ranks,
          );
        break;
      case "trait":
        if (r.trait_id)
          grants.trait.set(
            r.trait_id,
            (grants.trait.get(r.trait_id) ?? 0) + ranks,
          );
        break;
      case "weapon_pick_1":
        grants.weapon_pool_ranks += ranks;
        grants.weapon_pool_breakdown.push({
          slot: 1,
          ranks,
          notes: r.notes ?? null,
        });
        break;
      case "weapon_pick_2":
        grants.weapon_pool_ranks += ranks;
        grants.weapon_pool_breakdown.push({
          slot: 2,
          ranks,
          notes: r.notes ?? null,
        });
        break;
    }
  }
  return grants;
}
