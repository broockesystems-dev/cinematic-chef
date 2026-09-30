"use client";

import { useTranslations } from "next-intl";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

type Timer = {
  duration: number;
  label: string;
  /** Epoch ms when a running timer ends; null while paused or finished. */
  endsAt: number | null;
  /** Seconds left when paused. */
  pausedAt: number | null;
  finished: boolean;
};

type TimersContext = {
  get: (id: string) => {
    remaining: number;
    running: boolean;
    finished: boolean;
    started: boolean;
  };
  start: (id: string, duration: number, label: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  reset: (id: string) => void;
};

const Context = createContext<TimersContext | null>(null);

/**
 * Step timers shared by the recipe and cook mode, so a timer keeps running
 * while the cook moves between steps. Several can run at once.
 */
export function TimerProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("Timer");
  const [timers, setTimers] = useState<Record<string, Timer>>({});
  const [now, setNow] = useState(() => Date.now());
  const timersRef = useRef(timers);
  const audioRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    timersRef.current = timers;
  }, [timers]);

  const notify = useCallback(
    (label: string) => {
      toast.success(t("done", { step: label }), { duration: 15000 });
      navigator.vibrate?.([300, 150, 300, 150, 300]);
      const audio = audioRef.current;
      if (!audio) return;
      // Three short beeps.
      for (let i = 0; i < 3; i++) {
        const oscillator = audio.createOscillator();
        const gain = audio.createGain();
        oscillator.frequency.value = 880;
        oscillator.connect(gain).connect(audio.destination);
        const at = audio.currentTime + i * 0.4;
        gain.gain.setValueAtTime(0.25, at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.3);
        oscillator.start(at);
        oscillator.stop(at + 0.3);
      }
    },
    [t],
  );

  const anyRunning = Object.values(timers).some(
    (timer) => timer.endsAt !== null,
  );
  useEffect(() => {
    if (!anyRunning) return;
    const interval = setInterval(() => {
      const current = Date.now();
      setNow(current);
      const done = Object.entries(timersRef.current).filter(
        ([, timer]) => timer.endsAt !== null && timer.endsAt <= current,
      );
      if (done.length === 0) return;
      done.forEach(([, timer]) => notify(timer.label));
      setTimers((prev) => {
        const next = { ...prev };
        for (const [id] of done)
          next[id] = {
            ...next[id],
            endsAt: null,
            pausedAt: null,
            finished: true,
          };
        return next;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [anyRunning, notify]);

  const value = useMemo<TimersContext>(
    () => ({
      get: (id) => {
        const timer = timers[id];
        if (!timer)
          return {
            remaining: 0,
            running: false,
            finished: false,
            started: false,
          };
        const remaining =
          timer.endsAt !== null
            ? (timer.endsAt - now) / 1000
            : (timer.pausedAt ?? 0);
        return {
          remaining,
          running: timer.endsAt !== null,
          finished: timer.finished,
          started: true,
        };
      },
      start: (id, duration, label) => {
        // Created on a click so browsers allow it to play sound later.
        audioRef.current ??= new AudioContext();
        audioRef.current.resume().catch(() => undefined);
        setNow(Date.now());
        setTimers((prev) => ({
          ...prev,
          [id]: {
            duration,
            label,
            endsAt: Date.now() + duration * 1000,
            pausedAt: null,
            finished: false,
          },
        }));
      },
      pause: (id) =>
        setTimers((prev) => {
          const timer = prev[id];
          if (!timer?.endsAt) return prev;
          return {
            ...prev,
            [id]: {
              ...timer,
              endsAt: null,
              pausedAt: (timer.endsAt - Date.now()) / 1000,
            },
          };
        }),
      resume: (id) => {
        setNow(Date.now());
        setTimers((prev) => {
          const timer = prev[id];
          if (timer?.pausedAt == null) return prev;
          return {
            ...prev,
            [id]: {
              ...timer,
              endsAt: Date.now() + timer.pausedAt * 1000,
              pausedAt: null,
            },
          };
        });
      },
      reset: (id) =>
        setTimers((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        }),
    }),
    [timers, now],
  );

  return <Context value={value}>{children}</Context>;
}

export function useTimers(): TimersContext {
  const context = use(Context);
  if (!context)
    throw new Error("useTimers must be used inside <TimerProvider>");
  return context;
}
