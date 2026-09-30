"use client";

import { CreditCard, Loader2, QrCode } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import type { ActiveSubscription } from "@/lib/payments/subscriptions";

type Props = {
  subscription: ActiveSubscription | null;
  periodEndLabel: string | null;
  hasStripeCustomer: boolean;
};

export function SubscriptionCard({
  subscription,
  periodEndLabel,
  hasStripeCustomer,
}: Props) {
  const t = useTranslations("Account");
  const locale = useLocale();
  const [opening, setOpening] = useState(false);

  async function openPortal() {
    setOpening(true);
    const response = await fetch("/api/billing-portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale }),
    });
    const body = await response.json().catch(() => ({}));
    if (body.url) window.location.assign(body.url);
    else setOpening(false);
  }

  return (
    <section
      aria-labelledby="plan-heading"
      className="space-y-4 rounded-xl border p-6"
    >
      <h2 id="plan-heading" className="font-display text-2xl font-semibold">
        {t("plan")}
      </h2>
      {subscription ? (
        <div className="space-y-1">
          <p className="text-lg">
            {t("activePlan", { plan: subscription.plan })}
          </p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            {subscription.provider === "stripe" ? (
              <CreditCard className="size-4" aria-hidden />
            ) : (
              <QrCode className="size-4" aria-hidden />
            )}
            {subscription.provider === "stripe" ? t("cardVia") : t("pixVia")} ·{" "}
            {subscription.provider === "stripe"
              ? t("renews", { date: periodEndLabel ?? "" })
              : t("validUntil", { date: periodEndLabel ?? "" })}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground">{t("noPlan")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        {hasStripeCustomer && (
          <Button variant="outline" onClick={openPortal} disabled={opening}>
            {opening && <Loader2 className="animate-spin" aria-hidden />}
            {t("manageBilling")}
          </Button>
        )}
        {!subscription && (
          <Button asChild>
            <Link href="/pricing">{t("seePlans")}</Link>
          </Button>
        )}
        {subscription?.provider === "mercadopago" && (
          <Button asChild variant="outline">
            <Link href="/pricing">{t("renewPix")}</Link>
          </Button>
        )}
      </div>
    </section>
  );
}
