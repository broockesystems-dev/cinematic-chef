import { Award, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { getFormatter, getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localize } from "@/lib/i18n-text";
import {
  computeAchievements,
  computeStamps,
  flagEmoji,
  type CookedEntry,
} from "@/lib/passport";
import { cn } from "@/lib/utils";

type Props = {
  locale: Locale;
  title: string;
  entries: CookedEntry[];
  children?: React.ReactNode;
};

export async function PassportView({
  locale,
  title,
  entries,
  children,
}: Props) {
  const t = await getTranslations("Passport");
  const format = await getFormatter();
  const stamps = computeStamps(entries);
  const achievements = computeAchievements(entries);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-12 px-4 py-12">
      <header className="space-y-2">
        <p className="text-sm tracking-widest text-primary uppercase">
          The Cinematic Chef
        </p>
        <h1 className="font-display text-4xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">
          {t("stats", { dishes: entries.length, countries: stamps.length })}
        </p>
      </header>

      <section aria-labelledby="stamps-heading" className="space-y-4">
        <h2 id="stamps-heading" className="font-display text-2xl font-semibold">
          {t("stamps")}
        </h2>
        {stamps.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <p>{t("noStamps")}</p>
            <Button asChild variant="outline">
              <Link href="/">{t("explore")}</Link>
            </Button>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {stamps.map((stamp, i) => (
              <li
                key={stamp.countrySlug}
                // Slight alternating tilt, like real passport stamps.
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-primary/60 p-4 text-center",
                  i % 2 ? "rotate-3" : "-rotate-2",
                )}
              >
                <span className="text-4xl" aria-hidden>
                  {flagEmoji(stamp.iso)}
                </span>
                <span className="font-display text-lg leading-tight font-semibold">
                  {localize(stamp.name, locale).text}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("stampCount", { count: stamp.count })}
                </span>
                <time
                  dateTime={stamp.firstCookedAt}
                  className="text-[0.65rem] tracking-wider text-primary uppercase"
                >
                  {format.dateTime(new Date(stamp.firstCookedAt), {
                    dateStyle: "medium",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="achievements-heading" className="space-y-4">
        <h2
          id="achievements-heading"
          className="font-display text-2xl font-semibold"
        >
          {t("achievements")}
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a) => (
            <li
              key={a.id}
              className={cn(
                "space-y-2 rounded-lg border p-4",
                a.unlocked ? "border-primary/50" : "border-dashed",
              )}
            >
              <p className="flex items-center gap-2 font-medium">
                <Award
                  className={cn(
                    "size-4",
                    a.unlocked ? "text-primary" : "text-muted-foreground",
                  )}
                  aria-hidden
                />
                {t(`achievement.${a.id}`)}
                {a.id === "country_master" && a.country && (
                  <span className="text-muted-foreground">
                    · {localize(a.country, locale).text}
                  </span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {t(`achievementHint.${a.id}`)}
              </p>
              <div
                role="progressbar"
                aria-label={t(`achievement.${a.id}`)}
                aria-valuenow={a.progress}
                aria-valuemin={0}
                aria-valuemax={a.goal}
                aria-valuetext={t("progress", {
                  progress: a.progress,
                  goal: a.goal,
                })}
                className="h-1.5 overflow-hidden rounded-full bg-muted"
              >
                <div
                  className="h-full bg-primary"
                  style={{ width: `${(a.progress / a.goal) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {entries.length > 0 && (
        <section aria-labelledby="gallery-heading" className="space-y-4">
          <h2
            id="gallery-heading"
            className="font-display text-2xl font-semibold"
          >
            {t("gallery")}
          </h2>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {entries.map((entry) => (
              <li key={entry.dishId}>
                <Link
                  href={`/dish/${entry.dishSlug}`}
                  className="group block space-y-2"
                >
                  {entry.photoUrl ? (
                    <Image
                      src={entry.photoUrl}
                      alt=""
                      width={400}
                      height={400}
                      // Signed URLs expire; skip the optimizer cache for them.
                      unoptimized
                      className="aspect-square w-full rounded-lg object-cover transition-opacity group-hover:opacity-90"
                    />
                  ) : (
                    <span className="flex aspect-square items-center justify-center rounded-lg bg-muted">
                      <UtensilsCrossed
                        className="size-8 text-muted-foreground"
                        aria-hidden
                      />
                    </span>
                  )}
                  <span className="block font-medium group-hover:underline">
                    {localize(entry.dishName, locale).text}
                  </span>
                  {entry.country && (
                    <span className="block text-sm text-muted-foreground">
                      {flagEmoji(entry.country.iso)}{" "}
                      {localize(entry.country.name, locale).text}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {children}
    </section>
  );
}
