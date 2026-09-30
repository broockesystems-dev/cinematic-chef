"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { getStripe } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

const PreferencesSchema = z.object({
  displayName: z.string().trim().max(80),
  locale: z.enum(["pt", "en"]),
  country: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
});

export async function updatePreferences(
  input: z.input<typeof PreferencesSchema>,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  const values = PreferencesSchema.safeParse(input);
  if (!values.success) return { ok: false, error: "invalid" };

  const supabase = await createClient();
  // RLS limits this to the user's own row; column grants block `role`.
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: values.data.displayName || null,
      locale: values.data.locale,
      country: values.data.country,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: "failed" };
  revalidatePath("/[locale]/account", "page");
  return { ok: true };
}

export async function setFavorite(
  dishId: string,
  favorite: boolean,
): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  if (!z.guid().safeParse(dishId).success)
    return { ok: false, error: "invalid" };

  const supabase = await createClient();
  const { error } = favorite
    ? await supabase.from("favorites").upsert(
        { user_id: user.id, dish_id: dishId },
        // DO NOTHING on duplicates: favorites grants INSERT but not UPDATE.
        { onConflict: "user_id,dish_id", ignoreDuplicates: true },
      )
    : await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("dish_id", dishId);
  if (error) return { ok: false, error: "failed" };
  revalidatePath("/[locale]/account", "page");
  return { ok: true };
}

/**
 * LGPD: deletes the account and its data. Card subscriptions are cancelled
 * first so the user is never charged again. Deleting the auth user cascades
 * to profile, favorites and subscription rows. Payment records kept by
 * Stripe/Mercado Pago for tax purposes stay with them.
 */
export async function deleteAccount(): Promise<Result> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthenticated" };
  const admin = createAdminClient();

  const { data: subscriptions } = await admin
    .from("subscriptions")
    .select("provider_subscription_id, status")
    .eq("user_id", user.id)
    .eq("provider", "stripe")
    .in("status", ["active", "trialing", "past_due", "unpaid", "incomplete"]);
  try {
    for (const subscription of subscriptions ?? []) {
      await getStripe().subscriptions.cancel(
        subscription.provider_subscription_id,
      );
    }
  } catch (error) {
    console.error(
      "could not cancel stripe subscription before deletion",
      error,
    );
    return { ok: false, error: "billing" };
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: "failed" };

  // The server-side session is gone with the user; just clear the cookies.
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
  return { ok: true };
}
