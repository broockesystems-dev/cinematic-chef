import type { IngredientAmount } from "@/lib/quantity";

// Recipe data already localized on the server. `lang` is set when the text
// fell back to the other language, so screen readers pronounce it correctly.

export type RecipeIngredient = {
  id: string;
  name: string;
  note: string | null;
  lang?: string;
  amount: IngredientAmount;
};

export type RecipeStep = {
  id: string;
  title: string | null;
  text: string;
  lang?: string;
  mediaUrl: string | null;
  timerSeconds: number | null;
};
