import type { Metadata } from "next";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { DeleteAccount } from "@/components/account/delete-account";
import { FavoritesList } from "@/components/account/favorites-list";
import { PreferencesForm } from "@/components/account/preferences-form";
import { SubscriptionCard } from "@/components/account/subscription-card";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getAccount } from "@/lib/account";
import { countryOptions } from "@/lib/countries";
import type { I18nText } from "@/lib/i18n-text";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/account">): Promise<Metadata> {
  const t = await getTranslations({
    locale: (await params).locale as Locale,
    namespace: "Account",
  });
  return { title: t("title"), robots: { index: false } };
}

export default async function AccountPage({
  params,
  searchParams,
}: PageProps<"/[locale]/account">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const account = await getAccount();
  if (!account)
    return redirect({
      href: { pathname: "/login", query: { next: "/account" } },
      locale,
    });

  const { checkout } = await searchParams;
  const t = await getTranslations("Account");
  const format = await getFormatter();

  const supabase = await createClient();
  const { data: favorites } = await supabase
    .from("favorites")
    .select("created_at, dishes(id, slug, name, access)")
    .order("created_at", { ascending: false });

  return (
    <section className="mx-auto w-full max-w-3xl space-y-12 px-4 py-12">
      <header className="space-y-1">
        <h1 className="font-display text-4xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground">{account.email}</p>
      </header>

      {checkout === "success" && !account.subscription && (
        <p
          role="status"
          className="rounded-lg border border-free/40 px-4 py-3 text-sm"
        >
          {t("checkoutSuccess")}
        </p>
      )}

      <SubscriptionCard
        subscription={account.subscription}
        periodEndLabel={
          account.subscription
            ? format.dateTime(new Date(account.subscription.currentPeriodEnd), {
                dateStyle: "long",
              })
            : null
        }
        hasStripeCustomer={Boolean(account.stripeCustomerId)}
      />

      <FavoritesList
        favorites={(favorites ?? []).flatMap((f) =>
          f.dishes ? [{ ...f.dishes, name: f.dishes.name as I18nText }] : [],
        )}
      />

      <PreferencesForm
        initial={{
          displayName: account.displayName ?? "",
          locale: account.locale,
          country: account.country,
        }}
        countries={countryOptions(locale)}
      />

      <DeleteAccount />
    </section>
  );
}
