import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import type { DishPageData } from "@/lib/dishes";
import { publicEnv } from "@/lib/env";
import { localize } from "@/lib/i18n-text";
import { formatQuantity, pickMeasure, pluralCount } from "@/lib/quantity";

/** ISO 8601 duration, e.g. 90 → "PT1H30M". */
function isoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}`;
}

/**
 * schema.org Recipe for search results. Ingredients and steps are only
 * included when this visitor may see them, so premium recipes never leak
 * through structured data; those are marked as not free instead.
 */
export async function RecipeJsonLd({
  data,
  locale,
}: {
  data: DishPageData;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "Units" });
  const { dish, path, hasAccess } = data;
  const country = path.find((l) => l.type === "country");
  const system = locale === "en" ? "us" : "metric";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: localize(dish.name, locale).text,
    description: localize(dish.story, locale).text.slice(0, 300) || undefined,
    image: dish.cover_url ? [dish.cover_url] : undefined,
    inLanguage: locale === "pt" ? "pt-BR" : "en",
    url: `${publicEnv.siteUrl}/${locale}/dish/${dish.slug}`,
    datePublished: dish.published_at ?? undefined,
    author: { "@type": "Organization", name: "The Cinematic Chef" },
    recipeCuisine: country ? localize(country.name, locale).text : undefined,
    totalTime: dish.prep_minutes ? isoDuration(dish.prep_minutes) : undefined,
    recipeYield: String(dish.base_servings),
    isAccessibleForFree: dish.access === "free",
    video: data.teaser
      ? {
          "@type": "VideoObject",
          name: localize(dish.name, locale).text,
          description:
            localize(dish.story, locale).text.slice(0, 200) ||
            localize(dish.name, locale).text,
          thumbnailUrl: `https://image.mux.com/${data.teaser.playbackId}/thumbnail.webp`,
          contentUrl: `https://stream.mux.com/${data.teaser.playbackId}.m3u8`,
          uploadDate: dish.published_at ?? undefined,
        }
      : undefined,
    ...(hasAccess && {
      recipeIngredient: data.ingredients.map((ingredient) => {
        const measure = pickMeasure(
          {
            qtyMetric: ingredient.qty_metric,
            unitMetric: ingredient.unit_metric,
            qtyUs: ingredient.qty_us,
            unitUs: ingredient.unit_us,
          },
          system,
          dish.base_servings,
          dish.base_servings,
        );
        const name = localize(ingredient.name, locale).text;
        if (!measure) return name;
        const unit = measure.unit
          ? t(measure.unit, { count: pluralCount(measure.qty) })
          : "";
        return `${formatQuantity(measure, locale)} ${unit} ${name}`.replace(
          /\s+/g,
          " ",
        );
      }),
      recipeInstructions: data.steps.map((step) => ({
        "@type": "HowToStep",
        name: step.title ? localize(step.title, locale).text : undefined,
        text: localize(step.text, locale).text,
      })),
    }),
  };

  return (
    <script
      type="application/ld+json"
      // Escape "<" so user-authored text can't close the script tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
