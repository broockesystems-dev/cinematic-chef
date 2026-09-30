import "server-only";
import Stripe from "stripe";
import { serverEnv } from "@/lib/env.server";
import type { Plan } from "@/lib/plans";
import { upsertSubscription } from "./subscriptions";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  client ??= new Stripe(serverEnv("STRIPE_SECRET_KEY"), {
    // Local testing only: point the SDK at a mock (see README).
    ...(process.env.STRIPE_API_HOST
      ? {
          host: process.env.STRIPE_API_HOST,
          port: process.env.STRIPE_API_PORT,
          protocol: "http" as const,
        }
      : {}),
  });
  return client;
}

export function stripePriceFor(plan: Plan): string {
  return serverEnv(
    plan === "monthly" ? "STRIPE_PRICE_MONTHLY" : "STRIPE_PRICE_ANNUAL",
  );
}

function planForPrice(priceId: string | undefined): Plan {
  return priceId === process.env.STRIPE_PRICE_ANNUAL ? "annual" : "monthly";
}

const STATUS_MAP: Record<Stripe.Subscription.Status, SubscriptionStatusForDb> =
  {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "unpaid",
    incomplete: "incomplete",
    incomplete_expired: "expired",
    paused: "unpaid",
  };
type SubscriptionStatusForDb = Parameters<
  typeof upsertSubscription
>[0]["status"];

/**
 * Re-reads the subscription from Stripe and stores it. Fetching instead of
 * trusting the event body makes out-of-order webhooks harmless.
 */
export async function syncStripeSubscription(
  subscriptionId: string,
): Promise<void> {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata.user_id;
  if (!userId) {
    // Created outside the app (e.g. in the Stripe dashboard): nothing to link
    // it to. Acknowledge it instead of making Stripe retry for days.
    console.warn(
      `Stripe subscription ${subscriptionId} has no user_id metadata; ignored`,
    );
    return;
  }

  // Since API 2025-03, the billing period lives on each subscription item.
  const periodEnd = Math.max(
    ...subscription.items.data.map((item) => item.current_period_end),
  );

  await upsertSubscription({
    userId,
    provider: "stripe",
    providerCustomerId:
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id,
    providerSubscriptionId: subscription.id,
    plan: planForPrice(subscription.items.data[0]?.price.id),
    currency: "USD",
    status: STATUS_MAP[subscription.status],
    currentPeriodEnd: new Date(periodEnd * 1000),
  });
}
