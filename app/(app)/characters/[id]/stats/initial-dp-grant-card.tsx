"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { INITIAL_L1_DP } from "@/lib/domain/progression";

import { grantInitialDpAction } from "./actions";

interface StatStatus {
  code: string;
  filled: boolean;
}

export function InitialDpGrantCard({
  characterId,
  hasProfessionAdaptability,
  statStatuses,
}: {
  characterId: string;
  hasProfessionAdaptability: boolean;
  statStatuses: StatStatus[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const allFilled = statStatuses.every((s) => s.filled);

  function handleConfirm() {
    startTransition(async () => {
      const result = await grantInitialDpAction({ characterId });
      if (result.ok) {
        toast.success(
          `Granted ${INITIAL_L1_DP} starting DPs. Welcome to level 1.`,
        );
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-5">
      <h2 className="font-heading text-base font-semibold text-amber-900">
        Ready for level 1?
      </h2>
      <p className="mt-1 text-sm text-amber-900/80">
        New characters receive {INITIAL_L1_DP} Development Points to spend on
        categories, skills, talents, and more.
        {hasProfessionAdaptability ? (
          <>
            {" "}
            With <strong>Profession Adaptability</strong> you&apos;ll see an
            additional +15 in your budget.
          </>
        ) : null}
      </p>

      {allFilled ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="default"
            size="lg"
            onClick={() => setOpen(true)}
            disabled={isPending}
          >
            Receive initial L1 DPs
          </Button>
          <span className="text-xs text-amber-900/70">
            All 8 stats are filled.
          </span>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-xs uppercase tracking-wide text-amber-900/70">
            Fill all 8 stat percentiles to claim:
          </p>
          <ul className="mt-2 flex flex-wrap gap-2 text-xs">
            {statStatuses.map((s) => (
              <li
                key={s.code}
                className={
                  s.filled
                    ? "rounded border border-emerald-300 bg-emerald-100 px-2 py-1 font-medium text-emerald-900"
                    : "rounded border border-amber-300 bg-white/60 px-2 py-1 text-amber-900/70"
                }
              >
                {s.filled ? "✓ " : "○ "}
                {s.code}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>This is irreversible</DialogTitle>
            <DialogDescription>
              You&apos;re about to receive {INITIAL_L1_DP} Development Points as your
              level-1 starting grant. After this, changes to your stats will not
              grant additional DPs — those will be treated as narrative effects.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={
                <Button variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              }
            />
            <Button
              variant="default"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? "Granting…" : `Receive ${INITIAL_L1_DP} DPs`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
