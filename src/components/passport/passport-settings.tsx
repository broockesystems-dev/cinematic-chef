"use client";

import { Copy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updatePassportSettings } from "@/lib/actions/passport";

type Props = { username: string | null; isPublic: boolean; siteUrl: string };
const KNOWN = [
  "username_taken",
  "username_invalid",
  "username_required",
] as const;

export function PassportSettings({
  username: initialUsername,
  isPublic: initialPublic,
  siteUrl,
}: Props) {
  const t = useTranslations("Passport");
  const locale = useLocale();
  const [username, setUsername] = useState(initialUsername ?? "");
  const [isPublic, setIsPublic] = useState(initialPublic);
  const [savedUsername, setSavedUsername] = useState(
    initialPublic ? initialUsername : null,
  );
  const [isPending, startTransition] = useTransition();
  const link = savedUsername
    ? `${siteUrl}/${locale}/passport/${savedUsername}`
    : null;

  function save(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updatePassportSettings({
        username: username.trim() || null,
        isPublic,
      });
      if (!result.ok) {
        const key = KNOWN.includes(result.error as (typeof KNOWN)[number])
          ? result.error
          : "generic";
        return void toast.error(
          t(`errors.${key as (typeof KNOWN)[number] | "generic"}`),
        );
      }
      setSavedUsername(isPublic ? username.trim().toLowerCase() : null);
      toast.success(t("saved"));
    });
  }

  return (
    <section
      aria-labelledby="share-heading"
      className="space-y-4 rounded-xl border p-6"
    >
      <h2 id="share-heading" className="font-display text-xl font-semibold">
        {t("share")}
      </h2>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">{t("username")}</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
            maxLength={30}
            autoComplete="username"
            aria-describedby="username-hint"
          />
          <p id="username-hint" className="text-xs text-muted-foreground">
            {t("usernameHint")}
          </p>
        </div>
        <div className="flex items-start gap-3">
          <Switch
            id="public"
            checked={isPublic}
            onCheckedChange={setIsPublic}
            aria-describedby="public-hint"
          />
          <div>
            <Label htmlFor="public">{t("public")}</Label>
            <p id="public-hint" className="text-xs text-muted-foreground">
              {t("publicHint")}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isPending}>
          {t("saveSettings")}
        </Button>
      </form>
      {link && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">{t("link")}:</span>
          <a href={link} className="truncate text-primary hover:underline">
            {link}
          </a>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("link")}
            onClick={() => navigator.clipboard?.writeText(link)}
          >
            <Copy aria-hidden />
          </Button>
        </div>
      )}
    </section>
  );
}
