import "server-only";
import { ancestry, type ExploreDish } from "@/lib/explore";
import { getExploreData } from "@/lib/explore.server";
import type { I18nText } from "@/lib/i18n-text";
import { createClient } from "@/lib/supabase/server";

export type Bundle = {
  id: string;
  slug: string;
  name: I18nText;
  description: I18nText;
  coverUrl: string | null;
  priceBrl: number;
  priceUsd: number;
  status: "draft" | "published";
  dishIds: string[];
};

type BundleRow = {
  id: string;
  slug: string;
  name: unknown;
  description: unknown;
  cover_url: string | null;
  price_brl: number;
  price_usd: number;
  status: "draft" | "published";
  bundle_dishes: { dish_id: string; position: number }[];
};

const COLUMNS =
  "id, slug, name, description, cover_url, price_brl, price_usd, status, bundle_dishes(dish_id, position)";

function toBundle(row: BundleRow): Bundle {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name as I18nText,
    description: row.description as I18nText,
    coverUrl: row.cover_url,
    priceBrl: row.price_brl,
    priceUsd: row.price_usd,
    status: row.status,
    dishIds: [...row.bundle_dishes]
      .sort((a, b) => a.position - b.position)
      .map((d) => d.dish_id),
  };
}

/** Published trips (RLS hides drafts from everyone but admins). */
export async function listBundles(): Promise<Bundle[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bundles")
    .select(COLUMNS)
    .order("created_at", { ascending: false });
  return ((data ?? []) as BundleRow[]).map(toBundle);
}

export type BundleDish = ExploreDish & { place: I18nText | null };

/** A trip with its published dishes and whether the visitor owns it. */
export async function getBundle(slug: string) {
  const supabase = await createClient();
  const [{ data }, explore] = await Promise.all([
    supabase.from("bundles").select(COLUMNS).eq("slug", slug).maybeSingle(),
    getExploreData(),
  ]);
  if (!data) return null;
  const bundle = toBundle(data as BundleRow);
  const { data: purchase } = await supabase
    .from("purchases")
    .select("id")
    .eq("bundle_id", bundle.id)
    .maybeSingle();

  const byId = new Map(explore.dishes.map((d) => [d.id, d]));
  const locations = new Map(explore.locations.map((l) => [l.id, l]));
  const dishes: BundleDish[] = bundle.dishIds.flatMap((id) => {
    const dish = byId.get(id);
    if (!dish) return [];
    const chain = ancestry(dish.locationId, locations);
    const city = chain.find((l) => l.type === "city") ?? chain.at(-1);
    return [{ ...dish, place: city?.name ?? null }];
  });
  return { bundle, dishes, owned: Boolean(purchase) };
}

/** Trips the signed-in user bought (for the account page). */
export async function listMyBundles(): Promise<
  Array<Pick<Bundle, "id" | "slug" | "name">>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("purchases")
    .select("bundles(id, slug, name)")
    .order("created_at");
  return (data ?? []).flatMap((row) =>
    row.bundles
      ? [
          {
            id: row.bundles.id,
            slug: row.bundles.slug,
            name: row.bundles.name as I18nText,
          },
        ]
      : [],
  );
}
