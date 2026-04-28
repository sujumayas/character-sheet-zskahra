"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  value: number;
  onCommit: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
}

export function NumberStepper({
  value,
  onCommit,
  min = 0,
  max = 999,
  step = 1,
  debounceMs = 400,
  disabled = false,
  className,
}: NumberStepperProps) {
  const [draft, setDraft] = useState(value);
  const [lastProp, setLastProp] = useState(value);
  if (value !== lastProp) {
    setLastProp(value);
    setDraft(value);
  }

  const debouncedCommit = useDebouncedCallback((next: number) => {
    onCommit(next);
  }, debounceMs);

  const clamp = (n: number) => Math.max(min, Math.min(max, n));

  const update = (next: number) => {
    const clamped = clamp(next);
    setDraft(clamped);
    debouncedCommit(clamped);
  };

  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-6"
        disabled={disabled || draft <= min}
        onClick={() => update(draft - step)}
        aria-label="Decrease"
      >
        <Minus className="size-3" />
      </Button>
      <input
        type="number"
        className="h-7 w-12 rounded-md border border-input bg-transparent px-1 text-center text-sm tabular-nums focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none disabled:opacity-50"
        value={draft}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) => {
          const parsed = e.target.value === "" ? 0 : Number(e.target.value);
          if (Number.isFinite(parsed)) update(parsed);
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="size-6"
        disabled={disabled || draft >= max}
        onClick={() => update(draft + step)}
        aria-label="Increase"
      >
        <Plus className="size-3" />
      </Button>
    </div>
  );
}
