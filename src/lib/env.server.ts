import "server-only";

// Secrets are read lazily so a missing optional key (e.g. Stripe during local
// dev) only fails the feature that needs it, not the whole app.
export function serverEnv(name: ServerEnvName): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export type ServerEnvName =
  | "SUPABASE_SECRET_KEY"
  | "ANTHROPIC_API_KEY"
  | "MUX_TOKEN_ID"
  | "MUX_TOKEN_SECRET"
  | "MUX_WEBHOOK_SECRET"
  | "MUX_SIGNING_KEY"
  | "MUX_PRIVATE_KEY"
  | "STRIPE_SECRET_KEY"
  | "STRIPE_WEBHOOK_SECRET"
  | "STRIPE_PRICE_MONTHLY"
  | "STRIPE_PRICE_ANNUAL"
  | "MERCADOPAGO_ACCESS_TOKEN"
  | "MERCADOPAGO_WEBHOOK_SECRET";
