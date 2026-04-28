"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";

interface EditableNumberProps {
  value: number | null;
  onCommit: (next: number) => void;
  min?: number;
  max?: number;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function EditableNumber({
  value,
  onCommit,
  min,
  max,
  debounceMs = 400,
  disabled = false,
  className,
  placeholder,
}: EditableNumberProps) {
  const [draft, setDraft] = useState<string>(value == null ? "" : String(value));
  const [lastProp, setLastProp] = useState<number | null>(value);
  if (value !== lastProp) {
    setLastProp(value);
    setDraft(value == null ? "" : String(value));
  }

  const debouncedCommit = useDebouncedCallback((next: number) => {
    onCommit(next);
  }, debounceMs);

  return (
    <Input
      type="number"
      inputMode="numeric"
      className={cn("h-7 text-right tabular-nums", className)}
      value={draft}
      min={min}
      max={max}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        if (raw === "" || raw === "-") return;
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) return;
        if (min != null && parsed < min) return;
        if (max != null && parsed > max) return;
        debouncedCommit(parsed);
      }}
      onBlur={() => {
        if (draft === "" || draft === "-") {
          setDraft(value == null ? "" : String(value));
        }
      }}
    />
  );
}
