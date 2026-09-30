"use client";

import {
  ChevronLeft,
  ChevronRight,
  ListChecks,
  MonitorSmartphone,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChefButton } from "@/components/chef/chef-button";
import { useWakeLock } from "@/hooks/use-wake-lock";
import type { UnitSystem } from "@/lib/quantity";
import { IngredientList } from "./ingredient-list";
import { StepTimer } from "./step-timer";
import type { RecipeIngredient, RecipeStep } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dishName: string;
  steps: RecipeStep[];
  ingredients: RecipeIngredient[];
  servings: number;
  baseServings: number;
  system: UnitSystem;
};

const SWIPE_THRESHOLD_PX = 60;

/** Full-screen, one step at a time, big type, screen kept awake. */
export function KitchenMode({
  open,
  onOpenChange,
  dishName,
  steps,
  ingredients,
  ...scale
}: Props) {
  const t = useTranslations("Kitchen");
  const tDish = useTranslations("Dish");
  const [index, setIndex] = useState(0);
  const wakeLock = useWakeLock(open);
  const touchStartX = useRef<number | null>(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const go = (offset: -1 | 1) =>
    setIndex((i) => Math.min(steps.length - 1, Math.max(0, i + offset)));

  function onKeyDown(event: React.KeyboardEvent) {
    // Don't hijack arrows inside buttons/inputs of the ingredient sheet.
    if (event.target instanceof HTMLInputElement) return;
    if (event.key === "ArrowRight") go(1);
    if (event.key === "ArrowLeft") go(-1);
  }

  if (!step) return null;
  const label = step.title ?? tDish("step", { number: index + 1 });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onKeyDown={onKeyDown}
        onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStartX.current === null) return;
          const delta = e.changedTouches[0].clientX - touchStartX.current;
          if (Math.abs(delta) > SWIPE_THRESHOLD_PX) go(delta < 0 ? 1 : -1);
          touchStartX.current = null;
        }}
        className="top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none"
      >
        <header className="flex items-center gap-3 border-b px-4 py-3">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate font-display text-lg">
              {dishName}
            </DialogTitle>
            <DialogDescription>
              {t("progress", { current: index + 1, total: steps.length })}
            </DialogDescription>
          </div>
          <ChefButton size="sm" compact />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <ListChecks aria-hidden />
                {t("ingredients")}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{t("ingredients")}</SheetTitle>
              </SheetHeader>
              <IngredientList
                ingredients={ingredients}
                className="px-4"
                {...scale}
              />
            </SheetContent>
          </Sheet>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            aria-label={t("exit")}
          >
            <X aria-hidden />
          </Button>
        </header>

        <div
          className="h-1 bg-primary transition-[width]"
          style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          aria-hidden
        />

        <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-8">
          <article
            key={step.id}
            aria-live="polite"
            className="w-full max-w-3xl space-y-6"
          >
            <p className="text-sm tracking-widest text-primary uppercase">
              {tDish("step", { number: index + 1 })}
            </p>
            {step.title && (
              <h2
                className="font-display text-3xl font-semibold"
                lang={step.lang}
              >
                {step.title}
              </h2>
            )}
            <p
              className="text-2xl leading-relaxed text-pretty sm:text-3xl"
              lang={step.lang}
            >
              {step.text}
            </p>
            {step.mediaUrl && (
              <Image
                src={step.mediaUrl}
                alt=""
                width={960}
                height={600}
                sizes="(min-width: 768px) 768px, 100vw"
                className="aspect-[16/10] w-full rounded-lg object-cover"
              />
            )}
            {step.timerSeconds && (
              <StepTimer
                id={step.id}
                seconds={step.timerSeconds}
                label={label}
                size="lg"
              />
            )}
            {isLast && (
              <p className="font-display text-2xl text-primary">{t("done")}</p>
            )}
          </article>
        </div>

        <footer className="space-y-3 border-t px-4 py-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => go(-1)}
              disabled={index === 0}
            >
              <ChevronLeft aria-hidden />
              {t("previous")}
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => (isLast ? onOpenChange(false) : go(1))}
            >
              {isLast ? t("finish") : t("next")}
              {!isLast && <ChevronRight aria-hidden />}
            </Button>
          </div>
          <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
            <MonitorSmartphone className="size-3.5" aria-hidden />
            {wakeLock === "unsupported"
              ? t("wakeLockUnsupported")
              : t("wakeLockOn")}
            <span className="hidden sm:inline">· {t("hint")}</span>
          </p>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
