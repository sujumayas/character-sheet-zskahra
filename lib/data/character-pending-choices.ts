// Persistent model for "user-choice" rank grants the player has yet to
// distribute. Today only `weapon_pool` is materialized — sum of weapon
// adolescence ranks the birthplace grants. The schema is generic so future
// pools (general_skill_pool, category_pool) can use the same machinery.
//
// Source of truth = `character_pending_choices.ranks_total`.
// "Ranks remaining" is computed at read time as
//   ranks_total − sum(character_weapon_skill.adolescent_ranks)
// so we never have to keep two columns in sync.

import type { SupabaseClient } from "@supabase/supabase-js";

export type PendingChoiceType =
  | "weapon_pool"
  | "general_skill_pool"
  | "category_pool";

export interface PendingChoice {
  id: string;
  choice_type: PendingChoiceType;
  ranks_total: number;
  source_birthplace_id: string | null;
  notes: string | null;
}

/**
 * Idempotent: rebuilds the `weapon_pool` row for a character from the
 * authoritative `birthplace_adolescent_rank_rules`. Call on any read path
 * where you need the pending row to reflect the current birthplace (e.g.
 * the weapons page server load) and after birthplace mutations.
 *
 * - If the character has no birthplace OR the birthplace grants no weapon
 *   ranks, any stale pending row is deleted.
 * - Otherwise UPSERTs `(character_id, 'weapon_pool')` with the new total.
 */
export async function ensureWeaponPoolChoice(
  supabase: SupabaseClient,
  characterId: string,
): Promise<void> {
  const { data: desc } = await supabase
    .from("character_description")
    .select("birthplace_id")
    .eq("character_id", characterId)
    .maybeSingle();
  const birthplaceId = desc?.birthplace_id ?? null;

  let total = 0;
  if (birthplaceId) {
    const { data: rules } = await supabase
      .from("birthplace_adolescent_rank_rules")
      .select("ranks_granted, target_type")
      .eq("birthplace_id", birthplaceId)
      .in("target_type", ["weapon_pick_1", "weapon_pick_2"]);
    total = (rules ?? []).reduce(
      (acc, r) => acc + (r.ranks_granted ?? 0),
      0,
    );
  }

  if (total <= 0) {
    await supabase
      .from("character_pending_choices")
      .delete()
      .eq("character_id", characterId)
      .eq("choice_type", "weapon_pool");
    return;
  }

  await supabase
    .from("character_pending_choices")
    .upsert(
      {
        character_id: characterId,
        choice_type: "weapon_pool",
        ranks_total: total,
        source_birthplace_id: birthplaceId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "character_id,choice_type" },
    );
}

export async function loadPendingChoices(
  supabase: SupabaseClient,
  characterId: string,
): Promise<Map<PendingChoiceType, PendingChoice>> {
  const { data } = await supabase
    .from("character_pending_choices")
    .select("id, choice_type, ranks_total, source_birthplace_id, notes")
    .eq("character_id", characterId);
  const out = new Map<PendingChoiceType, PendingChoice>();
  for (const r of data ?? []) {
    out.set(r.choice_type as PendingChoiceType, {
      id: r.id,
      choice_type: r.choice_type as PendingChoiceType,
      ranks_total: r.ranks_total,
      source_birthplace_id: r.source_birthplace_id,
      notes: r.notes,
    });
  }
  return out;
}
