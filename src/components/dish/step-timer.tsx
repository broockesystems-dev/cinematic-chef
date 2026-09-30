"use client";

import { Pause, Play, RotateCcw, Timer as TimerIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useTimers } from "./timers";

type Props = {
  id: string;
  seconds: number;
  label: string;
  size?: "default" | "lg";
};

export function StepTimer({ id, seconds, label, size = "default" }: Props) {
  const t = useTranslations("Timer");
  const timers = useTimers();
  const state = timers.get(id);
  const buttonSize = size === "lg" ? "lg" : "sm";

  if (!state.started) {
    return (
      <Button
        type="button"
        variant="outline"
        size={buttonSize}
        onClick={() => timers.start(id, seconds, label)}
      >
        <TimerIcon aria-hidden />
        {t("start", { time: formatClock(seconds) })}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        role="timer"
        aria-label={t("running", { time: formatClock(state.remaining) })}
        className={cn(
          "min-w-20 rounded-md border px-3 py-1 text-center font-mono tabular-nums",
          size === "lg" && "min-w-32 text-3xl",
          state.finished && "animate-pulse border-primary text-primary",
        )}
      >
        {formatClock(state.remaining)}
      </span>
      {!state.finished &&
        (state.running ? (
          <Button
            type="button"
            variant="outline"
            size={buttonSize}
            onClick={() => timers.pause(id)}
          >
            <Pause aria-hidden />
            {t("pause")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size={buttonSize}
            onClick={() => timers.resume(id)}
          >
            <Play aria-hidden />
            {t("resume")}
          </Button>
        ))}
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        onClick={() => timers.reset(id)}
      >
        <RotateCcw aria-hidden />
        {t("reset")}
      </Button>
    </div>
  );
}
