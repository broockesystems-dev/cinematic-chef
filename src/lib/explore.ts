import type { LocationRow } from "@/lib/locations";

/** URL of a place in the explorer: /explore/europe/italy/naples. */
export function explorePath(path: Pick<LocationRow, "slug">[]): string {
  return `/explore/${path.map((location) => location.slug).join("/")}`;
}
