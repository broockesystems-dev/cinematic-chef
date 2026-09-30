import { describe, expect, it } from "vitest";
import {
  computeAchievements,
  computeStamps,
  flagEmoji,
  type CookedEntry,
} from "./passport";

const italy = { iso: "IT", name: { pt: "Itália" }, slug: "italy" };
const brazil = { iso: "BR", name: { pt: "Brasil" }, slug: "brazil" };
const europe = { name: { pt: "Europa" }, slug: "europe" };
const southAmerica = { name: { pt: "América do Sul" }, slug: "south-america" };

const entry = (
  id: string,
  country: typeof italy,
  continent: typeof europe,
  day: number,
): CookedEntry => ({
  dishId: id,
  dishSlug: id,
  dishName: { pt: id },
  country,
  continent,
  photoUrl: null,
  cookedAt: `2026-01-${String(day).padStart(2, "0")}T00:00:00Z`,
});

describe("passport", () => {
  const entries = [
    entry("pizza", italy, europe, 3),
    entry("pao", brazil, southAmerica, 1),
    entry("ragu", italy, europe, 5),
  ];

  it("groups stamps by country in the order they were earned", () => {
    expect(computeStamps(entries).map((s) => [s.countrySlug, s.count])).toEqual(
      [
        ["brazil", 1],
        ["italy", 2],
      ],
    );
  });

  it("tracks achievement progress", () => {
    const byId = Object.fromEntries(
      computeAchievements(entries).map((a) => [a.id, a]),
    );
    expect(byId.first_dish.unlocked).toBe(true);
    expect(byId.five_dishes).toMatchObject({
      unlocked: false,
      progress: 3,
      goal: 5,
    });
    expect(byId.three_continents).toMatchObject({
      unlocked: false,
      progress: 2,
    });
    expect(byId.country_master).toMatchObject({
      progress: 2,
      country: { pt: "Itália" },
    });
  });

  it("unlocks country master at five dishes from one country", () => {
    const five = [1, 2, 3, 4, 5].map((d) => entry(`d${d}`, italy, europe, d));
    expect(
      computeAchievements(five).find((a) => a.id === "country_master")
        ?.unlocked,
    ).toBe(true);
  });

  it("renders flags from ISO codes", () => {
    expect(flagEmoji("IT")).toBe("🇮🇹");
    expect(flagEmoji(null)).toBe("🌍");
  });
});
