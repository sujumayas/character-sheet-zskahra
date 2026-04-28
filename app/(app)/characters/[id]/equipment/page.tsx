import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { EquipmentEditor } from "./equipment-editor";

export default async function EquipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: character },
    { data: description },
    { data: armorTypes },
    { data: bodyParts },
    { data: shields },
    { data: characterArmor },
    { data: characterShield },
  ] = await Promise.all([
    supabase
      .from("characters")
      .select("id")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("character_description")
      .select("character_id, wear_armor_score")
      .eq("character_id", id)
      .maybeSingle(),
    supabase
      .from("armor_types")
      .select("id, name, full_armor_bonus, min_penalty, max_penalty, display_order")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("body_parts")
      .select("id, name, percent_covered, display_order")
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("shields")
      .select(
        "id, name, untrained_db, trained_db, crit_damage_type, crit_size_modifier, hits, weight_lb, notes, display_order",
      )
      .eq("is_active", true)
      .order("display_order"),
    supabase
      .from("character_armor")
      .select(
        "id, body_part_id, armor_type_id, crafting_multiplier, notes",
      )
      .eq("character_id", id),
    supabase
      .from("character_shield")
      .select("id, shield_id, special_bonus, is_trained, hits_used, notes")
      .eq("character_id", id)
      .maybeSingle(),
  ]);

  if (!character) notFound();

  return (
    <EquipmentEditor
      characterId={id}
      hasDescriptionRow={description != null}
      wearArmorScore={description?.wear_armor_score ?? 0}
      armorTypes={armorTypes ?? []}
      bodyParts={bodyParts ?? []}
      shields={shields ?? []}
      characterArmor={characterArmor ?? []}
      characterShield={characterShield ?? null}
    />
  );
}
