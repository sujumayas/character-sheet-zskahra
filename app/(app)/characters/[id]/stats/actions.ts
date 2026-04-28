"use server";

import { revalidatePath } from "next/cache";

import {
  aggregateCharacterDp,
  loadLevelTiers,
  recomputeCharacterLevel,
} from "@/lib/domain/dp-budget";
import { INITIAL_L1_DP } from "@/lib/domain/progression";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function grantInitialDpAction(input: {
  characterId: string;
}): Promise<ActionResult> {
  const supabase = await createClient();

  // Re-verify the gate server-side. The client also enforces this, but the
  // ledger is append-only and we don't want a second 140-DP row to slip in
  // from a stale tab or a double-click.
  const tiers = await loadLevelTiers(supabase);
  const budget = await aggregateCharacterDp(supabase, input.characterId, tiers);
  if (budget.rawSessionsTotal !== 0 || budget.totalSpent !== 0) {
    return {
      ok: false,
      error:
        "Initial DPs can only be granted on a fresh character (empty ledger and no DPs spent).",
    };
  }

  const { data: stats } = await supabase
    .from("character_stats")
    .select("base_value")
    .eq("character_id", input.characterId);
  const filledStats = (stats ?? []).filter(
    (s) => typeof s.base_value === "number" && s.base_value > 0,
  );
  if (filledStats.length < 8) {
    return {
      ok: false,
      error: "All 8 stats must have a value > 0 before claiming initial DPs.",
    };
  }

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const { error } = await supabase.from("character_dp_sessions").insert({
    character_id: input.characterId,
    dp_gained: INITIAL_L1_DP,
    session_date: today,
    notes: "Initial L1 grant — character creation",
  });
  if (error) return { ok: false, error: error.message };

  await recomputeCharacterLevel(supabase, input.characterId, tiers);
  revalidatePath(`/characters/${input.characterId}`, "layout");
  return { ok: true };
}
