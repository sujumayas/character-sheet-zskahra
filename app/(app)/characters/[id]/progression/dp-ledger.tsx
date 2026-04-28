"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { deleteDpSessionAction, grantDpAction } from "./actions";

interface SessionRow {
  id: string;
  session_date: string | null;
  dp_gained: number;
  notes: string | null;
}

export function DpLedger({
  characterId,
  sessions,
}: {
  characterId: string;
  sessions: SessionRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [dp, setDp] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  function submit() {
    const parsed = Number(dp);
    if (!Number.isFinite(parsed) || parsed === 0) {
      toast.error("Enter a non-zero DP amount.");
      return;
    }
    startTransition(async () => {
      const result = await grantDpAction({
        characterId,
        dpGained: parsed,
        sessionDate: date,
        notes: notes.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("DP session recorded");
      setDp("");
      setNotes("");
    });
  }

  function remove(sessionId: string) {
    if (!confirm("Delete this DP grant? Level will recompute.")) return;
    startTransition(async () => {
      const result = await deleteDpSessionAction({ characterId, sessionId });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Session deleted");
    });
  }

  return (
    <section className="rounded-md border border-zinc-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">
        DP grants
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        Each row records when DPs were awarded. The character&apos;s level is derived
        from the running total via <code>level_progression</code>. Negative
        values are allowed for corrections.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[120px_140px_1fr_auto]">
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            DP
          </label>
          <Input
            type="number"
            inputMode="numeric"
            placeholder="50"
            value={dp}
            onChange={(e) => setDp(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Date
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs uppercase tracking-wide text-zinc-500">
            Notes (optional)
          </label>
          <Input
            placeholder="Session 12 — boss fight"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button onClick={submit} disabled={pending} className="w-full">
            {pending ? "Saving…" : "Add"}
          </Button>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-md border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium text-right">DP</th>
              <th className="px-3 py-2 font-medium">Notes</th>
              <th className="px-3 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sessions.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-6 text-center text-zinc-400"
                >
                  No grants yet.
                </td>
              </tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id}>
                  <td className="px-3 py-2 tabular-nums text-zinc-700">
                    {s.session_date ?? "—"}
                  </td>
                  <td
                    className={
                      "px-3 py-2 text-right tabular-nums font-medium " +
                      (s.dp_gained < 0 ? "text-red-600" : "text-zinc-900")
                    }
                  >
                    {s.dp_gained > 0 ? `+${s.dp_gained}` : s.dp_gained}
                  </td>
                  <td className="px-3 py-2 text-zinc-600">{s.notes ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={pending}
                      onClick={() => remove(s.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
