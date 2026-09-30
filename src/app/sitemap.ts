import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { publicEnv } from "@/lib/env";
import { ancestry } from "@/lib/explore";
import { getExploreData } from "@/lib/explore.server";

// Revalidated with the catalog, so new dishes show up without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getExploreData();
  const byId = new Map(data.locations.map((l) => [l.id, l]));

  const paths: Array<{
    path: string;
    lastModified?: string;
    priority: number;
  }> = [
    { path: "", priority: 1 },
    { path: "/pricing", priority: 0.6 },
    { path: "/vote", priority: 0.5 },
    { path: "/trips", priority: 0.6 },
    { path: "/privacy", priority: 0.2 },
    { path: "/terms", priority: 0.2 },
    ...data.locations.map((l) => ({
      path: `/explore/${ancestry(l.id, byId)
        .map((a) => a.slug)
        .join("/")}`,
      priority: 0.7,
    })),
    ...data.dishes.map((d) => ({
      path: `/dish/${d.slug}`,
      lastModified: d.publishedAt,
      priority: 0.9,
    })),
  ];

  const url = (locale: string, path: string) =>
    `${publicEnv.siteUrl}/${locale}${path}`;
  return paths.flatMap(({ path, lastModified, priority }) =>
    routing.locales.map((locale) => ({
      url: url(locale, path),
      lastModified,
      priority,
      alternates: {
        languages: {
          "pt-BR": url("pt", path),
          en: url("en", path),
          "x-default": url(routing.defaultLocale, path),
        },
      },
    })),
  );
}
