import { ChevronRight, Clock, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { AccessBadge } from "@/components/dish/access-badge";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  dishesUnder,
  explorePath,
  type ExploreData,
  type ExploreDish,
  type ExploreLocation,
} from "@/lib/explore";
import { formatMinutes } from "@/lib/format";
import { localize } from "@/lib/i18n-text";

const RECENT_LIMIT = 6;

type Props = { locale: Locale; chain: ExploreLocation[]; data: ExploreData };

/** Server-rendered list for the current place: crawlable and keyboard-friendly. */
export async function PlacePanel({ locale, chain, data }: Props) {
  const t = await getTranslations("Explore");
  const current = chain.at(-1);
  const children = data.locations
    .filter((l) => l.parentId === (current?.id ?? null))
    .sort((a, b) => b.dishCount - a.dishCount);
  const dishes = !current
    ? data.dishes.slice(0, RECENT_LIMIT)
    : current.type === "continent"
      ? []
      : dishesUnder(current.id, data);
  const name = (l: ExploreLocation) => localize(l.name, locale).text;

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <li>
            <Link href="/" className="hover:text-foreground">
              {t("world")}
            </Link>
          </li>
          {chain.map((location, i) => (
            <li key={location.id} className="flex items-center gap-1">
              <ChevronRight className="size-3.5" aria-hidden />
              {i === chain.length - 1 ? (
                <span aria-current="page" className="text-foreground">
                  {name(location)}
                </span>
              ) : (
                <Link
                  href={explorePath(chain.slice(0, i + 1))}
                  className="hover:text-foreground"
                >
                  {name(location)}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <header className="space-y-1">
        <h1 className="font-display text-2xl font-semibold text-balance">
          {current ? name(current) : t("title")}
        </h1>
        {current && (
          <Counts
            dishCount={current.dishCount}
            freeCount={current.freeCount}
            t={t}
          />
        )}
      </header>

      {data.dishes.length === 0 && (
        <p className="text-muted-foreground">{t("empty")}</p>
      )}

      {children.length > 0 && (
        <section aria-labelledby="places-heading" className="space-y-2">
          <h2
            id="places-heading"
            className="text-sm font-medium tracking-wide text-muted-foreground uppercase"
          >
            {t(`places.${children[0].type}`)}
          </h2>
          <ul className="divide-y rounded-lg border">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={explorePath([...chain, child])}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                >
                  <span className="flex-1 font-medium">{name(child)}</span>
                  <Counts
                    dishCount={child.dishCount}
                    freeCount={child.freeCount}
                    t={t}
                  />
                  <ChevronRight
                    className="size-4 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {dishes.length > 0 && (
        <section aria-labelledby="dishes-heading" className="space-y-2">
          <h2
            id="dishes-heading"
            className="text-sm font-medium tracking-wide text-muted-foreground uppercase"
          >
            {current ? t("dishesHere") : t("recent")}
          </h2>
          <ul className="space-y-2">
            {dishes.map((dish) => (
              <li key={dish.id}>
                <DishCard
                  dish={dish}
                  locale={locale}
                  context={current ? null : placeOf(dish, data, locale)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Counts({
  dishCount,
  freeCount,
  t,
}: {
  dishCount: number;
  freeCount: number;
  t: Awaited<ReturnType<typeof getTranslations<"Explore">>>;
}) {
  return (
    <span className="text-sm text-muted-foreground tabular-nums">
      {t("dishCount", { count: dishCount })}
      {freeCount > 0 && (
        <span className="text-free">
          {" "}
          · {t("freeCount", { count: freeCount })}
        </span>
      )}
    </span>
  );
}

function placeOf(dish: ExploreDish, data: ExploreData, locale: Locale): string {
  const location = data.locations.find((l) => l.id === dish.locationId);
  return location ? localize(location.name, locale).text : "";
}

function DishCard({
  dish,
  locale,
  context,
}: {
  dish: ExploreDish;
  locale: Locale;
  context: string | null;
}) {
  return (
    <Link
      href={`/dish/${dish.slug}`}
      className="flex items-center gap-3 rounded-lg border p-2 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
    >
      {dish.coverUrl ? (
        <Image
          src={dish.coverUrl}
          alt=""
          width={56}
          height={56}
          className="size-14 rounded-md object-cover"
        />
      ) : (
        <span className="flex size-14 items-center justify-center rounded-md bg-muted">
          <UtensilsCrossed
            className="size-5 text-muted-foreground"
            aria-hidden
          />
        </span>
      )}
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block truncate font-medium">
          {localize(dish.name, locale).text}
        </span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <AccessBadge access={dish.access} />
          {dish.prepMinutes && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" aria-hidden />
              {formatMinutes(dish.prepMinutes)}
            </span>
          )}
          {context && <span className="truncate">{context}</span>}
        </span>
      </span>
    </Link>
  );
}
