import type { Locale } from "@/i18n/routing";

/** Shape of every bilingual JSONB column. PT is always present. */
export type I18nText = { pt: string; en?: string };

export type LocalizedText = {
  text: string;
  /** Locale actually shown; differs from the requested one on fallback. */
  locale: Locale;
  isFallback: boolean;
};

/**
 * Picks the text for `locale`, falling back to the other language when the
 * translation is missing so the UI can flag it discreetly.
 */
export function localize(
  value: I18nText | null | undefined,
  locale: Locale,
): LocalizedText {
  const wanted = value?.[locale]?.trim();
  if (wanted) return { text: wanted, locale, isFallback: false };

  const other: Locale = locale === "pt" ? "en" : "pt";
  const fallback = value?.[other]?.trim() ?? "";
  return { text: fallback, locale: other, isFallback: fallback.length > 0 };
}
