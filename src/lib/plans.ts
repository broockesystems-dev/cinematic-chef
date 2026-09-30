export type Plan = "monthly" | "annual";
export type Currency = "BRL" | "USD";

export const PLANS: Plan[] = ["monthly", "annual"];

export const PLAN_MONTHS: Record<Plan, number> = { monthly: 1, annual: 12 };

/**
 * Display prices in minor units. BRL is charged by Mercado Pago using these
 * amounts; USD is charged by the Stripe Prices in STRIPE_PRICE_MONTHLY /
 * STRIPE_PRICE_ANNUAL, which must match.
 */
export const PRICES: Record<Currency, Record<Plan, number>> = {
  BRL: { monthly: 1990, annual: 19900 },
  USD: { monthly: 599, annual: 5900 },
};

/** Brazil pays in BRL with Pix (Mercado Pago); everyone else in USD by card (Stripe). */
export function currencyFor(country: string | null | undefined): Currency {
  return country === "BR" ? "BRL" : "USD";
}

export function formatPrice(
  amountMinor: number,
  currency: Currency,
  locale: string,
): string {
  return new Intl.NumberFormat(locale === "pt" ? "pt-BR" : "en-US", {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}
