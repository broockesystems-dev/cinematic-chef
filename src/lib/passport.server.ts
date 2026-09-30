import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ancestry, type ExploreData } from "@/lib/explore";
import { getExploreData } from "@/lib/explore.server";
import type { CookedEntry } from "@/lib/passport";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";

type Client = SupabaseClient<Database>;
const PHOTO_URL_TTL = 3600;

async function loadEntries(
  client: Client,
  userId: string,
  explore: ExploreData,
): Promise<CookedEntry[]> {
  const { data: rows } = await client
    .from("cooked_dishes")
    .select("dish_id, photo_path, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (!rows?.length) return [];

  // Short-lived URLs for photos in the private bucket.
  const paths = rows.flatMap((r) => (r.photo_path ? [r.photo_path] : []));
  const signed = paths.length
    ? (
        await client.storage
          .from("cooked")
          .createSignedUrls(paths, PHOTO_URL_TTL)
      ).data
    : [];
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const dishes = new Map(explore.dishes.map((d) => [d.id, d]));
  const locations = new Map(explore.locations.map((l) => [l.id, l]));
  // Only published dishes appear; a dish taken down later just drops out.
  return rows.flatMap((row): CookedEntry[] => {
    const dish = dishes.get(row.dish_id);
    if (!dish) return [];
    const chain = ancestry(dish.locationId, locations);
    const country = chain.find((l) => l.type === "country");
    const continent = chain.find((l) => l.type === "continent");
    return [
      {
        dishId: dish.id,
        dishSlug: dish.slug,
        dishName: dish.name,
        country: country
          ? { iso: country.isoCode, name: country.name, slug: country.slug }
          : null,
        continent: continent
          ? { name: continent.name, slug: continent.slug }
          : null,
        photoUrl: row.photo_path
          ? (urlByPath.get(row.photo_path) ?? null)
          : null,
        cookedAt: row.created_at,
      },
    ];
  });
}

export type PassportOwner = {
  displayName: string | null;
  username: string | null;
  isPublic: boolean;
};

/** The signed-in user's passport, read through RLS. */
export async function getMyPassport(): Promise<{
  owner: PassportOwner;
  entries: CookedEntry[];
} | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const [{ data: profile }, explore] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, passport_public")
      .eq("id", userId)
      .single(),
    getExploreData(),
  ]);
  return {
    owner: {
      displayName: profile?.display_name ?? null,
      username: profile?.username ?? null,
      isPublic: profile?.passport_public ?? false,
    },
    entries: await loadEntries(supabase, userId, explore),
  };
}

/**
 * A passport someone chose to share. The opt-in check happens in the
 * database (public_passport); only then is the service role used to read it.
 */
export async function getPublicPassport(username: string) {
  const { data } = await createPublicClient().rpc("public_passport", {
    p_username: username,
  });
  const owner = data?.[0];
  if (!owner) return null;
  const explore = await getExploreData();
  return {
    owner: {
      displayName: owner.display_name,
      username: owner.username,
      isPublic: true,
    } satisfies PassportOwner,
    entries: await loadEntries(createAdminClient(), owner.user_id, explore),
  };
}

export type CookedState =
  | { signedIn: false }
  | { signedIn: true; userId: string; cooked: boolean; hasPhoto: boolean };

export async function getCookedState(dishId: string): Promise<CookedState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return { signedIn: false };
  const { data: row } = await supabase
    .from("cooked_dishes")
    .select("photo_path")
    .eq("user_id", userId)
    .eq("dish_id", dishId)
    .maybeSingle();
  return {
    signedIn: true,
    userId,
    cooked: Boolean(row),
    hasPhoto: Boolean(row?.photo_path),
  };
}
