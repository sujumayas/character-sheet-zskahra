import { notFound } from "next/navigation";

import { aggregateCharacterDp } from "@/lib/domain/dp-budget";
import type { LevelTier } from "@/lib/domain/progression";
import { createClient } from "@/lib/supabase/server";

import { DpLedger } from "./dp-ledger";

export default async function ProgressionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: character }, { data: progressionRows }] = await Promise.all([
    supabase
      .from("characters")
      .select("id, name, character_name, has_profession_adaptability")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("level_progression")
      .select("level, min_total_dp, max_total_dp"),
  ]);

  if (!character) notFound();

  const tiers: LevelTier[] = (progressionRows ?? []).map((t) => ({
    level: t.level,
    min_total_dp: t.min_total_dp,
    max_total_dp: t.max_total_dp ?? Number.MAX_SAFE_INTEGER,
  }));

  const budget = await aggregateCharacterDp(supabase, id, tiers, {
    hasProfessionAdaptability: character.has_profession_adaptability,
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">
          {character.character_name ?? character.name} — Progression
        </h1>
        <p className="text-sm text-zinc-500">
          DP earned drives level. Level (
          <span className="font-medium tabular-nums">{budget.derivedLevel}</span>
          ) is derived — not editable.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Total DP earned"
          value={budget.totalEarned}
          accent={
            character.has_profession_adaptability
              ? `(+15 PA)`
              : null
          }
        />
        <SummaryCard label="Total spent" value={budget.totalSpent} />
        <SummaryCard
          label="Available"
          value={budget.available}
          tone={budget.available < 0 ? "warn" : "ok"}
        />
        <SummaryCard label="Derived level" value={budget.derivedLevel} />
      </section>

      <section className="rounded-md border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
          Spend by tab
        </h2>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <BucketRow label="Categories" value={budget.byBucket.categories} />
          <BucketRow label="Skills" value={budget.byBucket.skills} />
          <BucketRow label="Weapons" value={budget.byBucket.weapons} />
          <BucketRow label="Talents" value={budget.byBucket.talents} />
        </dl>
      </section>

      <DpLedger characterId={id} sessions={budget.sessions} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
  tone = "ok",
}: {
  label: string;
  value: number;
  accent?: string | null;
  tone?: "ok" | "warn";
}) {
  return (
    <div className="rounded-md border border-zinc-200 bg-white px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div
        className={
          "mt-1 flex items-baseline gap-2 text-xl font-semibold tabular-nums " +
          (tone === "warn" ? "text-amber-700" : "text-zinc-900")
        }
      >
        <span>{value}</span>
        {accent && (
          <span className="text-xs font-normal text-zinc-500">{accent}</span>
        )}
      </div>
    </div>
  );
}

function BucketRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 text-base font-medium tabular-nums text-zinc-900">
        {value} DP
      </dd>
    </div>
  );
}
