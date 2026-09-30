import type { Metadata } from "next";
import { CheckCircle2, Clock, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccessBadge } from "@/components/dish/access-badge";
import { BuyTripButton } from "@/components/trips/buy-trip-button";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getAccount } from "@/lib/account";
import { getBundle } from "@/lib/bundles";
import { countryOptions, isCountryCode } from "@/lib/countries";
import { formatMinutes } from "@/lib/format";
import { localize } from "@/lib/i18n-text";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/trips/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getBundle(slug);
  if (!data) return {};
  return pageMetadata({
    locale: locale as Locale,
    path: `/trips/${slug}`,
    title: localize(data.bundle.name, locale as Locale).text,
    description: localize(data.bundle.description, locale as Locale).text.slice(
      0,
      160,
    ),
  });
}

export default async function TripPage({
  params,
  searchParams,
}: PageProps<"/[locale]/trips/[slug]">) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const [data, account, { purchase }] = await Promise.all([
    getBundle(slug),
    getAccount(),
    searchParams,
  ]);
  if (!data) notFound();
  const { bundle, dishes, owned } = data;
  const t = await getTranslations("Trips");
  const geo = (await headers()).get("x-vercel-ip-country");
  const guessedCountry =
    account?.country ??
    (isCountryCode(geo) ? geo : locale === "pt" ? "BR" : "US");

  return (
    <article className="mx-auto w-full max-w-5xl space-y-10 px-4 py-12">
      <header className="grid gap-8 md:grid-cols-[1.3fr_1fr] md:items-end">
        <div className="space-y-4">
          <Link
            href="/trips"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← {t("title")}
          </Link>
          <h1 className="font-display text-4xl font-semibold text-balance sm:text-5xl">
            {localize(bundle.name, locale).text}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {localize(bundle.description, locale).text}
          </p>
          <p className="text-sm text-primary">
            {t("dishes", { count: dishes.length })} · {t("lifetime")}
          </p>
        </div>
        <div className="space-y-4 rounded-xl border p-6">
          {purchase === "success" && !owned && (
            <p role="status" className="text-sm">
              {t("purchaseSuccess")}
            </p>
          )}
          {owned ? (
            <div className="space-y-1">
              <p className="flex items-center gap-2 font-display text-xl font-semibold text-free">
                <CheckCircle2 className="size-5" aria-hidden />
                {t("owned")}
              </p>
              <p className="text-sm text-muted-foreground">{t("ownedHint")}</p>
            </div>
          ) : account?.subscription ? (
            <p className="text-sm">{t("subscriberNote")}</p>
          ) : (
            <BuyTripButton
              slug={bundle.slug}
              priceBrl={bundle.priceBrl}
              priceUsd={bundle.priceUsd}
              signedIn={Boolean(account)}
              profileCountry={account?.country ?? null}
              initialCountry={guessedCountry}
              countries={countryOptions(locale)}
            />
          )}
        </div>
      </header>

      {bundle.coverUrl && (
        <Image
          src={bundle.coverUrl}
          alt=""
          width={1200}
          height={500}
          className="aspect-[12/5] w-full rounded-xl object-cover"
        />
      )}

      <section aria-labelledby="included-heading" className="space-y-4">
        <h2
          id="included-heading"
          className="font-display text-2xl font-semibold"
        >
          {t("included")}
        </h2>
        <ol className="space-y-3">
          {dishes.map((dish, index) => (
            <li key={dish.id}>
              <Link
                href={`/dish/${dish.slug}`}
                className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <span className="w-6 text-center font-display text-xl text-primary tabular-nums">
                  {index + 1}
                </span>
                {dish.coverUrl ? (
                  <Image
                    src={dish.coverUrl}
                    alt=""
                    width={64}
                    height={64}
                    className="size-16 rounded-md object-cover"
                  />
                ) : (
                  <span className="flex size-16 items-center justify-center rounded-md bg-muted">
                    <UtensilsCrossed
                      className="size-5 text-muted-foreground"
                      aria-hidden
                    />
                  </span>
                )}
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="block font-medium">
                    {localize(dish.name, locale).text}
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {dish.place && (
                      <span>{localize(dish.place, locale).text}</span>
                    )}
                    {dish.prepMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" aria-hidden />
                        {formatMinutes(dish.prepMinutes)}
                      </span>
                    )}
                    {!owned && <AccessBadge access={dish.access} />}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
