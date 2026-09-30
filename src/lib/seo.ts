import type { Metadata } from "next";
import { routing, type Locale } from "@/i18n/routing";

const HREFLANG: Record<Locale, string> = { pt: "pt-BR", en: "en" };

/**
 * Canonical URL plus hreflang alternates for a path that exists in every
 * locale, e.g. alternates("en", "/dish/pizza-fritta").
 */
export function alternates(
  locale: Locale,
  path: string,
): Metadata["alternates"] {
  const suffix = path === "/" ? "" : path;
  return {
    canonical: `/${locale}${suffix}`,
    languages: {
      ...Object.fromEntries(
        routing.locales.map((l) => [HREFLANG[l], `/${l}${suffix}`]),
      ),
      "x-default": `/${routing.defaultLocale}${suffix}`,
    },
  };
}

export function openGraphLocale(locale: Locale): string {
  return locale === "pt" ? "pt_BR" : "en_US";
}

/** Title, description, hreflang and a matching Open Graph block for a page. */
export function pageMetadata(input: {
  locale: Locale;
  path: string;
  title?: string;
  description?: string;
  type?: "website" | "article";
}): Metadata {
  const suffix = input.path === "/" ? "" : input.path;
  return {
    ...(input.title && { title: input.title }),
    ...(input.description && { description: input.description }),
    alternates: alternates(input.locale, input.path),
    openGraph: {
      type: input.type ?? "website",
      siteName: "The Cinematic Chef",
      locale: openGraphLocale(input.locale),
      url: `/${input.locale}${suffix}`,
      ...(input.title && { title: input.title }),
      ...(input.description && { description: input.description }),
    },
  };
}
