"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { StepTimer } from "./step-timer";
import type { RecipeStep } from "./types";

export function StepList({ steps }: { steps: RecipeStep[] }) {
  const t = useTranslations("Dish");
  return (
    <ol className="space-y-8">
      {steps.map((step, index) => {
        const label = step.title ?? t("step", { number: index + 1 });
        return (
          <li key={step.id} className="grid gap-3 sm:grid-cols-[3rem_1fr]">
            <span
              aria-hidden
              className="font-display text-3xl text-primary tabular-nums"
            >
              {index + 1}
            </span>
            <div className="space-y-3">
              <h3 className="font-semibold" lang={step.lang}>
                {label}
              </h3>
              <p
                className="leading-relaxed text-pretty text-muted-foreground"
                lang={step.lang}
              >
                {step.text}
              </p>
              {step.mediaUrl && (
                <Image
                  src={step.mediaUrl}
                  alt=""
                  width={640}
                  height={400}
                  sizes="(min-width: 768px) 640px, 100vw"
                  className="aspect-[16/10] w-full max-w-xl rounded-lg object-cover"
                />
              )}
              {step.timerSeconds && (
                <StepTimer
                  id={step.id}
                  seconds={step.timerSeconds}
                  label={label}
                />
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
