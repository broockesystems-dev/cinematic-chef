import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Anonymous client with no cookies: reads only what RLS shows to everyone.
 * Pages that use it can be statically rendered and cached.
 */
export function createPublicClient() {
  return createClient<Database>(
    publicEnv.supabaseUrl,
    publicEnv.supabasePublishableKey,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
