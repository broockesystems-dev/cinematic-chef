import "server-only";
import Mux from "@mux/mux-node";
import { serverEnv } from "@/lib/env.server";

export type PlaybackTokens = {
  playback: string;
  thumbnail: string;
  storyboard: string;
};

const TOKEN_TTL = "1h";

/**
 * Short-lived tokens for a signed playback ID. Signing happens locally with
 * the private key (no Mux API call). Callers must check access first.
 */
export async function signPlaybackTokens(
  playbackId: string,
): Promise<PlaybackTokens> {
  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID ?? "unused-for-signing",
    tokenSecret: process.env.MUX_TOKEN_SECRET ?? "unused-for-signing",
    jwtSigningKey: serverEnv("MUX_SIGNING_KEY"),
    jwtPrivateKey: serverEnv("MUX_PRIVATE_KEY"),
  });
  const tokens = await mux.jwt.signPlaybackId(playbackId, {
    type: ["video", "thumbnail", "storyboard"],
    expiration: TOKEN_TTL,
  });
  return {
    playback: tokens["playback-token"] ?? "",
    thumbnail: tokens["thumbnail-token"] ?? "",
    storyboard: tokens["storyboard-token"] ?? "",
  };
}

export function isSigningConfigured(): boolean {
  return Boolean(process.env.MUX_SIGNING_KEY && process.env.MUX_PRIVATE_KEY);
}
