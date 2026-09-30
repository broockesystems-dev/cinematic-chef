import { describe, expect, it } from "vitest";
import {
  buildExploreData,
  buildPins,
  dishesUnder,
  resolveSlugPath,
  type ExploreDish,
} from "./explore";

const loc = (
  id: string,
  parentId: string | null,
  type: "continent" | "country" | "city" | "neighborhood",
  slug: string,
) => ({
  id,
  parentId,
  type,
  slug,
  name: { pt: slug },
  lat: 0,
  lng: 0,
});
const rows = [
  loc("eu", null, "continent", "europe"),
  loc("it", "eu", "country", "italy"),
  loc("na", "it", "city", "naples"),
  loc("cs", "na", "neighborhood", "centro-storico"),
  loc("ro", "it", "city", "rome"),
  loc("as", null, "continent", "asia"),
];
const dish = (
  id: string,
  locationId: string,
  access: "free" | "premium",
): ExploreDish => ({
  id,
  slug: id,
  name: { pt: id },
  locationId,
  access,
  coverUrl: null,
  prepMinutes: null,
  publishedAt: "2026-01-01",
});

describe("explore data", () => {
  const data = buildExploreData(rows, [
    dish("pizza", "cs", "free"),
    dish("ragu", "na", "premium"),
  ]);

  it("rolls counts up the tree and drops empty places", () => {
    const counts = Object.fromEntries(
      data.locations.map((l) => [l.id, [l.dishCount, l.freeCount]]),
    );
    expect(counts).toEqual({ eu: [2, 1], it: [2, 1], na: [2, 1], cs: [1, 1] });
  });

  it("pins neighborhoods on their city", () => {
    expect(buildPins(data).map((p) => [p.id, p.path.join("/")])).toEqual([
      ["na", "europe/italy/naples"],
    ]);
  });

  it("resolves slug paths level by level", () => {
    expect(
      resolveSlugPath(["europe", "italy", "naples"], data.locations)?.map(
        (l) => l.id,
      ),
    ).toEqual(["eu", "it", "na"]);
    expect(resolveSlugPath(["europe", "naples"], data.locations)).toBeNull();
    expect(resolveSlugPath(["asia"], data.locations)).toBeNull();
  });

  it("lists dishes in a subtree", () => {
    expect(dishesUnder("na", data).map((d) => d.id)).toEqual(["pizza", "ragu"]);
    expect(dishesUnder("cs", data).map((d) => d.id)).toEqual(["pizza"]);
  });
});
