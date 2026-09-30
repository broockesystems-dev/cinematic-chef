"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { SLUG_PATTERN } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import {
  check,
  checkRow,
  runAction,
  type ActionResult,
} from "../action-result";
import { i18nText, optionalI18nText } from "../schemas";

const BundleSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(SLUG_PATTERN, "Use só letras minúsculas, números e hífens"),
  name: i18nText(120),
  description: optionalI18nText(2000),
  cover_url: z.url().nullable(),
  price_brl: z.number().int().positive("Preço em reais obrigatório"),
  price_usd: z.number().int().positive("Preço em dólares obrigatório"),
  status: z.enum(["draft", "published"]),
  dish_ids: z
    .array(z.guid())
    .min(2, "Escolha pelo menos 2 pratos")
    .max(10, "No máximo 10 pratos"),
});

export async function saveBundle(
  id: string | null,
  input: z.input<typeof BundleSchema>,
): Promise<ActionResult<{ id: string }>> {
  return runAction(async () => {
    await assertAdmin();
    const { dish_ids, description, ...values } = BundleSchema.parse(input);
    const row = { ...values, description: description ?? { pt: "" } };
    const supabase = await createClient();
    const saved = id
      ? checkRow(
          await supabase
            .from("bundles")
            .update(row)
            .eq("id", id)
            .select("id")
            .single(),
        )
      : checkRow(
          await supabase.from("bundles").insert(row).select("id").single(),
        );
    // Replacing the list only changes which dishes the trip unlocks; purchases stay.
    check(
      await supabase.from("bundle_dishes").delete().eq("bundle_id", saved.id),
    );
    check(
      await supabase.from("bundle_dishes").insert(
        dish_ids.map((dish_id, position) => ({
          bundle_id: saved.id,
          dish_id,
          position,
        })),
      ),
    );
    revalidatePath("/", "layout");
    return { id: saved.id };
  });
}

export async function deleteBundle(id: string): Promise<ActionResult> {
  return runAction(async () => {
    await assertAdmin();
    const supabase = await createClient();
    // Purchases reference the trip (on delete restrict): sold trips can only be unpublished.
    check(await supabase.from("bundles").delete().eq("id", id));
    revalidatePath("/", "layout");
    return null;
  });
}
