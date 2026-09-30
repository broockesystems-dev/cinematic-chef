"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

/** Calls the server-side PT→EN translation route. Returns null on failure. */
export function useTranslator() {
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = useCallback(
    async (texts: string[]): Promise<string[] | null> => {
      if (texts.length === 0) return [];
      setIsTranslating(true);
      try {
        const response = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texts }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          toast.error(body.error ?? "Falha ao traduzir.");
          return null;
        }
        return body.translations as string[];
      } catch {
        toast.error("Sem conexão com o servidor.");
        return null;
      } finally {
        setIsTranslating(false);
      }
    },
    [],
  );

  return { translate, isTranslating };
}

export type I18nValue = { pt: string; en: string };

/**
 * Translates every field whose PT is filled and EN is empty, so reviewed
 * translations are never overwritten. Returns how many fields were filled.
 */
export async function fillMissingEnglish(
  fields: Array<{ value: I18nValue; set: (en: string) => void }>,
  translate: (texts: string[]) => Promise<string[] | null>,
): Promise<number> {
  const pending = fields.filter((f) => f.value.pt.trim() && !f.value.en.trim());
  if (pending.length === 0) {
    toast.info("Todos os campos em inglês já estão preenchidos.");
    return 0;
  }
  const translations = await translate(pending.map((f) => f.value.pt));
  if (!translations) return 0;
  pending.forEach((field, i) => field.set(translations[i]));
  toast.success(
    `${pending.length} campo(s) traduzido(s). Revise antes de salvar.`,
  );
  return pending.length;
}
