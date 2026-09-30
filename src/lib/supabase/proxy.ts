import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { publicEnv } from "@/lib/env";

/**
 * Refreshes the Supabase auth session and writes the updated cookies onto
 * `response` (the one produced by the i18n proxy), so both concerns share a
 * single response.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse,
) {
  const supabase = createServerClient(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // getClaims() validates the JWT and triggers a refresh when it has expired.
  await supabase.auth.getClaims();

  return response;
}
