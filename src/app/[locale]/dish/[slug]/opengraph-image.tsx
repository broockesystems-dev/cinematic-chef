import { ImageResponse } from "next/og";
import { OG_SIZE, OgCard } from "@/components/og/og-card";
import type { Locale } from "@/i18n/routing";
import { ancestry } from "@/lib/explore";
import { getExploreData } from "@/lib/explore.server";
import { localize } from "@/lib/i18n-text";

export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "The Cinematic Chef";

// Public dish card only (name, place, cover): never recipe content.
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const data = await getExploreData();
  const dish = data.dishes.find((d) => d.slug === slug);
  if (!dish) {
    return new ImageResponse(
      <OgCard eyebrow="@thecinematic.chef" title="The Cinematic Chef" />,
      size,
    );
  }
  const byId = new Map(data.locations.map((l) => [l.id, l]));
  const place = ancestry(dish.locationId, byId)
    .filter((l) => l.type === "country" || l.type === "city")
    .map((l) => localize(l.name, locale as Locale).text)
    .reverse()
    .join(", ");
  return new ImageResponse(
    <OgCard
      eyebrow="The Cinematic Chef"
      title={localize(dish.name, locale as Locale).text}
      subtitle={place}
      background={dish.coverUrl}
    />,
    size,
  );
}
