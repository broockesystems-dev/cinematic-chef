import "server-only";
import { cache } from "react";
import type { MeasureUnit } from "@/lib/admin/schemas";
import type { I18nText } from "@/lib/i18n-text";
import { indexById, pathOf, type LocationRow } from "@/lib/locations";
import type { Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import {
  isSigningConfigured,
  signPlaybackTokens,
  type PlaybackTokens,
} from "@/lib/video";

export type PublicDish = Pick<
  Tables<"dishes">,
  | "id"
  | "slug"
  | "cover_url"
  | "prep_minutes"
  | "difficulty"
  | "base_servings"
  | "access"
  | "published_at"
  | "updated_at"
> & { name: I18nText; story: I18nText; location_id: string };

export type PublicIngredient = {
  id: string;
  name: I18nText;
  note: I18nText | null;
  qty_metric: number | null;
  unit_metric: MeasureUnit | null;
  qty_us: number | null;
  unit_us: MeasureUnit | null;
};

export type PublicStep = {
  id: string;
  title: I18nText | null;
  text: I18nText;
  media_url: string | null;
  timer_seconds: number | null;
};

export type DishVideo = {
  playbackId: string;
  /** Only for signed (full) videos. */
  tokens?: PlaybackTokens;
};

export type DishPageData = {
  dish: PublicDish;
  path: LocationRow[];
  hasAccess: boolean;
  ingredients: PublicIngredient[];
  steps: PublicStep[];
  teaser: DishVideo | null;
  full: DishVideo | null;
};

const DISH_COLUMNS =
  "id, slug, location_id, name, story, cover_url, prep_minutes, difficulty, base_servings, access, published_at, updated_at";

/**
 * Everything the dish page needs, read as the current visitor: RLS returns
 * recipe rows and the full video only when `has_access` allows it, so a
 * non-subscriber never receives premium content.
 */
export const getDishPage = cache(
  async (slug: string): Promise<DishPageData | null> => {
    const supabase = await createClient();
    const { data: dish } = await supabase
      .from("dishes")
      .select(DISH_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();
    if (!dish) return null;

    const [access, locations, ingredients, steps, videos] = await Promise.all([
      supabase.rpc("has_access", { p_dish_id: dish.id }),
      supabase
        .from("locations")
        .select(
          "id, parent_id, type, name, slug, lat, lng, iso_code, created_at, updated_at",
        ),
      supabase
        .from("ingredients")
        .select("id, name, note, qty_metric, unit_metric, qty_us, unit_us")
        .eq("dish_id", dish.id)
        .order("position"),
      supabase
        .from("steps")
        .select("id, title, text, media_url, timer_seconds")
        .eq("dish_id", dish.id)
        .order("position"),
      supabase
        .from("videos")
        .select("kind, status, mux_playback_id")
        .eq("dish_id", dish.id)
        .eq("status", "ready"),
    ]);

    const hasAccess = access.data === true;
    const teaserRow = videos.data?.find(
      (v) => v.kind === "teaser" && v.mux_playback_id,
    );
    const fullRow = hasAccess
      ? videos.data?.find((v) => v.kind === "full" && v.mux_playback_id)
      : undefined;

    return {
      dish: dish as PublicDish,
      path: pathOf(
        dish.location_id,
        indexById((locations.data ?? []) as LocationRow[]),
      ),
      hasAccess,
      ingredients: (ingredients.data ?? []).map((i) => ({
        ...i,
        qty_metric: i.qty_metric == null ? null : Number(i.qty_metric),
        qty_us: i.qty_us == null ? null : Number(i.qty_us),
      })) as PublicIngredient[],
      steps: (steps.data ?? []) as PublicStep[],
      teaser: teaserRow ? { playbackId: teaserRow.mux_playback_id! } : null,
      full:
        fullRow && isSigningConfigured()
          ? {
              playbackId: fullRow.mux_playback_id!,
              tokens: await signPlaybackTokens(fullRow.mux_playback_id!),
            }
          : null,
    };
  },
);
