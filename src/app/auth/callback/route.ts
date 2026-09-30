import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { safeNextPath } from "@/lib/safe-redirect";
import { createClient } from "@/lib/supabase/server";

// Target of the magic link (and, later, OAuth): trades the one-time code for
// a session cookie and sends the user on.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(
    searchParams.get("next"),
    `/${routing.defaultLocale}`,
  );
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }

  const locale = next.split("/")[1];
  const loginLocale = routing.locales.includes(locale as never)
    ? locale
    : routing.defaultLocale;
  return NextResponse.redirect(
    new URL(`/${loginLocale}/login?error=link`, origin),
  );
}
