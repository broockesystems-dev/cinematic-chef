"use client";

import { Lock, Send, Sparkles, Square, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Link, usePathname } from "@/i18n/navigation";
import { clearChefConversation } from "@/lib/actions/chef";
import { cn } from "@/lib/utils";
import { useChef } from "./chef-provider";

const SUGGESTIONS = ["adapt", "convert", "scale", "substitute"] as const;
const KNOWN_ERRORS = [
  "daily_limit",
  "rate_limited",
  "subscription_required",
  "unavailable",
] as const;

export function ChefSheet() {
  const t = useTranslations("Chef");
  const chef = useChef();

  return (
    <Sheet open={chef.open} onOpenChange={chef.setOpen}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SheetHeader className="border-b">
          <SheetTitle className="flex items-center gap-2 font-display text-xl">
            <Sparkles className="size-5 text-primary" aria-hidden />
            {t("title")}
          </SheetTitle>
          <SheetDescription>
            {t("subtitle", { dish: chef.dishName })}
          </SheetDescription>
        </SheetHeader>
        {chef.state === "ready" ? (
          <Conversation />
        ) : (
          <Locked signedOut={chef.state === "signed_out"} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function Locked({ signedOut }: { signedOut: boolean }) {
  const t = useTranslations("Chef");
  const pathname = usePathname();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <Lock className="size-8 text-premium" aria-hidden />
      <p className="font-display text-xl font-semibold">{t("lockedTitle")}</p>
      <p className="text-sm text-muted-foreground">{t("lockedBody")}</p>
      <Button asChild>
        <Link href="/pricing">{t("seePlans")}</Link>
      </Button>
      {signedOut && (
        <Button asChild variant="ghost">
          <Link href={{ pathname: "/login", query: { next: pathname } }}>
            {t("signIn")}
          </Link>
        </Button>
      )}
    </div>
  );
}

function Conversation() {
  const t = useTranslations("Chef");
  const chef = useChef();
  const [draft, setDraft] = useState("");
  const logRef = useRef<HTMLDivElement>(null);
  const streaming = chef.status === "streaming";

  // Keep the newest text in view while the reply streams in.
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [chef.messages]);

  function submit(text: string) {
    if (!text.trim() || streaming || chef.remaining <= 0) return;
    chef.send(text);
    setDraft("");
  }

  const errorKey = chef.error
    ? KNOWN_ERRORS.includes(chef.error as (typeof KNOWN_ERRORS)[number])
      ? (chef.error as (typeof KNOWN_ERRORS)[number])
      : "generic"
    : null;

  return (
    <>
      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-busy={streaming}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
      >
        {chef.messages.length === 0 && (
          <div className="space-y-2">
            {SUGGESTIONS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => submit(t(`suggestions.${key}`))}
                disabled={chef.remaining <= 0}
                className="block w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {t(`suggestions.${key}`)}
              </button>
            ))}
          </div>
        )}
        {chef.messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              <span className="sr-only">
                {message.role === "user" ? t("you") : t("chef")}:{" "}
              </span>
              {message.content ||
                (streaming && (
                  <span className="text-muted-foreground">{t("thinking")}</span>
                ))}
            </div>
          </div>
        ))}
        {errorKey && (
          <p role="alert" className="text-sm text-destructive">
            {t(`errors.${errorKey}`)}
          </p>
        )}
      </div>

      <form
        className="space-y-2 border-t p-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(draft);
        }}
      >
        <div className="flex items-end gap-2">
          <Textarea
            aria-label={t("placeholder")}
            placeholder={t("placeholder")}
            value={draft}
            maxLength={1000}
            rows={2}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(draft);
              }
            }}
            className="max-h-40 min-h-11 resize-none"
          />
          {streaming ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={chef.stop}
              aria-label={t("stop")}
            >
              <Square aria-hidden />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!draft.trim() || chef.remaining <= 0}
              aria-label={t("send")}
            >
              <Send aria-hidden />
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{t("remaining", { count: chef.remaining })}</span>
          {chef.messages.length > 0 && !streaming && (
            <button
              type="button"
              className="flex items-center gap-1 hover:text-foreground"
              onClick={async () => {
                const result = await clearChefConversation(chef.dishId);
                if (result.ok) chef.reset();
              }}
            >
              <Trash2 className="size-3" aria-hidden />
              {t("clear")}
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
      </form>
    </>
  );
}
