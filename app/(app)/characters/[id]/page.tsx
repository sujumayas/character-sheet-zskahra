import { redirect } from "next/navigation";

export default async function CharacterIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/characters/${id}/stats`);
}
