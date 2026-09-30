import { NextResponse } from "next/server";
import { z } from "zod";
import { routing } from "@/i18n/routing";
import { getAccount } from "@/lib/account";
import { publicEnv } from "@/lib/env";
import { getStripe } from "@/lib/payments/stripe";

const BodySchema = z.object({ locale: z.enum(routing.locales) });

/** Stripe's hosted portal: change card, see invoices, cancel. */
export async function POST(request: Request) {
  const account = await getAccount();
  if (!account)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!account.stripeCustomerId)
    return NextResponse.json({ error: "no_customer" }, { status: 404 });

  const body = BodySchema.safeParse(await request.json().catch(() => null));
  const locale = body.success ? body.data.locale : routing.defaultLocale;

  const session = await getStripe().billingPortal.sessions.create({
    customer: account.stripeCustomerId,
    return_url: `${publicEnv.siteUrl}/${locale}/account`,
    locale: locale === "pt" ? "pt-BR" : "en",
  });
  return NextResponse.json({ url: session.url });
}
