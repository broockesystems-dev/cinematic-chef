import "server-only";
import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import type { ActiveSubscription } from "@/lib/payments/subscriptions";
import type { Currency, Plan } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";

export type Account = {
  id: string;
  email: string | null;
  displayName: string | null;
  locale: "pt" | "en";
  country: string | null;
  role: "user" | "admin";
  /** The subscription currently granting access, if any. */
  subscription: ActiveSubscription | null;
  /** Most recent Stripe customer, for the billing portal. */
  stripeCustomerId: string | null;
};

/** The signed-in user's profile and subscription, read through RLS. */
export const getAccount = cache(async (): Promise<Account | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const [{ data: profile }, { data: subscriptions }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, locale, country, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("subscriptions")
      .select(
        "provider, plan, currency, status, current_period_end, provider_customer_id",
      )
      .eq("user_id", user.id)
      .order("current_period_end", { ascending: false }),
  ]);

  const now = new Date();
  const active = subscriptions?.find(
    (s) =>
      ["active", "trialing"].includes(s.status) &&
      new Date(s.current_period_end) > now,
  );
  return {
    id: user.id,
    email: user.email,
    displayName: profile?.display_name ?? null,
    locale: profile?.locale === "en" ? "en" : "pt",
    country: profile?.country ?? null,
    role: user.role,
    subscription: active
      ? {
          provider: active.provider,
          plan: active.plan as Plan,
          currency: active.currency as Currency,
          status: active.status,
          currentPeriodEnd: active.current_period_end,
          providerCustomerId: active.provider_customer_id,
        }
      : null,
    stripeCustomerId:
      subscriptions?.find((s) => s.provider === "stripe")
        ?.provider_customer_id ?? null,
  };
});
