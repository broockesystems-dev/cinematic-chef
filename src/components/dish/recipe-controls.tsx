"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { UnitSystem } from "@/lib/quantity";
import { cn } from "@/lib/utils";

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 48;

export function ServingsControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const t = useTranslations("Dish");
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.max(MIN_SERVINGS, value - 1))}
        disabled={value <= MIN_SERVINGS}
        aria-label={t("decreaseServings")}
      >
        <Minus aria-hidden />
      </Button>
      <output aria-live="polite" className="min-w-24 text-center tabular-nums">
        {t("servings", { count: value })}
      </output>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(Math.min(MAX_SERVINGS, value + 1))}
        disabled={value >= MAX_SERVINGS}
        aria-label={t("increaseServings")}
      >
        <Plus aria-hidden />
      </Button>
    </div>
  );
}

export function UnitToggle({
  value,
  onChange,
}: {
  value: UnitSystem;
  onChange: (value: UnitSystem) => void;
}) {
  const t = useTranslations("Dish");
  return (
    <div
      role="radiogroup"
      aria-label={t("units")}
      className="inline-flex rounded-md border p-0.5"
    >
      {(["metric", "us"] as const).map((system) => (
        <button
          key={system}
          type="button"
          role="radio"
          aria-checked={value === system}
          onClick={() => onChange(system)}
          className={cn(
            "rounded-sm px-3 py-1.5 text-sm text-muted-foreground transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
            value === system && "bg-accent text-foreground",
          )}
        >
          {t(system)}
        </button>
      ))}
    </div>
  );
}
