import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import type { Locale } from "@/i18n/routing";

export default function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);
  // The layout already rejected unknown locales.
  setRequestLocale(locale as Locale);
  const t = useTranslations("Home");

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <p className="text-sm tracking-widest text-primary uppercase">
        {t("eyebrow")}
      </p>
      <h1 className="font-display text-4xl font-semibold text-balance sm:text-6xl">
        {t("title")}
      </h1>
      <p className="max-w-xl text-lg text-pretty text-muted-foreground">
        {t("subtitle")}
      </p>
      <p className="rounded-full border px-4 py-1.5 text-sm text-muted-foreground">
        {t("comingSoon")}
      </p>
    </section>
  );
}
