import "server-only";
import type { Locale } from "@/i18n/routing";
import type { DishPageData } from "@/lib/dishes";
import { localize } from "@/lib/i18n-text";

/** Messages a subscriber can send per day (UTC), to keep API costs bounded. */
export const CHEF_DAILY_LIMIT = Number(process.env.CHEF_DAILY_LIMIT ?? 30);
/** Earlier turns sent back to the model for context. */
export const CHEF_HISTORY_LIMIT = 20;
export const CHEF_MAX_MESSAGE_LENGTH = 1000;

const LANGUAGE = { pt: "Brazilian Portuguese", en: "English" } as const;

function describeCountry(code: string | null): string {
  if (!code) return "an unknown country (ask if it matters)";
  const name =
    new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  return `${name} (${code})`;
}

function qty(value: number | null, unit: string | null): string {
  if (value == null) return "to taste";
  return `${value}${unit ? ` ${unit}` : ""}`;
}

/**
 * System prompt for the chef: fixed instructions followed by the dish, kept
 * stable per dish and user so it can be prompt-cached across turns.
 */
export function buildChefSystemPrompt(input: {
  data: DishPageData;
  locale: Locale;
  country: string | null;
}): string {
  const { data, locale, country } = input;
  const { dish, path } = data;
  // The model gets both languages' source text where available.
  const both = (value: { pt: string; en?: string } | null) =>
    value
      ? value.en && value.en !== value.pt
        ? `${value.pt} / ${value.en}`
        : value.pt
      : "";

  const ingredients = data.ingredients
    .map((i) => {
      const note = i.note ? ` (${both(i.note)})` : "";
      return `- ${both(i.name)}${note}: metric ${qty(i.qty_metric, i.unit_metric)}; US ${qty(i.qty_us, i.unit_us)}`;
    })
    .join("\n");
  const steps = data.steps
    .map((s, index) => {
      const timer = s.timer_seconds
        ? ` [timer: ${Math.round(s.timer_seconds / 60)} min]`
        : "";
      return `${index + 1}. ${s.title ? `${both(s.title)}: ` : ""}${both(s.text)}${timer}`;
    })
    .join("\n");

  return `You are the chef of The Cinematic Chef, an app about traditional dishes from around the world. You help one home cook make the dish below, in their own kitchen.

How to answer:
- Always reply in ${LANGUAGE[locale]}, whatever language the recipe text is in.
- Be warm, practical and brief: a few sentences or a short list. Plain text only (no Markdown headings, tables or bold); use "- " for lists.
- The cook lives in ${describeCountry(country)}. When they ask to adapt the recipe, suggest substitutes that are easy to find there and say how the result changes.
- Convert measures (metric/US), scale servings and adjust timings exactly; show the numbers.
- Respect the dish's tradition: say what is essential to keep and what can change.
- Food safety first: flag risks with hot oil, raw meat or eggs, allergens and storage times. Never guess about allergies or medical diets; recommend checking labels or a professional.
- Only help with this dish and cooking questions around it. Politely decline anything unrelated.
- Never claim to be a human. If you don't know, say so.

The dish: ${localize(dish.name, locale).text}
Place: ${path.map((l) => localize(l.name, locale).text).join(" › ")}
Base recipe serves: ${dish.base_servings}
Total time: ${dish.prep_minutes ? `${dish.prep_minutes} minutes` : "not specified"}
Difficulty: ${dish.difficulty}

Story:
${both(dish.story) || "(none)"}

Ingredients (for ${dish.base_servings} servings):
${ingredients || "(none listed)"}

Method:
${steps || "(no steps listed)"}`;
}

/** Start of the current UTC day, for the daily message limit. */
export function startOfUtcDay(now = new Date()): string {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export type ChefMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};
