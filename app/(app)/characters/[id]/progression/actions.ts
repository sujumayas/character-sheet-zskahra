"use server";

import { revalidatePath } from "next/cache";

import { recomputeCharacterLevel } from "@/lib/domain/dp-budget";
import type { LevelTier } from "@/lib/domain/progression";
import { createClient } from "@/lib/supabase/server";

async function loadTiers(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data } = await supabase
    .from("level_progression")
    .select("level, min_total_dp, max_total_dp");
  const tiers: LevelTier[] = (data ?? []).map((t) => ({
    level: t.level,
    min_total_dp: t.min_total_dp,
    max_total_dp: t.max_total_dp ?? Number.MAX_SAFE_INTEGER,
  }));
  return tiers;
}

export async function grantDpAction(input: {
  characterId: string;
  dpGained: number;
  sessionDate: string; // YYYY-MM-DD
  notes: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!Number.isFinite(input.dpGained) || input.dpGained === 0) {
    return { ok: false, error: "DP gained must be a non-zero number." };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("character_dp_sessions").insert({
    character_id: input.characterId,
    dp_gained: input.dpGained,
    session_date: input.sessionDate,
    notes: input.notes,
  });
  if (error) return { ok: false, error: error.message };

  const tiers = await loadTiers(supabase);
  await recomputeCharacterLevel(supabase, input.characterId, tiers);
  revalidatePath(`/characters/${input.characterId}`, "layout");
  return { ok: true };
}

export async function deleteDpSessionAction(input: {
  characterId: string;
  sessionId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("character_dp_sessions")
    .delete()
    .eq("id", input.sessionId)
    .eq("character_id", input.characterId);
  if (error) return { ok: false, error: error.message };

  const tiers = await loadTiers(supabase);
  await recomputeCharacterLevel(supabase, input.characterId, tiers);
  revalidatePath(`/characters/${input.characterId}`, "layout");
  return { ok: true };
}
