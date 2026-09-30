import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlacePanel } from "@/components/explore/place-panel";
import { routing, type Locale } from "@/i18n/routing";
import { resolveSlugPath } from "@/lib/explore";
import { getExploreData } from "@/lib/explore.server";
import { localize } from "@/lib/i18n-text";
import { pageMetadata } from "@/lib/seo";

export async function generateStaticParams() {
  const { locations } = await getExploreData();
  const byId = new Map(locations.map((l) => [l.id, l]));
  const pathOf = (id: string): string[] => {
    const location = byId.get(id)!;
    return location.parentId
      ? [...pathOf(location.parentId), location.slug]
      : [location.slug];
  };
  return routing.locales.flatMap((locale) =>
    locations.map((l) => ({ locale, path: pathOf(l.id) })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/explore/[...path]">): Promise<Metadata> {
  const { locale, path } = await params;
  const chain = resolveSlugPath(path, (await getExploreData()).locations);
  if (!chain) return {};
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Explore",
  });
  const place = chain.at(-1)!;
  return pageMetadata({
    locale: locale as Locale,
    path: `/explore/${path.join("/")}`,
    title: localize(place.name, locale as Locale).text,
    description: `${localize(place.name, locale as Locale).text}: ${t("dishCount", { count: place.dishCount })}`,
  });
}

export default async function ExplorePlacePage({
  params,
}: PageProps<"/[locale]/explore/[...path]">) {
  const { locale: rawLocale, path } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const data = await getExploreData();
  const chain = resolveSlugPath(path, data.locations);
  if (!chain) notFound();
  return <PlacePanel locale={locale} chain={chain} data={data} />;
}
