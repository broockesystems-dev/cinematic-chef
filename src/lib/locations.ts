import type { Tables } from "@/lib/supabase/database.types";
import type { I18nText } from "@/lib/i18n-text";

export type LocationRow = Omit<
  Tables<"locations">,
  "name" | "search_vector"
> & {
  name: I18nText;
};

export type LocationType = LocationRow["type"];

export const LOCATION_TYPES: LocationType[] = [
  "continent",
  "country",
  "city",
  "neighborhood",
];

/** The type a location of `type` must hang from (null for continents). */
export function parentTypeOf(type: LocationType): LocationType | null {
  const index = LOCATION_TYPES.indexOf(type);
  return index > 0 ? LOCATION_TYPES[index - 1] : null;
}

export function indexById<T extends { id: string }>(rows: T[]): Map<string, T> {
  return new Map(rows.map((row) => [row.id, row]));
}

/** Ancestors from the continent down to `id` itself. */
export function pathOf(
  id: string,
  byId: Map<string, LocationRow>,
): LocationRow[] {
  const path: LocationRow[] = [];
  let current = byId.get(id);
  while (current) {
    path.unshift(current);
    current = current.parent_id ? byId.get(current.parent_id) : undefined;
  }
  return path;
}

/** Depth-first order with depth, children sorted by PT name. */
export function flattenTree(
  rows: LocationRow[],
): Array<{ location: LocationRow; depth: number }> {
  const children = new Map<string | null, LocationRow[]>();
  for (const row of rows) {
    const siblings = children.get(row.parent_id) ?? [];
    siblings.push(row);
    children.set(row.parent_id, siblings);
  }
  for (const siblings of children.values()) {
    siblings.sort((a, b) => a.name.pt.localeCompare(b.name.pt, "pt"));
  }

  const result: Array<{ location: LocationRow; depth: number }> = [];
  const visit = (parentId: string | null, depth: number) => {
    for (const location of children.get(parentId) ?? []) {
      result.push({ location, depth });
      visit(location.id, depth + 1);
    }
  };
  visit(null, 0);
  return result;
}
