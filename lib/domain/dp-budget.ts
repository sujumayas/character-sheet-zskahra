// Server-side aggregator. Single source of truth for a character's DP
// economy: how much was earned (sum of `character_dp_sessions.dp_gained`),
// how much is spent across every editor (categories, skills, weapons,
// talents), and what's still available. Used by the progression page and
// also passed down to per-tab editors so each one shares the same numbers
// instead of computing per-tab silos.

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  PROFESSION_ADAPTABILITY_BONUS,
  levelFromTotalDp,
  type LevelTier,
} from "./progression";

export interface DpBucketTotals {
  categories: number;
  skills: number;
  weapons: number;
  talents: number;
}

export interface DpSessionEntry {
  id: string;
  session_date: string | null;
  dp_gained: number;
  notes: string | null;
}

export interface CharacterDpBudget {
  totalEarned: number; // sum of session grants + profession adaptability bonus
  rawSessionsTotal: number; // sum of session grants only (no PA bonus)
  totalSpent: number; // sum of byBucket
  available: number; // totalEarned - totalSpent (may go negative; soft cap only)
  derivedLevel: number; // from levelFromTotalDp(rawSessionsTotal)
  byBucket: DpBucketTotals;
  sessions: DpSessionEntry[]; // ordered by session_date DESC
}

export async function aggregateCharacterDp(
  supabase: SupabaseClient,
  characterId: string,
  tiers: readonly LevelTier[],
  options: { hasProfessionAdaptability?: boolean } = {},
): Promise<CharacterDpBudget> {
  const [
    { data: sessions },
    { data: cats },
    { data: skills },
    { data: weapons },
    { data: talents },
  ] = await Promise.all([
    supabase
      .from("character_dp_sessions")
      .select("id, session_date, dp_gained, notes")
      .eq("character_id", characterId)
      .order("session_date", { ascending: false }),
    supabase
      .from("character_categories")
      .select("dp_allocated")
      .eq("character_id", characterId),
    supabase
      .from("character_skills")
      .select("dp_spent")
      .eq("character_id", characterId),
    supabase
      .from("character_weapon_skill")
      .select("dp_allocated")
      .eq("character_id", characterId),
    // character_talents has no dp column; pull `is_active` and `times_taken`,
    // then multiply by `talents.dp_cost` via a join.
    supabase
      .from("character_talents")
      .select("times_taken, is_active, talents(dp_cost)")
      .eq("character_id", characterId),
  ]);

  const sumNumberField = <T>(
    rows: T[] | null,
    pick: (row: T) => number | null | undefined,
  ): number =>
    (rows ?? []).reduce<number>((acc, row) => acc + (pick(row) ?? 0), 0);

  const byBucket: DpBucketTotals = {
    categories: sumNumberField(cats, (r) => r.dp_allocated),
    skills: sumNumberField(skills, (r) => r.dp_spent),
    weapons: sumNumberField(weapons, (r) => r.dp_allocated),
    talents: (talents ?? []).reduce<number>((acc, row) => {
      if (!row.is_active) return acc;
      const cost =
        // Supabase types the joined table as either a single object or an
        // array depending on cardinality. Normalize.
        Array.isArray(row.talents)
          ? row.talents[0]?.dp_cost ?? 0
          : (row.talents as { dp_cost?: number | null } | null)?.dp_cost ?? 0;
      return acc + cost * (row.times_taken ?? 1);
    }, 0),
  };

  const totalSpent =
    byBucket.categories + byBucket.skills + byBucket.weapons + byBucket.talents;
  const rawSessionsTotal = (sessions ?? []).reduce(
    (acc, s) => acc + (s.dp_gained ?? 0),
    0,
  );
  const totalEarned =
    rawSessionsTotal +
    (options.hasProfessionAdaptability ? PROFESSION_ADAPTABILITY_BONUS : 0);
  const available = totalEarned - totalSpent;
  const derivedLevel = levelFromTotalDp(rawSessionsTotal, tiers);

  return {
    totalEarned,
    rawSessionsTotal,
    totalSpent,
    available,
    derivedLevel,
    byBucket,
    sessions: (sessions ?? []).map((s) => ({
      id: s.id,
      session_date: s.session_date,
      dp_gained: s.dp_gained,
      notes: s.notes,
    })),
  };
}

/**
 * Recompute and persist `characters.level` and `characters.total_dp` from
 * the canonical `character_dp_sessions` table. Call after any insert/update/
 * delete on a session so the cached fields stay coherent. `available_dp` is
 * NOT cached on the row — it's recomputed on every page load by the
 * aggregator (depends on per-tab spend, which mutates on every rank change
 * and would drift if cached).
 */
export async function recomputeCharacterLevel(
  supabase: SupabaseClient,
  characterId: string,
  tiers: readonly LevelTier[],
): Promise<{ level: number; totalDp: number }> {
  const { data: sessions } = await supabase
    .from("character_dp_sessions")
    .select("dp_gained")
    .eq("character_id", characterId);
  const totalDp = (sessions ?? []).reduce(
    (acc, s) => acc + (s.dp_gained ?? 0),
    0,
  );
  const level = levelFromTotalDp(totalDp, tiers);
  await supabase
    .from("characters")
    .update({ level, total_dp: totalDp })
    .eq("id", characterId);
  return { level, totalDp };
}
