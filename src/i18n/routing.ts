import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt", "en"],
  defaultLocale: "pt",
  // Always prefix so every page has a stable /pt and /en URL for hreflang.
  localePrefix: "always",
});

export type Locale = (typeof routing.locales)[number];
