"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { ancestry } from "@/lib/explore";
import { getExploreData } from "@/lib/explore.server";
import type { I18nText } from "@/lib/i18n-text";
import { USERNAME_PATTERN } from "@/lib/passport";
import { createClient } from "@/lib/supabase/server";

type Result<T = null> = { ok: true; data: T } | { ok: false; error: string };

/**
 * Marks a dish as cooked (or updates its photo). Returns the country and
 * whether this earned a new stamp, for the celebration toast.
 */
export async function markCooked(
  dishId: string,
  photoPath: string | null,
): Promise<Result<{ country: I18nText | null; newStamp: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  if (!z.guid().safeParse(dishId).success)
    return { ok: false, error: "invalid" };
  // Photos must live in the user's own folder of the private bucket.
  if (
    photoPath !== null &&
    (!photoPath.startsWith(`${user.id}/`) || photoPath.includes(".."))
  ) {
    return { ok: false, error: "invalid" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cooked_dishes")
    .insert({ user_id: user.id, dish_id: dishId, photo_path: photoPath });
  if (error?.code === "23505") {
    // Already stamped: this is a photo change.
    if (photoPath) {
      await supabase
        .from("cooked_dishes")
        .update({ photo_path: photoPath })
        .eq("user_id", user.id)
        .eq("dish_id", dishId);
    }
    revalidatePath("/[locale]/passport", "page");
    return { ok: true, data: { country: null, newStamp: false } };
  }
  if (error)
    return {
      ok: false,
      error: error.code === "42501" ? "forbidden" : "failed",
    };

  // New stamp when this is the first dish cooked from that country.
  const explore = await getExploreData();
  const locations = new Map(explore.locations.map((l) => [l.id, l]));
  const dish = explore.dishes.find((d) => d.id === dishId);
  const country = dish
    ? ancestry(dish.locationId, locations).find((l) => l.type === "country")
    : undefined;
  let newStamp = false;
  if (country) {
    const sameCountry = new Set(
      explore.dishes
        .filter((d) =>
          ancestry(d.locationId, locations).some((l) => l.id === country.id),
        )
        .map((d) => d.id),
    );
    const { data: mine } = await supabase
      .from("cooked_dishes")
      .select("dish_id")
      .eq("user_id", user.id);
    newStamp =
      (mine ?? []).filter((row) => sameCountry.has(row.dish_id)).length === 1;
  }
  revalidatePath("/[locale]/passport", "page");
  return { ok: true, data: { country: country?.name ?? null, newStamp } };
}

export async function removeCooked(dishId: string): Promise<Result> {
  const user = await getCurrentUser();
  if (!user || !z.guid().safeParse(dishId).success)
    return { ok: false, error: "invalid" };
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("cooked_dishes")
    .delete()
    .eq("user_id", user.id)
    .eq("dish_id", dishId)
    .select("photo_path")
    .maybeSingle();
  if (row?.photo_path)
    await supabase.storage.from("cooked").remove([row.photo_path]);
  revalidatePath("/[locale]/passport", "page");
  return { ok: true, data: null };
}

const SettingsSchema = z
  .object({
    username: z
      .string()
      .trim()
      .toLowerCase()
      .regex(USERNAME_PATTERN)
      .nullable(),
    isPublic: z.boolean(),
  })
  .refine((v) => !v.isPublic || v.username, { message: "username_required" });

export async function updatePassportSettings(
  input: z.input<typeof SettingsSchema>,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  const values = SettingsSchema.safeParse(input);
  if (!values.success) {
    const usernameRequired = values.error.issues.some(
      (i) => i.message === "username_required",
    );
    return {
      ok: false,
      error: usernameRequired ? "username_required" : "username_invalid",
    };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      username: values.data.username,
      passport_public: values.data.isPublic,
    })
    .eq("id", user.id);
  if (error)
    return {
      ok: false,
      error: error.code === "23505" ? "username_taken" : "failed",
    };
  revalidatePath("/[locale]/passport", "page");
  return { ok: true, data: null };
}
