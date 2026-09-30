"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { updatePreferences } from "@/lib/actions/account";

type Props = {
  initial: { displayName: string; locale: "pt" | "en"; country: string | null };
  countries: Array<{ code: string; name: string }>;
};

export function PreferencesForm({ initial, countries }: Props) {
  const t = useTranslations("Account");
  const tLocale = useTranslations("LocaleSwitcher");
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [locale, setLocale] = useState(initial.locale);
  const [country, setCountry] = useState(initial.country ?? "");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updatePreferences({
        displayName,
        locale,
        country: country || null,
      });
      if (!result.ok) return void toast.error(t("error"));
      toast.success(t("saved"));
      // Switch the site to the chosen language right away.
      if (locale !== currentLocale) router.replace(pathname, { locale });
    });
  }

  return (
    <section aria-labelledby="preferences-heading" className="space-y-4">
      <h2
        id="preferences-heading"
        className="font-display text-2xl font-semibold"
      >
        {t("preferences")}
      </h2>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="display-name">{t("displayName")}</Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
            autoComplete="name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="locale">{t("language")}</Label>
          <NativeSelect
            id="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value as "pt" | "en")}
          >
            <option value="pt">{tLocale("pt")}</option>
            <option value="en">{tLocale("en")}</option>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">{t("country")}</Label>
          <NativeSelect
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            autoComplete="country"
          >
            <option value="">{t("noCountry")}</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={isPending}>
            {t("save")}
          </Button>
        </div>
      </form>
    </section>
  );
}
