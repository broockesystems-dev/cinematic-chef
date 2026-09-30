import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { serverEnv } from "@/lib/env.server";

const TRANSLATION_SYSTEM_PROMPT = `You translate content for The Cinematic Chef, a recipe app about traditional dishes from around the world, from Brazilian Portuguese into natural American English.

- Translate each input string independently and return the translations in the same order.
- Keep proper dish names in their original language (for example "pão de queijo", "pizza fritta", "tacos al pastor"); translate descriptive names.
- Use standard US cooking vocabulary (skillet, broil, scallion, all-purpose flour).
- Readers of the English version cook with US customary units, so convert temperatures written in the text to °F (175 °C becomes 350 °F) and lengths to inches, rounding the way a recipe would. Do not convert ingredient quantities, which the app stores separately.
- Preserve the tone: warm and evocative for stories, clear and direct for recipe steps.
- Keep line breaks and punctuation style. Return an empty string for an empty input.`;

const TranslationSchema = z.object({ translations: z.array(z.string()) });

export class TranslationError extends Error {}

/** Translates PT strings to EN, preserving order. Server-only. */
export async function translatePtToEn(texts: string[]): Promise<string[]> {
  const client = new Anthropic({ apiKey: serverEnv("ANTHROPIC_API_KEY") });

  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    // Short, well-specified task: low effort keeps it fast and cheap.
    output_config: {
      effort: "low",
      format: betaZodOutputFormat(TranslationSchema),
    },
    // If a safety classifier declines, retry server-side on the recommended model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: TRANSLATION_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Translate these ${texts.length} strings:\n\n${JSON.stringify(texts)}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new TranslationError("The model declined to translate this text.");
  }
  const translations = response.parsed_output?.translations;
  if (!translations || translations.length !== texts.length) {
    throw new TranslationError("Unexpected translation response.");
  }
  return translations;
}
