import Mux from "@mux/mux-node";
import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env.server";
import { syncSubtitleTrack } from "@/lib/mux-subtitles";
import { createAdminClient } from "@/lib/supabase/admin";

// Mux calls this as assets move through processing. Rows are matched by the
// video row id we send as `passthrough` when creating the upload.
export async function POST(request: Request) {
  const body = await request.text();

  let event: Awaited<ReturnType<Mux["webhooks"]["unwrap"]>>;
  try {
    // Verifies the HMAC signature and rejects stale timestamps (replays).
    event = await new Mux().webhooks.unwrap(
      body,
      request.headers,
      serverEnv("MUX_WEBHOOK_SECRET"),
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "video.upload.asset_created": {
      if (event.data.asset_id) {
        await supabase
          .from("videos")
          .update({ mux_asset_id: event.data.asset_id, status: "preparing" })
          .eq("mux_upload_id", event.data.id);
      }
      break;
    }
    case "video.asset.ready": {
      const asset = event.data;
      const { data: video } = await supabase
        .from("videos")
        .update({
          mux_asset_id: asset.id,
          mux_playback_id: asset.playback_ids?.[0]?.id ?? null,
          duration_s: asset.duration ?? null,
          status: "ready",
        })
        .eq("id", asset.passthrough ?? "")
        .select("subtitles")
        .maybeSingle();

      // Subtitles uploaded before the asset was ready are pushed now.
      const subtitles = (video?.subtitles ?? {}) as Partial<
        Record<"pt" | "en", string>
      >;
      await Promise.all(
        (["pt", "en"] as const).flatMap((lang) =>
          subtitles[lang] && asset.id
            ? [syncSubtitleTrack(asset.id, lang, subtitles[lang])]
            : [],
        ),
      );
      break;
    }
    case "video.asset.errored": {
      await supabase
        .from("videos")
        .update({ status: "errored" })
        .eq("id", event.data.passthrough ?? "");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
