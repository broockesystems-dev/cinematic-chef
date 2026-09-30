import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email: string | null;
  role: "user" | "admin";
};

/** Verified user for this request (JWT checked), memoized per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", claims.sub)
    .single();

  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? null,
    role: profile?.role ?? "user",
  };
});

export class ForbiddenError extends Error {
  constructor() {
    super("Forbidden");
  }
}

/** For server actions and route handlers: throws unless the caller is admin. */
export async function assertAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") throw new ForbiddenError();
  return user;
}
