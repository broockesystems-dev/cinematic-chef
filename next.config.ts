import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Local Supabase serves images from 127.0.0.1, which the image optimizer
// blocks by default. Only relax that when the app points at a local stack.
const supabaseHost = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost",
).hostname;
const isLocalSupabase = ["127.0.0.1", "localhost"].includes(supabaseHost);

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Wake Lock is used by cook mode; nothing else needs device features.
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), screen-wake-lock=(self)",
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Put metadata in <head> for every user agent (crawlers and link-preview
  // bots alike) instead of streaming it into the body after the shell.
  htmlLimitedBots: /.*/,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  images: {
    dangerouslyAllowLocalIP: isLocalSupabase,
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "image.mux.com" },
      { protocol: "http", hostname: "127.0.0.1", port: "54321" },
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withNextIntl(nextConfig);
