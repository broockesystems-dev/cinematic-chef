import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PassportSettings } from "@/components/passport/passport-settings";
import { PassportView } from "@/components/passport/passport-view";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { publicEnv } from "@/lib/env";
import { getMyPassport } from "@/lib/passport.server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/passport">): Promise<Metadata> {
  const t = await getTranslations({
    locale: (await params).locale as Locale,
    namespace: "Passport",
  });
  return { title: t("title"), robots: { index: false } };
}

export default async function MyPassportPage({
  params,
}: PageProps<"/[locale]/passport">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const passport = await getMyPassport();
  if (!passport)
    return redirect({
      href: { pathname: "/login", query: { next: "/passport" } },
      locale,
    });
  const t = await getTranslations("Passport");

  return (
    <PassportView locale={locale} title={t("title")} entries={passport.entries}>
      <PassportSettings
        username={passport.owner.username}
        isPublic={passport.owner.isPublic}
        siteUrl={publicEnv.siteUrl}
      />
    </PassportView>
  );
}
