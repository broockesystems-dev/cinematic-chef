"use client";

import { Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { castVote } from "@/lib/actions/vote";
import { localize } from "@/lib/i18n-text";
import type { Poll } from "@/lib/polls";
import { cn } from "@/lib/utils";

type Props = {
  poll: Poll;
  myVote: string | null;
  canVote: boolean;
  signedIn: boolean;
};

export function VoteOptions({ poll, myVote, canVote, signedIn }: Props) {
  const t = useTranslations("Vote");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const total = poll.options.reduce((sum, o) => sum + (o.votes ?? 0), 0);
  const showResults = poll.options.some((o) => o.votes !== null);

  function vote(optionId: string) {
    setPending(optionId);
    startTransition(async () => {
      const result = await castVote(poll.id, optionId);
      setPending(null);
      if (!result.ok) {
        const key =
          result.error === "forbidden" || result.error === "closed"
            ? result.error
            : "generic";
        return void toast.error(t(`errors.${key}`));
      }
      toast.success(t("thanks"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {poll.options.map((option) => {
          const mine = option.id === myVote;
          const share = total
            ? Math.round(((option.votes ?? 0) / total) * 100)
            : 0;
          return (
            <li
              key={option.id}
              className={cn(
                "flex flex-col overflow-hidden rounded-xl border bg-card",
                mine && "border-primary",
              )}
            >
              {option.imageUrl && (
                <Image
                  src={option.imageUrl}
                  alt=""
                  width={480}
                  height={270}
                  className="aspect-video w-full object-cover"
                />
              )}
              <div className="flex flex-1 flex-col gap-3 p-5">
                <h2 className="font-display text-xl font-semibold">
                  {localize(option.dishName, locale).text}
                </h2>
                {option.description && (
                  <p className="flex-1 text-sm text-muted-foreground">
                    {localize(option.description, locale).text}
                  </p>
                )}
                {showResults && (
                  <div className="space-y-1">
                    <div
                      role="progressbar"
                      aria-label={localize(option.dishName, locale).text}
                      aria-valuenow={share}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuetext={`${share}% · ${t("results", { count: option.votes ?? 0 })}`}
                      className="h-2 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {share}% · {t("results", { count: option.votes ?? 0 })}
                    </p>
                  </div>
                )}
                {canVote &&
                  (mine ? (
                    <p className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Check className="size-4" aria-hidden />
                      {t("voted")}
                    </p>
                  ) : (
                    <Button
                      type="button"
                      variant={myVote ? "outline" : "default"}
                      disabled={pending !== null}
                      onClick={() => vote(option.id)}
                    >
                      {pending === option.id && (
                        <Loader2 className="animate-spin" aria-hidden />
                      )}
                      {myVote ? t("changeVote") : t("vote")}
                    </Button>
                  ))}
              </div>
            </li>
          );
        })}
      </ul>
      {canVote && !showResults && (
        <p className="text-center text-sm text-muted-foreground">
          {t("resultsHidden")}
        </p>
      )}
      {!canVote && (
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-muted-foreground">{t("subscribersOnly")}</p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/pricing">{t("seePlans")}</Link>
            </Button>
            {!signedIn && (
              <Button asChild variant="ghost">
                <Link href={{ pathname: "/login", query: { next: "/vote" } }}>
                  {t("signIn")}
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
