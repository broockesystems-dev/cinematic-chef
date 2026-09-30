"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertAdmin } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { getMux } from "@/lib/mux";
import { syncSubtitleTrack } from "@/lib/mux-subtitles";
import { createClient } from "@/lib/supabase/server";
import {
  check,
  checkRow,
  runAction,
  type ActionResult,
} from "../action-result";

const KindSchema = z.enum(["teaser", "full"]);
const LangSchema = z.enum(["pt", "en"]);

/** Upserts the (dish, kind) video row, since each dish has at most one of each. */
async function ensureVideoRow(dishId: string, kind: "teaser" | "full") {
  const supabase = await createClient();
  return checkRow(
    await supabase
      .from("videos")
      .upsert({ dish_id: dishId, kind }, { onConflict: "dish_id,kind" })
      .select("id, mux_asset_id, subtitles")
      .single(),
  );
}

/**
 * Creates a Mux direct upload. The browser sends the file straight to the
 * returned URL; the Mux webhook then fills in the asset and playback IDs.
 */
export async function createVideoUpload(
  dishId: string,
  kind: "teaser" | "full",
): Promise<ActionResult<{ uploadUrl: string }>> {
  return runAction(async () => {
    await assertAdmin();
    const parsedKind = KindSchema.parse(kind);
    const video = await ensureVideoRow(z.guid().parse(dishId), parsedKind);
    const mux = getMux();

    const upload = await mux.video.uploads.create({
      cors_origin: publicEnv.siteUrl,
      new_asset_settings: {
        // The full video is only playable through short-lived signed tokens.
        playback_policies: [parsedKind === "full" ? "signed" : "public"],
        passthrough: video.id,
      },
    });

    // Replacing a video: drop the old asset so it stops costing storage.
    if (video.mux_asset_id) {
      await mux.video.assets.delete(video.mux_asset_id).catch(() => undefined);
    }

    const supabase = await createClient();
    check(
      await supabase
        .from("videos")
        .update({
          mux_upload_id: upload.id,
          mux_asset_id: null,
          mux_playback_id: null,
          duration_s: null,
          status: "waiting",
        })
        .eq("id", video.id),
    );
    revalidatePath("/", "layout");
    if (!upload.url) throw new Error("O Mux não retornou a URL de upload.");
    return { uploadUrl: upload.url };
  });
}

/** Stores the .vtt URL for a language and pushes it to Mux when possible. */
export async function setSubtitle(
  dishId: string,
  kind: "teaser" | "full",
  lang: "pt" | "en",
  url: string,
): Promise<ActionResult<{ syncedToMux: boolean }>> {
  return runAction(async () => {
    await assertAdmin();
    const parsedLang = LangSchema.parse(lang);
    const parsedUrl = z.url().parse(url);
    const video = await ensureVideoRow(
      z.guid().parse(dishId),
      KindSchema.parse(kind),
    );

    const subtitles = {
      ...(video.subtitles as Record<string, string>),
      [parsedLang]: parsedUrl,
    };
    const supabase = await createClient();
    check(
      await supabase.from("videos").update({ subtitles }).eq("id", video.id),
    );

    const syncedToMux = video.mux_asset_id
      ? await syncSubtitleTrack(video.mux_asset_id, parsedLang, parsedUrl)
      : false;
    revalidatePath("/", "layout");
    return { syncedToMux };
  });
}
