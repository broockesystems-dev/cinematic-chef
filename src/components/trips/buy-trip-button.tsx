"use client";

import { Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { usePathname, useRouter } from "@/i18n/navigation";
import { currencyFor, formatPrice } from "@/lib/plans";

type Props = {
  slug: string;
  priceBrl: number;
  priceUsd: number;
  signedIn: boolean;
  profileCountry: string | null;
  initialCountry: string;
  countries: Array<{ code: string; name: string }>;
};

const KNOWN = [
  "already_owned",
  "provider_error",
  "rate_limited",
  "country_required",
] as const;

export function BuyTripButton({
  slug,
  priceBrl,
  priceUsd,
  signedIn,
  profileCountry,
  initialCountry,
  countries,
}: Props) {
  const t = useTranslations("Trips");
  const tPricing = useTranslations("Pricing");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [country, setCountry] = useState(initialCountry);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currency = currencyFor(country);
  const price = formatPrice(
    currency === "BRL" ? priceBrl : priceUsd,
    currency,
    locale,
  );

  async function buy() {
    if (!signedIn)
      return router.push({ pathname: "/login", query: { next: pathname } });
    setPending(true);
    setError(null);
    const response = await fetch("/api/checkout/bundle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        locale,
        country: profileCountry ? undefined : country,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.url) return window.location.assign(body.url);
    setPending(false);
    setError(
      t(
        `errors.${KNOWN.includes(body.error) ? (body.error as (typeof KNOWN)[number]) : "generic"}`,
      ),
    );
  }

  return (
    <div className="space-y-3">
      {!profileCountry && (
        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="trip-country">{tPricing("countryLabel")}</Label>
          <NativeSelect
            id="trip-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}
      <p className="font-display text-4xl font-semibold">{price}</p>
      <Button size="lg" onClick={buy} disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {pending ? t("redirecting") : t("buy")}
      </Button>
      <p className="text-sm text-muted-foreground">
        {currency === "BRL" ? t("payWithPix") : t("payWithCard")}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
