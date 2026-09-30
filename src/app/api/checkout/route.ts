import { NextResponse } from "next/server";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { getAccount } from "@/lib/account";
import { publicEnv } from "@/lib/env";
import { createPixCheckout } from "@/lib/payments/mercadopago";
import { getStripe, stripePriceFor } from "@/lib/payments/stripe";
import { currencyFor } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  plan: z.enum(["monthly", "annual"]),
  locale: z.enum(routing.locales),
  /** Only used when the profile has no country yet. */
  country: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
});

const PLAN_TITLES = {
  monthly: "The Cinematic Chef — assinatura mensal",
  annual: "The Cinematic Chef — assinatura anual",
};

// Creates a payment session with the provider for the user's currency. Access
// is granted later by the provider's webhook, never by the browser returning.
export async function POST(request: Request) {
  const account = await getAccount();
  if (!account)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (!(await rateLimit(`checkout:${account.id}`, 10, 600))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const { plan, locale } = body.data;

  if (account.subscription)
    return NextResponse.json({ error: "already_subscribed" }, { status: 409 });

  let country = account.country;
  if (!country) {
    if (!body.data.country)
      return NextResponse.json({ error: "country_required" }, { status: 400 });
    country = body.data.country;
    const supabase = await createClient();
    await supabase.from("profiles").update({ country }).eq("id", account.id);
  }

  const site = publicEnv.siteUrl;
  const successUrl = `${site}/${locale}/account?checkout=success`;
  const cancelUrl = `${site}/${locale}/pricing?checkout=canceled`;

  try {
    if (currencyFor(country) === "BRL") {
      const url = await createPixCheckout({
        userId: account.id,
        email: account.email,
        plan,
        title: PLAN_TITLES[plan],
        successUrl,
        failureUrl: cancelUrl,
        notificationUrl: `${site}/api/webhooks/mercadopago`,
      });
      return NextResponse.json({ url });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: stripePriceFor(plan), quantity: 1 }],
      ...(account.stripeCustomerId
        ? { customer: account.stripeCustomerId }
        : { customer_email: account.email ?? undefined }),
      client_reference_id: account.id,
      metadata: { user_id: account.id, plan },
      subscription_data: { metadata: { user_id: account.id, plan } },
      allow_promotion_codes: true,
      locale: locale === "pt" ? "pt-BR" : "en",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("checkout failed", error);
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }
}
