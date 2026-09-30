"use client";

import { useEffect, useState } from "react";

export type WakeLockStatus = "idle" | "active" | "unsupported";

/**
 * Keeps the screen on while `enabled`, re-acquiring after the tab is hidden
 * (browsers release the lock then). Only call from client-only UI.
 */
export function useWakeLock(enabled: boolean): WakeLockStatus {
  const [status, setStatus] = useState<"idle" | "active" | "failed">("idle");
  const supported = typeof navigator !== "undefined" && "wakeLock" in navigator;

  useEffect(() => {
    if (!enabled || !supported) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen");
        if (!cancelled) setStatus("active");
      } catch {
        if (!cancelled) setStatus("failed");
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      sentinel?.release().catch(() => undefined);
      setStatus("idle");
    };
  }, [enabled, supported]);

  if (!enabled) return "idle";
  if (!supported || status === "failed") return "unsupported";
  return status;
}
