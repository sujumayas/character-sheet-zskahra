"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const TABS = [
  { slug: "stats", label: "Stats" },
  { slug: "categories", label: "Categories" },
  { slug: "skills", label: "Skills" },
  { slug: "weapons", label: "Weapons" },
  { slug: "talents", label: "Talents" },
  { slug: "progression", label: "Progression" },
] as const;

export function CharacterTabs({ characterId }: { characterId: string }) {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-200 bg-white px-6">
      <ul className="-mb-px flex gap-1 overflow-x-auto">
        {TABS.map((tab) => {
          const href = `/characters/${characterId}/${tab.slug}`;
          const active = pathname?.startsWith(href);
          return (
            <li key={tab.slug}>
              <Link
                href={href}
                className={cn(
                  "inline-block border-b-2 px-3 py-2 text-sm font-medium whitespace-nowrap",
                  active
                    ? "border-zinc-900 text-zinc-900"
                    : "border-transparent text-zinc-500 hover:text-zinc-800",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
