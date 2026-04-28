import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export default async function CharactersPage() {
  const supabase = await createClient();
  const { data: characters, error } = await supabase
    .from("characters")
    .select("id, name, character_name, level, status")
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your characters</h1>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Failed to load characters: {error.message}
        </p>
      )}

      {!error && (!characters || characters.length === 0) && (
        <div className="rounded-md border border-dashed border-zinc-300 p-8 text-center">
          <p className="text-sm text-zinc-500">
            No characters yet. The seed character lands at the end of Phase 1.
          </p>
        </div>
      )}

      {characters && characters.length > 0 && (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white">
          {characters.map((character) => (
            <li key={character.id}>
              <Link
                href={`/characters/${character.id}/stats`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-zinc-50"
              >
                <span className="font-medium">
                  {character.character_name ?? character.name}
                </span>
                <span className="text-zinc-500">
                  {character.level != null ? `L${character.level}` : "—"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
