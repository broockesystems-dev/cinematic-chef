import type { Metadata } from "next";
import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PricingPlans } from "@/components/billing/pricing-plans";
import type { Locale } from "@/i18n/routing";
import { getAccount } from "@/lib/account";
import { pageMetadata } from "@/lib/seo";
import { countryOptions, isCountryCode } from "@/lib/countries";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "Pricing" });
  return pageMetadata({
    locale,
    path: "/pricing",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function PricingPage({
  params,
  searchParams,
}: PageProps<"/[locale]/pricing">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const { checkout } = await searchParams;
  const t = await getTranslations("Pricing");
  const account = await getAccount();

  // Vercel sets this header; it only pre-selects the country for new users.
  const geo = (await headers()).get("x-vercel-ip-country");
  const guessedCountry =
    account?.country ??
    (isCountryCode(geo) ? geo : locale === "pt" ? "BR" : "US");

  return (
    <section className="mx-auto w-full max-w-5xl space-y-10 px-4 py-16">
      <header className="space-y-3 text-center">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
        {checkout === "canceled" && (
          <p role="status" className="text-sm text-muted-foreground">
            {t("canceled")}
          </p>
        )}
      </header>
      <PricingPlans
        signedIn={Boolean(account)}
        subscribed={account?.subscription?.provider === "stripe"}
        pixActiveUntil={
          account?.subscription?.provider === "mercadopago"
            ? account.subscription.currentPeriodEnd
            : null
        }
        profileCountry={account?.country ?? null}
        initialCountry={guessedCountry}
        countries={countryOptions(locale)}
      />
    </section>
  );
}
