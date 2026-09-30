import "server-only";
import type { I18nText } from "@/lib/i18n-text";
import type { LocationRow } from "@/lib/locations";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { check } from "./action-result";

// Admin reads go through the user's session: RLS lets admins see everything,
// drafts included.

export type AdminDish = Omit<
  Tables<"dishes">,
  "name" | "story" | "search_vector"
> & {
  name: I18nText;
  story: I18nText;
};
export type AdminIngredient = Omit<Tables<"ingredients">, "name" | "note"> & {
  name: I18nText;
  note: I18nText | null;
};
export type AdminStep = Omit<Tables<"steps">, "title" | "text"> & {
  title: I18nText | null;
  text: I18nText;
};
export type AdminVideo = Omit<Tables<"videos">, "subtitles"> & {
  subtitles: Partial<Record<"pt" | "en", string>>;
};

const LOCATION_COLUMNS =
  "id, parent_id, type, name, slug, lat, lng, iso_code, created_at, updated_at";
const DISH_COLUMNS =
  "id, location_id, slug, name, story, cover_url, prep_minutes, difficulty, base_servings, access, status, published_at, created_at, updated_at";

export async function listLocations(): Promise<LocationRow[]> {
  const supabase = await createClient();
  const rows = check(await supabase.from("locations").select(LOCATION_COLUMNS));
  return rows as LocationRow[];
}

export async function listDishes(): Promise<AdminDish[]> {
  const supabase = await createClient();
  const rows = check(
    await supabase
      .from("dishes")
      .select(DISH_COLUMNS)
      .order("updated_at", { ascending: false }),
  );
  return rows as AdminDish[];
}

export async function getDishWithRecipe(id: string) {
  const supabase = await createClient();
  const [dish, ingredients, steps, videos] = await Promise.all([
    supabase.from("dishes").select(DISH_COLUMNS).eq("id", id).maybeSingle(),
    supabase
      .from("ingredients")
      .select("*")
      .eq("dish_id", id)
      .order("position"),
    supabase.from("steps").select("*").eq("dish_id", id).order("position"),
    supabase.from("videos").select("*").eq("dish_id", id),
  ]);
  const dishRow = check(dish);
  if (!dishRow) return null;
  return {
    dish: dishRow as AdminDish,
    ingredients: check(ingredients) as AdminIngredient[],
    steps: check(steps) as AdminStep[],
    videos: check(videos) as AdminVideo[],
  };
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const count = async (
    query: PromiseLike<{ count: number | null; error: unknown }>,
  ) => (await query).count ?? 0;

  const [published, scheduled, drafts, premium, locations, subscribers] =
    await Promise.all([
      count(
        supabase
          .from("dishes")
          .select("*", { count: "exact", head: true })
          .eq("status", "published")
          .lte("published_at", nowIso),
      ),
      count(
        supabase
          .from("dishes")
          .select("*", { count: "exact", head: true })
          .eq("status", "published")
          .gt("published_at", nowIso),
      ),
      count(
        supabase
          .from("dishes")
          .select("*", { count: "exact", head: true })
          .eq("status", "draft"),
      ),
      count(
        supabase
          .from("dishes")
          .select("*", { count: "exact", head: true })
          .eq("access", "premium"),
      ),
      count(
        supabase.from("locations").select("*", { count: "exact", head: true }),
      ),
      count(
        supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .in("status", ["active", "trialing"])
          .gt("current_period_end", nowIso),
      ),
    ]);
  return { published, scheduled, drafts, premium, locations, subscribers };
}
