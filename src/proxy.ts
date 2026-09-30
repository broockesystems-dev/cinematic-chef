import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const handleI18nRouting = createIntlMiddleware(routing);

// The admin panel and the auth callback live outside /pt and /en.
const NON_LOCALIZED_PREFIXES = ["/admin", "/auth"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLocalized = !NON_LOCALIZED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  const response = isLocalized
    ? handleI18nRouting(request)
    : NextResponse.next({ request });
  return updateSession(request, response);
}

export const config = {
  // Skip API routes, Next internals and any path with a file extension.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
