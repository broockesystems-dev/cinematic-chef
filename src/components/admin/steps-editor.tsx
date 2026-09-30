"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { saveSteps } from "@/lib/admin/actions/dishes";
import type { AdminStep } from "@/lib/admin/queries";
import { parseDecimal } from "@/lib/numbers";
import { I18nField, toI18nValue } from "./i18n-field";
import { ImageUpload } from "./image-upload";
import { EditorFooter } from "./editor-footer";
import { ListItemControls } from "./list-item-controls";
import { useListEditor } from "./use-list-editor";
import {
  fillMissingEnglish,
  useTranslator,
  type I18nValue,
} from "./use-translator";

type Row = {
  title: I18nValue;
  text: I18nValue;
  mediaUrl: string | null;
  timerMinutes: string;
  timerSeconds: string;
};

const EMPTY_ROW: Row = {
  title: { pt: "", en: "" },
  text: { pt: "", en: "" },
  mediaUrl: null,
  timerMinutes: "",
  timerSeconds: "",
};

function toTimerSeconds(minutes: string, seconds: string): number | null {
  const total =
    (parseDecimal(minutes) ?? 0) * 60 + (parseDecimal(seconds) ?? 0);
  return total > 0 ? Math.round(total) : null;
}

export function StepsEditor({
  dishId,
  steps,
}: {
  dishId: string;
  steps: AdminStep[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { translate, isTranslating } = useTranslator();
  const list = useListEditor<Row>(
    steps.map((s) => ({
      title: toI18nValue(s.title),
      text: toI18nValue(s.text),
      mediaUrl: s.media_url,
      timerMinutes: s.timer_seconds
        ? String(Math.floor(s.timer_seconds / 60))
        : "",
      timerSeconds: s.timer_seconds ? String(s.timer_seconds % 60) : "",
    })),
  );

  function save() {
    startTransition(async () => {
      const result = await saveSteps(
        dishId,
        list.items.map((row) => ({
          title: row.title,
          text: row.text,
          media_url: row.mediaUrl,
          timer_seconds: toTimerSeconds(row.timerMinutes, row.timerSeconds),
        })),
      );
      if (!result.ok) return void toast.error(result.error);
      list.markSaved();
      toast.success("Passos salvos.");
      router.refresh();
    });
  }

  function translateMissing() {
    fillMissingEnglish(
      list.items.flatMap((row) => [
        {
          value: row.title,
          set: (en: string) =>
            list.update(row.key, { title: { ...row.title, en } }),
        },
        {
          value: row.text,
          set: (en: string) =>
            list.update(row.key, { text: { ...row.text, en } }),
        },
      ]),
      translate,
    );
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-4">
        {list.items.map((row, index) => (
          <li key={row.key} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Passo {index + 1}
              </span>
              <ListItemControls
                label={`passo ${index + 1}`}
                isFirst={index === 0}
                isLast={index === list.items.length - 1}
                onMove={(offset) => list.move(row.key, offset)}
                onRemove={() => list.remove(row.key)}
              />
            </div>
            <I18nField
              label="Título"
              value={row.title}
              onChange={(title) => list.update(row.key, { title })}
              placeholder="ex: Massa"
            />
            <I18nField
              label="Instruções"
              value={row.text}
              onChange={(text) => list.update(row.key, { text })}
              multiline
              required
            />
            <div className="flex flex-wrap items-end gap-6">
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium">
                  Timer (opcional)
                </legend>
                <div className="flex items-center gap-2">
                  <Input
                    aria-label="Minutos"
                    inputMode="numeric"
                    className="w-20"
                    value={row.timerMinutes}
                    onChange={(e) =>
                      list.update(row.key, { timerMinutes: e.target.value })
                    }
                  />
                  <span className="text-sm text-muted-foreground">min</span>
                  <Input
                    aria-label="Segundos"
                    inputMode="numeric"
                    className="w-20"
                    value={row.timerSeconds}
                    onChange={(e) =>
                      list.update(row.key, { timerSeconds: e.target.value })
                    }
                  />
                  <span className="text-sm text-muted-foreground">s</span>
                </div>
              </fieldset>
              <ImageUpload
                label="Foto do passo"
                folder="steps"
                value={row.mediaUrl}
                onChange={(mediaUrl) => list.update(row.key, { mediaUrl })}
              />
            </div>
          </li>
        ))}
      </ol>
      <EditorFooter
        onAdd={() => list.add(EMPTY_ROW)}
        addLabel="Adicionar passo"
        onSave={save}
        onTranslate={translateMissing}
        isPending={isPending}
        isTranslating={isTranslating}
        isDirty={list.isDirty}
      />
    </div>
  );
}
