import type { I18nText } from "@/lib/i18n-text";

export type CookedEntry = {
  dishId: string;
  dishSlug: string;
  dishName: I18nText;
  country: { iso: string | null; name: I18nText; slug: string } | null;
  continent: { name: I18nText; slug: string } | null;
  photoUrl: string | null;
  cookedAt: string;
};

export type Stamp = {
  countrySlug: string;
  iso: string | null;
  name: I18nText;
  count: number;
  firstCookedAt: string;
};

export type AchievementId =
  | "first_dish"
  | "five_dishes"
  | "ten_dishes"
  | "three_countries"
  | "three_continents"
  | "country_master";

export type Achievement = {
  id: AchievementId;
  unlocked: boolean;
  progress: number;
  goal: number;
  /** For country_master: the country closest to (or at) the goal. */
  country?: I18nText;
};

const COUNTRY_MASTER_GOAL = 5;

/** One stamp per country, oldest first (the order they were earned). */
export function computeStamps(entries: CookedEntry[]): Stamp[] {
  const byCountry = new Map<string, Stamp>();
  for (const entry of entries) {
    if (!entry.country) continue;
    const stamp = byCountry.get(entry.country.slug);
    if (stamp) {
      stamp.count += 1;
      if (entry.cookedAt < stamp.firstCookedAt)
        stamp.firstCookedAt = entry.cookedAt;
    } else {
      byCountry.set(entry.country.slug, {
        countrySlug: entry.country.slug,
        iso: entry.country.iso,
        name: entry.country.name,
        count: 1,
        firstCookedAt: entry.cookedAt,
      });
    }
  }
  return [...byCountry.values()].sort((a, b) =>
    a.firstCookedAt.localeCompare(b.firstCookedAt),
  );
}

export function computeAchievements(entries: CookedEntry[]): Achievement[] {
  const stamps = computeStamps(entries);
  const continents = new Set(
    entries.flatMap((e) => (e.continent ? [e.continent.slug] : [])),
  );
  const best = [...stamps].sort((a, b) => b.count - a.count)[0];
  const goal = (
    id: AchievementId,
    progress: number,
    target: number,
    extra?: Partial<Achievement>,
  ): Achievement => ({
    id,
    progress: Math.min(progress, target),
    goal: target,
    unlocked: progress >= target,
    ...extra,
  });

  return [
    goal("first_dish", entries.length, 1),
    goal("five_dishes", entries.length, 5),
    goal("ten_dishes", entries.length, 10),
    goal("three_countries", stamps.length, 3),
    goal("three_continents", continents.size, 3),
    goal(
      "country_master",
      best?.count ?? 0,
      COUNTRY_MASTER_GOAL,
      best ? { country: best.name } : {},
    ),
  ];
}

/** 🇮🇹 from "IT". */
export function flagEmoji(iso: string | null): string {
  if (!iso || !/^[A-Z]{2}$/.test(iso)) return "🌍";
  return String.fromCodePoint(
    ...[...iso].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

export const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])$/;
