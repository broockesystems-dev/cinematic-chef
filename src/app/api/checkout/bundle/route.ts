import { NextResponse } from "next/server";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { getAccount } from "@/lib/account";
import { publicEnv } from "@/lib/env";
import type { I18nText } from "@/lib/i18n-text";
import { localize } from "@/lib/i18n-text";
import { createBundlePixCheckout } from "@/lib/payments/mercadopago";
import { getStripe } from "@/lib/payments/stripe";
import { currencyFor } from "@/lib/plans";
import { rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";

const BodySchema = z.object({
  slug: z.string().min(1).max(200),
  locale: z.enum(routing.locales),
  country: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .optional(),
});

/** One-off payment for a trip. Access is granted by the payment webhook. */
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
  const { slug, locale } = body.data;

  const supabase = await createClient();
  const { data: bundle } = await supabase
    .from("bundles")
    .select("id, slug, name, price_brl, price_usd")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!bundle)
    return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: owned } = await supabase
    .from("purchases")
    .select("id")
    .eq("bundle_id", bundle.id)
    .maybeSingle();
  if (owned)
    return NextResponse.json({ error: "already_owned" }, { status: 409 });

  let country = account.country;
  if (!country) {
    if (!body.data.country)
      return NextResponse.json({ error: "country_required" }, { status: 400 });
    country = body.data.country;
    await supabase.from("profiles").update({ country }).eq("id", account.id);
  }

  const site = publicEnv.siteUrl;
  const title = `The Cinematic Chef — ${localize(bundle.name as I18nText, locale).text}`;
  const successUrl = `${site}/${locale}/trips/${bundle.slug}?purchase=success`;
  const cancelUrl = `${site}/${locale}/trips/${bundle.slug}`;

  try {
    if (currencyFor(country) === "BRL") {
      const url = await createBundlePixCheckout({
        userId: account.id,
        bundleId: bundle.id,
        title,
        amountMinor: bundle.price_brl,
        email: account.email,
        successUrl,
        failureUrl: cancelUrl,
        notificationUrl: `${site}/api/webhooks/mercadopago`,
      });
      return NextResponse.json({ url });
    }
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: bundle.price_usd,
            product_data: { name: title },
          },
        },
      ],
      ...(account.stripeCustomerId
        ? { customer: account.stripeCustomerId }
        : { customer_email: account.email ?? undefined }),
      client_reference_id: account.id,
      metadata: { kind: "bundle", user_id: account.id, bundle_id: bundle.id },
      locale: locale === "pt" ? "pt-BR" : "en",
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("bundle checkout failed", error);
    return NextResponse.json({ error: "provider_error" }, { status: 502 });
  }
}
