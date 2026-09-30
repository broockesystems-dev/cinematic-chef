"use client";

import { Check, Loader2 } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import { currencyFor, formatPrice, PRICES, type Plan } from "@/lib/plans";
import { cn } from "@/lib/utils";

type Props = {
  signedIn: boolean;
  /** Has a recurring card subscription (nothing more to buy). */
  subscribed: boolean;
  /** Prepaid Pix access end, if any: buying again adds time. */
  pixActiveUntil: string | null;
  /** Set once on the profile; after that the currency is fixed. */
  profileCountry: string | null;
  initialCountry: string;
  countries: Array<{ code: string; name: string }>;
};

export function PricingPlans({
  signedIn,
  subscribed,
  pixActiveUntil,
  profileCountry,
  initialCountry,
  countries,
}: Props) {
  const t = useTranslations("Pricing");
  const format = useFormatter();
  const locale = useLocale();
  const router = useRouter();
  const [country, setCountry] = useState(initialCountry);
  const [pending, setPending] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currency = currencyFor(country);

  async function subscribe(plan: Plan) {
    if (!signedIn) {
      router.push({ pathname: "/login", query: { next: "/pricing" } });
      return;
    }
    setPending(plan);
    setError(null);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        locale,
        country: profileCountry ? undefined : country,
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok && body.url) {
      window.location.assign(body.url);
      return;
    }
    setPending(null);
    const known = [
      "provider_error",
      "rate_limited",
      "country_required",
      "already_subscribed",
    ] as const;
    setError(
      t(
        `errors.${known.includes(body.error) ? (body.error as (typeof known)[number]) : "generic"}`,
      ),
    );
  }

  return (
    <div className="space-y-6">
      {!profileCountry && (
        <div className="mx-auto flex max-w-xs flex-col gap-1.5">
          <Label htmlFor="country">{t("countryLabel")}</Label>
          <NativeSelect
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            aria-describedby="country-hint"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
          <p id="country-hint" className="text-xs text-muted-foreground">
            {t("countryHint")}
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <PlanCard
          name={t("free.name")}
          price={t("free.price")}
          features={t.raw("free.features") as string[]}
        >
          <Button asChild variant="outline" className="w-full">
            <Link href="/">{t("free.cta")}</Link>
          </Button>
        </PlanCard>
        {(["monthly", "annual"] as const).map((plan) => (
          <PlanCard
            key={plan}
            name={t(`${plan}.name`)}
            price={formatPrice(PRICES[currency][plan], currency, locale)}
            period={t(`${plan}.period`)}
            badge={plan === "annual" ? t("annual.badge") : undefined}
            features={t.raw("features") as string[]}
            highlighted={plan === "annual"}
          >
            {subscribed ? (
              <Button asChild variant="outline" className="w-full">
                <Link href="/account">{t("manage")}</Link>
              </Button>
            ) : (
              <Button
                className="w-full"
                variant={plan === "annual" ? "default" : "outline"}
                disabled={pending !== null}
                onClick={() => subscribe(plan)}
              >
                {pending === plan && (
                  <Loader2 className="animate-spin" aria-hidden />
                )}
                {pending === plan ? t("redirecting") : t("subscribe")}
              </Button>
            )}
          </PlanCard>
        ))}
      </div>

      <div className="space-y-2 text-center text-sm text-muted-foreground">
        {subscribed && (
          <p className="text-foreground">{t("alreadySubscribed")}</p>
        )}
        {pixActiveUntil && (
          <p className="text-foreground">
            {t("addTime", {
              date: format.dateTime(new Date(pixActiveUntil), {
                dateStyle: "long",
              }),
            })}
          </p>
        )}
        <p>{currency === "BRL" ? t("currencyBRL") : t("currencyUSD")}</p>
        {error && (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function PlanCard({
  name,
  price,
  period,
  badge,
  features,
  highlighted,
  children,
}: {
  name: string;
  price: string;
  period?: string;
  badge?: string;
  features: string[];
  highlighted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn(
        "flex flex-col",
        highlighted &&
          "border-primary/60 shadow-[0_0_40px_-12px] shadow-primary/40",
      )}
    >
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center justify-between gap-2">
          {name}
          {badge && <Badge>{badge}</Badge>}
        </CardTitle>
        <p>
          <span className="font-display text-4xl font-semibold">{price}</span>
          {period && <span className="text-muted-foreground">{period}</span>}
        </p>
      </CardHeader>
      <CardContent className="flex-1">
        <ul className="space-y-2 text-sm">
          {features.map((feature) => (
            <li key={feature} className="flex gap-2">
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden
              />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>{children}</CardFooter>
    </Card>
  );
}
