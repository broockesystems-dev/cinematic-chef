import "server-only";
import type { Currency, Plan } from "@/lib/plans";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];

export type SubscriptionUpsert = {
  userId: string;
  provider: "stripe" | "mercadopago";
  providerCustomerId: string | null;
  providerSubscriptionId: string;
  plan: Plan;
  currency: Currency;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
};

/**
 * The only writer of `subscriptions`, called from verified webhooks. Upserting
 * on the provider's ID makes webhook retries and out-of-order events safe.
 */
export async function upsertSubscription(
  input: SubscriptionUpsert,
): Promise<void> {
  const { error } = await createAdminClient().from("subscriptions").upsert(
    {
      user_id: input.userId,
      provider: input.provider,
      provider_customer_id: input.providerCustomerId,
      provider_subscription_id: input.providerSubscriptionId,
      plan: input.plan,
      currency: input.currency,
      status: input.status,
      current_period_end: input.currentPeriodEnd.toISOString(),
    },
    { onConflict: "provider,provider_subscription_id" },
  );
  if (error) throw error;
}

export type ActiveSubscription = {
  provider: "stripe" | "mercadopago";
  plan: Plan;
  currency: Currency;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  providerCustomerId: string | null;
};
