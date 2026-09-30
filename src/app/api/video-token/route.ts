import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { isSigningConfigured, signPlaybackTokens } from "@/lib/video";

const BodySchema = z.object({ dishId: z.guid() });

// Fresh signed tokens for the full video, e.g. after the page has been open
// longer than the token lifetime. Access comes from RLS: the full-video row
// is only readable by visitors who pass has_access().
export async function POST(request: Request) {
  if (!(await rateLimit(`video-token:${await clientIp()}`, 30, 60))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = BodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success)
    return NextResponse.json({ error: "Bad request" }, { status: 400 });

  const supabase = await createClient();
  const { data: video } = await supabase
    .from("videos")
    .select("mux_playback_id")
    .eq("dish_id", body.data.dishId)
    .eq("kind", "full")
    .eq("status", "ready")
    .maybeSingle();

  if (!video?.mux_playback_id || !isSigningConfigured()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({
    tokens: await signPlaybackTokens(video.mux_playback_id),
  });
}
