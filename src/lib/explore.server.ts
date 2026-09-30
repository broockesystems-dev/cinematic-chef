import "server-only";
import { cache } from "react";
import type { I18nText } from "@/lib/i18n-text";
import { createPublicClient } from "@/lib/supabase/public";
import {
  buildExploreData,
  type ExploreData,
  type ExploreDish,
} from "./explore";

/** Public catalog for the globe, panel and search (published dishes only). */
export const getExploreData = cache(async (): Promise<ExploreData> => {
  const supabase = createPublicClient();
  const [locations, dishes] = await Promise.all([
    supabase
      .from("locations")
      .select("id, parent_id, type, name, slug, lat, lng, iso_code"),
    supabase
      .from("dishes")
      .select(
        "id, slug, name, location_id, access, cover_url, prep_minutes, published_at",
      )
      .order("published_at", { ascending: false }),
  ]);
  if (locations.error) throw locations.error;
  if (dishes.error) throw dishes.error;

  return buildExploreData(
    locations.data.map((l) => ({
      id: l.id,
      parentId: l.parent_id,
      type: l.type,
      name: l.name as I18nText,
      slug: l.slug,
      lat: l.lat,
      lng: l.lng,
      isoCode: l.iso_code,
    })),
    dishes.data.map((d): ExploreDish => ({
      id: d.id,
      slug: d.slug,
      name: d.name as I18nText,
      locationId: d.location_id,
      access: d.access,
      coverUrl: d.cover_url,
      prepMinutes: d.prep_minutes,
      publishedAt: d.published_at!,
    })),
  );
});
