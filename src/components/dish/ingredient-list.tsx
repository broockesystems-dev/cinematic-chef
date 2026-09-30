"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  formatQuantity,
  pickMeasure,
  pluralCount,
  type UnitSystem,
} from "@/lib/quantity";
import { cn } from "@/lib/utils";
import type { RecipeIngredient } from "./types";

type Props = {
  ingredients: RecipeIngredient[];
  servings: number;
  baseServings: number;
  system: UnitSystem;
  className?: string;
};

export function IngredientList({
  ingredients,
  servings,
  baseServings,
  system,
  className,
}: Props) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <ul className={cn("divide-y", className)}>
      {ingredients.map((ingredient) => {
        const measure = pickMeasure(
          ingredient.amount,
          system,
          servings,
          baseServings,
        );
        const unitLabel = measure?.unit
          ? t(`Units.${measure.unit}`, { count: pluralCount(measure.qty) })
          : "";
        return (
          <li key={ingredient.id} className="flex gap-4 py-3">
            <span className="w-28 shrink-0 text-right font-medium tabular-nums text-primary">
              {measure
                ? `${formatQuantity(measure, locale)} ${unitLabel}`.trim()
                : t("Dish.toTaste")}
            </span>
            <span lang={ingredient.lang}>
              {ingredient.name}
              {ingredient.note && (
                <span className="text-muted-foreground">
                  , {ingredient.note}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
