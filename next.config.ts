import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Local Supabase serves images from 127.0.0.1, which the image optimizer
// blocks by default. Only relax that when the app points at a local stack.
const supabaseHost = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost",
).hostname;
const isLocalSupabase = ["127.0.0.1", "localhost"].includes(supabaseHost);

const nextConfig: NextConfig = {
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
