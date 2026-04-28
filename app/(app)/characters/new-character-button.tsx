"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

interface Props {
  userId: string;
  statIds: string[];
  traitIds: string[];
}

export function NewCharacterButton({ userId, statIds, traitIds }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onCreate() {
    setBusy(true);
    const { data: created, error: charErr } = await supabase
      .from("characters")
      .insert({
        name: "New character",
        owner_user_id: userId,
        level: 1,
        total_dp: 140,
        available_dp: 140,
      })
      .select("id")
      .single();

    if (charErr || !created) {
      toast.error(`Failed to create character: ${charErr?.message ?? "unknown error"}`);
      setBusy(false);
      return;
    }

    const [statsRes, traitsRes] = await Promise.all([
      supabase
        .from("character_stats")
        .insert(statIds.map((stat_id) => ({ character_id: created.id, stat_id }))),
      supabase
        .from("character_traits")
        .insert(traitIds.map((trait_id) => ({ character_id: created.id, trait_id }))),
    ]);

    if (statsRes.error) toast.error(`Stats seed failed: ${statsRes.error.message}`);
    if (traitsRes.error) toast.error(`Traits seed failed: ${traitsRes.error.message}`);

    router.push(`/characters/${created.id}/stats`);
  }

  return (
    <Button onClick={onCreate} disabled={busy}>
      {busy ? "Creating…" : "New character"}
    </Button>
  );
}
