"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { useDebouncedCallback } from "@/lib/hooks/use-debounced-callback";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string | null;
  onCommit: (next: string) => void;
  debounceMs?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function EditableText({
  value,
  onCommit,
  debounceMs = 400,
  disabled = false,
  className,
  placeholder,
}: EditableTextProps) {
  const [draft, setDraft] = useState<string>(value ?? "");
  const [lastProp, setLastProp] = useState<string | null>(value);
  if (value !== lastProp) {
    setLastProp(value);
    setDraft(value ?? "");
  }

  const debouncedCommit = useDebouncedCallback((next: string) => {
    onCommit(next);
  }, debounceMs);

  return (
    <Input
      type="text"
      className={cn("h-9", className)}
      value={draft}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => {
        setDraft(e.target.value);
        debouncedCommit(e.target.value);
      }}
    />
  );
}
