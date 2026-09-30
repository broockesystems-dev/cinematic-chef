"use client";

import { createContext, use, useCallback, useRef, useState } from "react";
import type { ChefMessage } from "@/lib/chef";
import type { ChefState } from "@/lib/chef-state";

type Status = "idle" | "streaming";

type ChefContext = {
  state: ChefState["status"];
  dishId: string;
  dishName: string;
  messages: ChefMessage[];
  remaining: number;
  status: Status;
  error: string | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  send: (text: string) => Promise<void>;
  reset: () => void;
  stop: () => void;
};

const Context = createContext<ChefContext | null>(null);

/** One conversation per dish page, shared by every "Ask the chef" button. */
export function ChefProvider({
  initial,
  dishId,
  slug,
  dishName,
  children,
}: {
  initial: ChefState;
  dishId: string;
  slug: string;
  dishName: string;
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState<ChefMessage[]>(
    initial.status === "ready" ? initial.messages : [],
  );
  const [remaining, setRemaining] = useState(
    initial.status === "ready" ? initial.remaining : 0,
  );
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpenState] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const setOpen = useCallback(
    (next: boolean) => {
      // Closing the panel stops a reply in progress (and its token spend).
      if (!next) stop();
      setOpenState(next);
    },
    [stop],
  );

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || status === "streaming") return;
      setError(null);
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", content: message },
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setStatus("streaming");
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const response = await fetch("/api/chef", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug, message }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          const body = await response.json().catch(() => ({}));
          setError(body.error ?? "generic");
          // Drop the empty assistant bubble; keep the question visible.
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }
        const left = Number(response.headers.get("X-Chef-Remaining"));
        if (Number.isFinite(left)) setRemaining(left);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: m.content + chunk } : m,
            ),
          );
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") setError("generic");
      } finally {
        setStatus("idle");
        abortRef.current = null;
      }
    },
    [slug, status],
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return (
    <Context
      value={{
        state: initial.status,
        dishId,
        dishName,
        messages,
        remaining,
        status,
        error,
        open,
        setOpen,
        send,
        reset,
        stop,
      }}
    >
      {children}
    </Context>
  );
}

export function useChef(): ChefContext {
  const context = use(Context);
  if (!context) throw new Error("useChef must be used inside <ChefProvider>");
  return context;
}
