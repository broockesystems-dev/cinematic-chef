"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { publicEnv } from "@/lib/env";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { safeNextPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

export type MagicLinkState = {
  status: "idle" | "sent" | "invalid" | "rate_limited" | "error";
};

const EmailSchema = z.email().max(254);

export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  const email = EmailSchema.safeParse(
    String(formData.get("email") ?? "").trim(),
  );
  if (!email.success) return { status: "invalid" };

  const ip = await clientIp();
  const allowed =
    (await rateLimit(`magic-link:ip:${ip}`, 10, 3600)) &&
    (await rateLimit(`magic-link:email:${email.data.toLowerCase()}`, 3, 600));
  if (!allowed) return { status: "rate_limited" };

  const locale = await getLocale();
  const next = safeNextPath(formData.get("next"), `/${locale}`);
  const callback = new URL("/auth/callback", publicEnv.siteUrl);
  callback.searchParams.set("next", next);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: callback.toString(), data: { locale } },
  });
  if (error) {
    console.error("magic link failed", error.message);
    return { status: "error" };
  }
  return { status: "sent" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: "/", locale: await getLocale() });
}
