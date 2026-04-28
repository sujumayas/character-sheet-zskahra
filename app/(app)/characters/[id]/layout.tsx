import Link from "next/link";
import { notFound } from "next/navigation";

import { CharacterTabs } from "@/components/sheet/character-tabs";
import { createClient } from "@/lib/supabase/server";

export default async function CharacterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: character } = await supabase
    .from("characters")
    .select("id, name, character_name, level, status")
    .eq("id", id)
    .maybeSingle();

  if (!character) {
    notFound();
  }

  const displayName = character.character_name ?? character.name;

  return (
    <div className="flex flex-col">
      <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4">
        <Link
          href="/characters"
          className="text-xs uppercase tracking-wide text-zinc-500 hover:text-zinc-800"
        >
          ← Characters
        </Link>
        <div className="mt-1 flex items-baseline gap-3">
          <h1 className="text-xl font-semibold">{displayName}</h1>
          {character.level != null && (
            <span className="text-sm text-zinc-500">
              Level {character.level}
            </span>
          )}
          {character.status && (
            <span className="text-xs uppercase tracking-wide text-zinc-400">
              {character.status}
            </span>
          )}
        </div>
      </div>
      <CharacterTabs characterId={id} />
      <div className="flex-1 bg-zinc-50">{children}</div>
    </div>
  );
}
