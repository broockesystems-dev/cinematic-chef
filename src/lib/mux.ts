import "server-only";
import Mux from "@mux/mux-node";
import { serverEnv } from "@/lib/env.server";

export function getMux() {
  return new Mux({
    tokenId: serverEnv("MUX_TOKEN_ID"),
    tokenSecret: serverEnv("MUX_TOKEN_SECRET"),
  });
}

export function isMuxConfigured(): boolean {
  return Boolean(process.env.MUX_TOKEN_ID && process.env.MUX_TOKEN_SECRET);
}
