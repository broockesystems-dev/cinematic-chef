"use client";

import { ChefHat } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useUnitSystem } from "@/hooks/use-unit-system";
import { IngredientList } from "./ingredient-list";
import { KitchenMode } from "./kitchen-mode";
import { ServingsControl, UnitToggle } from "./recipe-controls";
import { StepList } from "./step-list";
import { TimerProvider } from "./timers";
import type { RecipeIngredient, RecipeStep } from "./types";

type Props = {
  dishName: string;
  baseServings: number;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
};

export function Recipe({ dishName, baseServings, ingredients, steps }: Props) {
  const t = useTranslations("Dish");
  const locale = useLocale();
  const [servings, setServings] = useState(baseServings);
  const [system, setSystem] = useUnitSystem(locale);
  const [cooking, setCooking] = useState(false);

  const scale = { servings, baseServings, system };

  return (
    <TimerProvider>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr]">
        <section
          aria-labelledby="ingredients-heading"
          className="space-y-4 lg:sticky lg:top-20 lg:self-start"
        >
          <h2
            id="ingredients-heading"
            className="font-display text-2xl font-semibold"
          >
            {t("ingredients")}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <ServingsControl value={servings} onChange={setServings} />
            <UnitToggle value={system} onChange={setSystem} />
          </div>
          <IngredientList ingredients={ingredients} {...scale} />
        </section>

        <section aria-labelledby="steps-heading" className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2
              id="steps-heading"
              className="font-display text-2xl font-semibold"
            >
              {t("steps")}
            </h2>
            {steps.length > 0 && (
              <Button type="button" onClick={() => setCooking(true)}>
                <ChefHat aria-hidden />
                {t("cookMode")}
              </Button>
            )}
          </div>
          <StepList steps={steps} />
        </section>
      </div>

      <KitchenMode
        open={cooking}
        onOpenChange={setCooking}
        dishName={dishName}
        steps={steps}
        ingredients={ingredients}
        {...scale}
      />
    </TimerProvider>
  );
}
