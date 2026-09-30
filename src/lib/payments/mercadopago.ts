import "server-only";
import crypto from "node:crypto";
import { serverEnv } from "@/lib/env.server";
import { PLAN_MONTHS, PRICES, type Plan } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { recordPurchase } from "./purchases";
import { upsertSubscription } from "./subscriptions";

// Pix has no recurring charge here: each approved payment buys one period
// (a month or a year), stacked after any time the user still has.

const API_URL =
  process.env.MERCADOPAGO_API_URL ?? "https://api.mercadopago.com";

async function mpFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serverEnv("MERCADOPAGO_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  if (!response.ok)
    throw new Error(
      `Mercado Pago ${path} failed: ${response.status} ${await response.text()}`,
    );
  return response.json() as Promise<T>;
}

/** Pix-only Checkout Pro preference for any single item. */
async function createPixPreference(input: {
  itemId: string;
  title: string;
  amountMinor: number;
  email: string | null;
  externalReference: string;
  successUrl: string;
  failureUrl: string;
  notificationUrl: string;
}): Promise<string> {
  const preference = await mpFetch<{ init_point: string }>(
    "/checkout/preferences",
    {
      method: "POST",
      // Retrying the same click must not create two charges.
      headers: { "X-Idempotency-Key": crypto.randomUUID() },
      body: JSON.stringify({
        items: [
          {
            id: input.itemId,
            title: input.title,
            quantity: 1,
            currency_id: "BRL",
            unit_price: input.amountMinor / 100,
          },
        ],
        payer: input.email ? { email: input.email } : undefined,
        external_reference: input.externalReference,
        notification_url: input.notificationUrl,
        back_urls: {
          success: input.successUrl,
          pending: input.successUrl,
          failure: input.failureUrl,
        },
        auto_return: "approved",
        // Pix only: cards in BRL are out of scope.
        payment_methods: {
          excluded_payment_types: [
            "credit_card",
            "debit_card",
            "ticket",
            "atm",
            "prepaid_card",
          ].map((id) => ({ id })),
          installments: 1,
        },
      }),
    },
  );
  return preference.init_point;
}

type CheckoutUrls = {
  email: string | null;
  successUrl: string;
  failureUrl: string;
  notificationUrl: string;
};

export function createPixCheckout(
  input: CheckoutUrls & { userId: string; plan: Plan; title: string },
) {
  return createPixPreference({
    ...input,
    itemId: `cinematic-chef-${input.plan}`,
    amountMinor: PRICES.BRL[input.plan],
    externalReference: `${input.userId}:${input.plan}`,
  });
}

export function createBundlePixCheckout(
  input: CheckoutUrls & {
    userId: string;
    bundleId: string;
    title: string;
    amountMinor: number;
  },
) {
  return createPixPreference({
    ...input,
    itemId: `trip-${input.bundleId}`,
    externalReference: `bundle:${input.userId}:${input.bundleId}`,
  });
}

/**
 * Validates the x-signature header: HMAC-SHA256 over
 * "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" with the webhook secret.
 */
export function verifyMercadoPagoSignature(input: {
  signature: string | null;
  requestId: string | null;
  dataId: string;
}): boolean {
  if (!input.signature || !input.requestId) return false;
  const parts = Object.fromEntries(
    input.signature
      .split(",")
      .map((part) => part.trim().split("=", 2) as [string, string]),
  );
  if (!parts.ts || !parts.v1) return false;
  const manifest = `id:${input.dataId.toLowerCase()};request-id:${input.requestId};ts:${parts.ts};`;
  const expected = crypto
    .createHmac("sha256", serverEnv("MERCADOPAGO_WEBHOOK_SECRET"))
    .update(manifest)
    .digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

type MpPayment = {
  id: number;
  status: string;
  currency_id: string;
  transaction_amount: number;
  external_reference: string | null;
  payer?: { id?: string | number };
};

/** Fetches the payment from Mercado Pago (never trusting the webhook body) and grants the period. */
export async function processMercadoPagoPayment(
  paymentId: string,
): Promise<"granted" | "ignored"> {
  const payment = await mpFetch<MpPayment>(
    `/v1/payments/${encodeURIComponent(paymentId)}`,
  );
  if (payment.status !== "approved" || payment.currency_id !== "BRL")
    return "ignored";
  const reference = payment.external_reference ?? "";
  if (reference.startsWith("bundle:"))
    return processBundlePayment(payment, reference);

  const [userId, plan] = reference.split(":") as [string, Plan];
  if (!userId || !(plan in PLAN_MONTHS)) return "ignored";
  // Guards against a tampered preference with a lower price.
  if (Math.round(payment.transaction_amount * 100) < PRICES.BRL[plan])
    return "ignored";

  const supabase = createAdminClient();
  // The account may have been deleted after paying; nothing to grant then.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return "ignored";
  const providerSubscriptionId = String(payment.id);
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("provider_subscription_id, current_period_end")
    .eq("user_id", userId)
    .eq("provider", "mercadopago")
    .order("current_period_end", { ascending: false });

  // Webhook retry for a payment we already granted: keep its original period.
  const already = existing?.find(
    (row) => row.provider_subscription_id === providerSubscriptionId,
  );
  if (already) return "granted";

  const latestEnd = existing?.[0]
    ? new Date(existing[0].current_period_end)
    : null;
  const start = latestEnd && latestEnd > new Date() ? latestEnd : new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + PLAN_MONTHS[plan]);

  await upsertSubscription({
    userId,
    provider: "mercadopago",
    providerCustomerId: payment.payer?.id ? String(payment.payer.id) : null,
    providerSubscriptionId,
    plan,
    currency: "BRL",
    status: "active",
    currentPeriodEnd: end,
  });
  return "granted";
}

async function processBundlePayment(
  payment: MpPayment,
  reference: string,
): Promise<"granted" | "ignored"> {
  const [, userId, bundleId] = reference.split(":");
  const supabase = createAdminClient();
  const [{ data: bundle }, { data: profile }] = await Promise.all([
    supabase
      .from("bundles")
      .select("price_brl")
      .eq("id", bundleId)
      .maybeSingle(),
    supabase.from("profiles").select("id").eq("id", userId).maybeSingle(),
  ]);
  if (!bundle || !profile) return "ignored";
  const paid = Math.round(payment.transaction_amount * 100);
  // Guards against a tampered preference with a lower price.
  if (paid < bundle.price_brl) return "ignored";
  await recordPurchase({
    userId,
    bundleId,
    provider: "mercadopago",
    providerPaymentId: String(payment.id),
    amount: paid,
    currency: "BRL",
  });
  return "granted";
}
