import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { serverEnv } from "@/lib/env.server";
import { getStripe, syncStripeSubscription } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;
  try {
    // Rejects forged or replayed events (5-minute tolerance).
    event = await getStripe().webhooks.constructEventAsync(
      body,
      signature ?? "",
      serverEnv("STRIPE_WEBHOOK_SECRET"),
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          await syncStripeSubscription(
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription.id,
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await syncStripeSubscription(event.data.object.id);
        break;
    }
  } catch (error) {
    // 500 makes Stripe retry later.
    console.error("stripe webhook failed", event.type, error);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
