import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PassportView } from "@/components/passport/passport-view";
import type { Locale } from "@/i18n/routing";
import { getPublicPassport } from "@/lib/passport.server";

// Personal pages: shareable by link, but kept out of search engines.
export async function generateMetadata({
  params,
}: PageProps<"/[locale]/passport/[username]">): Promise<Metadata> {
  const { locale, username } = await params;
  const passport = await getPublicPassport(username);
  if (!passport) return { robots: { index: false } };
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Passport",
  });
  const name = passport.owner.displayName || passport.owner.username || "";
  return { title: t("publicTitle", { name }), robots: { index: false } };
}

export default async function PublicPassportPage({
  params,
}: PageProps<"/[locale]/passport/[username]">) {
  const { locale: rawLocale, username } = await params;
  const locale = rawLocale as Locale;
  setRequestLocale(locale);
  const passport = await getPublicPassport(username);
  if (!passport) notFound();
  const t = await getTranslations("Passport");
  const name = passport.owner.displayName || passport.owner.username || "";
  return (
    <PassportView
      locale={locale}
      title={t("publicTitle", { name })}
      entries={passport.entries}
    />
  );
}
