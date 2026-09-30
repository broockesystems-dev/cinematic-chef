import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { localize, type I18nText } from "@/lib/i18n-text";

export function MyTrips({
  trips,
}: {
  trips: Array<{ id: string; slug: string; name: I18nText }>;
}) {
  const t = useTranslations("Trips");
  const locale = useLocale() as Locale;
  if (trips.length === 0) return null;
  return (
    <section aria-labelledby="trips-heading" className="space-y-4">
      <h2 id="trips-heading" className="font-display text-2xl font-semibold">
        {t("myTrips")}
      </h2>
      <ul className="divide-y rounded-lg border">
        {trips.map((trip) => (
          <li key={trip.id} className="px-4 py-3">
            <Link
              href={`/trips/${trip.slug}`}
              className="font-medium hover:underline"
            >
              {localize(trip.name, locale).text}
            </Link>
            <span className="ml-2 text-sm text-muted-foreground">
              · {t("lifetime")}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
