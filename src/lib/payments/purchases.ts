import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Records a one-off trip purchase from a verified webhook. Idempotent: a
 * retried webhook, or a second payment for a trip the user already owns,
 * leaves the existing purchase untouched.
 */
export async function recordPurchase(input: {
  userId: string;
  bundleId: string;
  provider: "stripe" | "mercadopago";
  providerPaymentId: string;
  amount: number;
  currency: "BRL" | "USD";
}): Promise<"recorded" | "duplicate"> {
  const { error } = await createAdminClient().from("purchases").insert({
    user_id: input.userId,
    bundle_id: input.bundleId,
    provider: input.provider,
    provider_payment_id: input.providerPaymentId,
    amount: input.amount,
    currency: input.currency,
  });
  if (error?.code === "23505") return "duplicate";
  if (error) throw error;
  return "recorded";
}
