import type { Metadata } from "next";
import { Map as MapIcon } from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { listBundles } from "@/lib/bundles";
import { localize } from "@/lib/i18n-text";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/trips">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "Trips" });
  return pageMetadata({
    locale,
    path: "/trips",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function TripsPage({
  params,
}: PageProps<"/[locale]/trips">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("Trips");
  const bundles = await listBundles();

  return (
    <section className="mx-auto w-full max-w-6xl space-y-10 px-4 py-16">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
      </header>
      {bundles.length === 0 ? (
        <p className="text-center text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bundles.map((bundle) => (
            <li key={bundle.id}>
              <Link
                href={`/trips/${bundle.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-primary/60"
              >
                {bundle.coverUrl ? (
                  <Image
                    src={bundle.coverUrl}
                    alt=""
                    width={640}
                    height={360}
                    className="aspect-video w-full object-cover"
                  />
                ) : (
                  <span className="flex aspect-video items-center justify-center bg-gradient-to-br from-primary/25 to-background">
                    <MapIcon className="size-10 text-primary" aria-hidden />
                  </span>
                )}
                <span className="flex flex-1 flex-col gap-2 p-5">
                  <span className="font-display text-xl font-semibold group-hover:underline">
                    {localize(bundle.name, locale).text}
                  </span>
                  <span className="line-clamp-3 text-sm text-muted-foreground">
                    {localize(bundle.description, locale).text}
                  </span>
                  <span className="mt-auto text-sm text-primary">
                    {t("dishes", { count: bundle.dishIds.length })} ·{" "}
                    {t("lifetime")}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
