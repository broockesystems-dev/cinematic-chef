import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";

/**
 * Bypasses RLS. Only for trusted server code such as payment webhooks —
 * never use it to serve content to a user.
 */
export function createAdminClient() {
  return createClient(publicEnv.supabaseUrl, serverEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
