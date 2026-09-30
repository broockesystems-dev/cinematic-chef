import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import {
  getFormatter,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { VoteOptions } from "@/components/vote/vote-options";
import type { Locale } from "@/i18n/routing";
import { getAccount } from "@/lib/account";
import { localize } from "@/lib/i18n-text";
import { getVotePage } from "@/lib/polls";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/vote">): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "Vote" });
  return pageMetadata({
    locale,
    path: "/vote",
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function VotePage({
  params,
}: PageProps<"/[locale]/vote">) {
  const locale = (await params).locale as Locale;
  setRequestLocale(locale);
  const t = await getTranslations("Vote");
  const format = await getFormatter();
  const [{ current, myVote, past }, account] = await Promise.all([
    getVotePage(),
    getAccount(),
  ]);
  const canVote = Boolean(account?.subscription);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-12 px-4 py-16">
      <header className="mx-auto max-w-2xl space-y-3 text-center">
        <h1 className="font-display text-4xl font-semibold text-balance sm:text-5xl">
          {t("title")}
        </h1>
        <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
        {current && (
          <p className="text-sm text-primary">
            {t("closes", {
              date: format.dateTime(new Date(current.closesAt), {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                timeZoneName: "short",
              }),
            })}
          </p>
        )}
      </header>

      {current ? (
        <VoteOptions
          poll={current}
          myVote={myVote}
          canVote={canVote}
          signedIn={Boolean(account)}
        />
      ) : (
        <p className="text-center text-muted-foreground">{t("none")}</p>
      )}

      {past.length > 0 && (
        <section aria-labelledby="past-heading" className="space-y-4">
          <h2 id="past-heading" className="font-display text-2xl font-semibold">
            {t("past")}
          </h2>
          <ul className="divide-y rounded-lg border">
            {past.map((poll) => {
              const winner = poll.options.find(
                (o) => o.id === poll.winnerOptionId,
              );
              return (
                <li key={poll.id} className="flex items-center gap-3 px-4 py-3">
                  <Trophy className="size-4 text-primary" aria-hidden />
                  <span className="w-36 text-sm text-muted-foreground">
                    {capitalize(
                      format.dateTime(new Date(`${poll.month}T12:00:00Z`), {
                        month: "long",
                        year: "numeric",
                      }),
                    )}
                  </span>
                  <span className="font-medium">
                    {winner
                      ? localize(winner.dishName, locale).text
                      : t("noWinner")}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </section>
  );
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
