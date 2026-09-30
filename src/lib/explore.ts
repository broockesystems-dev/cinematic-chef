import type { I18nText } from "@/lib/i18n-text";
import type { LocationRow } from "@/lib/locations";

export type ExploreLocation = {
  id: string;
  parentId: string | null;
  type: LocationRow["type"];
  name: I18nText;
  slug: string;
  lat: number;
  lng: number;
  isoCode: string | null;
  /** Published dishes in this place and everything below it. */
  dishCount: number;
  freeCount: number;
};

export type ExploreDish = {
  id: string;
  slug: string;
  name: I18nText;
  locationId: string;
  access: "free" | "premium";
  coverUrl: string | null;
  prepMinutes: number | null;
  publishedAt: string;
};

export type ExploreData = {
  locations: ExploreLocation[];
  dishes: ExploreDish[];
};

export type GlobePin = {
  id: string;
  lat: number;
  lng: number;
  name: I18nText;
  dishCount: number;
  freeCount: number;
  path: string[];
};

export type SearchResult = {
  kind: "dish" | "location";
  id: string;
  name: string;
  /** Where it is, e.g. "Itália › Nápoles". */
  context: string;
  href: string;
  access: "free" | "premium" | null;
};

/** URL of a place in the explorer: /explore/europe/italy/naples. */
export function explorePath(path: Pick<LocationRow, "slug">[]): string {
  return `/explore/${path.map((location) => location.slug).join("/")}`;
}

/** Ancestors from the continent down to `id`. */
export function ancestry<T extends { id: string; parentId: string | null }>(
  id: string,
  byId: Map<string, T>,
): T[] {
  const path: T[] = [];
  let current = byId.get(id);
  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  return path;
}

/** Resolves /explore/<slugs> to the location chain, or null if it doesn't exist. */
export function resolveSlugPath(
  slugs: string[],
  locations: ExploreLocation[],
): ExploreLocation[] | null {
  const chain: ExploreLocation[] = [];
  let parentId: string | null = null;
  for (const slug of slugs) {
    const next = locations.find(
      (l) => l.parentId === parentId && l.slug === slug,
    );
    if (!next) return null;
    chain.push(next);
    parentId = next.id;
  }
  return chain;
}

/**
 * Keeps only places with published dishes and counts dishes up the tree, so
 * a continent's count includes every city below it.
 */
export function buildExploreData(
  rows: Array<Omit<ExploreLocation, "dishCount" | "freeCount">>,
  dishes: ExploreDish[],
): ExploreData {
  const byId = new Map(
    rows.map((row) => [row.id, { ...row, dishCount: 0, freeCount: 0 }]),
  );
  for (const dish of dishes) {
    for (const location of ancestry(dish.locationId, byId)) {
      location.dishCount += 1;
      if (dish.access === "free") location.freeCount += 1;
    }
  }
  return {
    locations: [...byId.values()].filter((l) => l.dishCount > 0),
    dishes,
  };
}

/**
 * One pin per city (neighborhood dishes roll up to their city; dishes placed
 * directly on a country get a country pin).
 */
export function buildPins(data: ExploreData): GlobePin[] {
  const byId = new Map(data.locations.map((l) => [l.id, l]));
  const pins = new Map<string, GlobePin>();
  for (const dish of data.dishes) {
    const chain = ancestry(dish.locationId, byId);
    const anchor = chain.find((l) => l.type === "city") ?? chain.at(-1);
    if (!anchor || pins.has(anchor.id)) continue;
    const anchorChain = chain.slice(0, chain.indexOf(anchor) + 1);
    pins.set(anchor.id, {
      id: anchor.id,
      lat: anchor.lat,
      lng: anchor.lng,
      name: anchor.name,
      dishCount: anchor.dishCount,
      freeCount: anchor.freeCount,
      path: anchorChain.map((l) => l.slug),
    });
  }
  return [...pins.values()];
}

/** Dishes located in `locationId` or anywhere below it. */
export function dishesUnder(
  locationId: string | null,
  data: ExploreData,
): ExploreDish[] {
  if (!locationId) return data.dishes;
  const byId = new Map(data.locations.map((l) => [l.id, l]));
  return data.dishes.filter((dish) =>
    ancestry(dish.locationId, byId).some((l) => l.id === locationId),
  );
}
