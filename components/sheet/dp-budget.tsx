"use client";

import { cn } from "@/lib/utils";

interface DpBudgetProps {
  label: string;
  spent: number;
  available: number;
  className?: string;
}

export function DpBudget({ label, spent, available, className }: DpBudgetProps) {
  const ratio = available > 0 ? Math.min(spent / available, 1.5) : 0;
  const over = spent > available;
  return (
    <div
      className={cn(
        "rounded-md border border-zinc-200 bg-white px-4 py-3",
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {label}
        </span>
        <span
          className={cn(
            "text-sm tabular-nums",
            over ? "text-red-600 font-semibold" : "text-zinc-700",
          )}
        >
          {spent} / {available} DP
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className={cn(
            "h-full transition-all",
            over ? "bg-red-500" : "bg-zinc-700",
          )}
          style={{ width: `${Math.min(100, ratio * 100)}%` }}
        />
      </div>
    </div>
  );
}
