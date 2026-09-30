"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, type MagicLinkState } from "@/lib/actions/auth";

const initialState: MagicLinkState = { status: "idle" };

export function LoginForm({ next }: { next: string }) {
  const t = useTranslations("Login");
  const [state, formAction, isPending] = useActionState(
    sendMagicLink,
    initialState,
  );

  if (state.status === "sent") {
    return (
      <p role="status" className="rounded-lg border bg-card p-4 text-center">
        {t("sent")}
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-describedby={state.status === "idle" ? undefined : "login-error"}
        />
      </div>
      {state.status !== "idle" && (
        <p id="login-error" role="alert" className="text-sm text-destructive">
          {t(`errors.${state.status}`)}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("sending") : t("submit")}
      </Button>
    </form>
  );
}
