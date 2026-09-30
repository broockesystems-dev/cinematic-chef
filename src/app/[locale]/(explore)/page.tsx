import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PlacePanel } from "@/components/explore/place-panel";
import type { Locale } from "@/i18n/routing";
import { getExploreData } from "@/lib/explore.server";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  return pageMetadata({ locale: (await params).locale as Locale, path: "/" });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  return (
    <PlacePanel locale={locale} chain={[]} data={await getExploreData()} />
  );
}
