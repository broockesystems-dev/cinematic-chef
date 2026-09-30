"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { savePollOptions } from "@/lib/admin/actions/polls";
import type { LocationRow } from "@/lib/locations";
import { flattenTree } from "@/lib/locations";
import type { Poll } from "@/lib/polls";
import { EditorFooter } from "./editor-footer";
import { I18nField, toI18nValue } from "./i18n-field";
import { ImageUpload } from "./image-upload";
import { ListItemControls } from "./list-item-controls";
import { useListEditor } from "./use-list-editor";
import {
  fillMissingEnglish,
  useTranslator,
  type I18nValue,
} from "./use-translator";

type Row = {
  dishName: I18nValue;
  description: I18nValue;
  locationId: string;
  imageUrl: string | null;
};
const EMPTY: Row = {
  dishName: { pt: "", en: "" },
  description: { pt: "", en: "" },
  locationId: "",
  imageUrl: null,
};

export function PollOptionsEditor({
  poll,
  locations,
}: {
  poll: Poll;
  locations: LocationRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { translate, isTranslating } = useTranslator();
  const editable = poll.status === "draft";
  const list = useListEditor<Row>(
    poll.options.map((o) => ({
      dishName: toI18nValue(o.dishName),
      description: toI18nValue(o.description),
      locationId: o.locationId ?? "",
      imageUrl: o.imageUrl,
    })),
  );
  const places = flattenTree(locations).filter(
    ({ location }) => location.type !== "continent",
  );

  function save() {
    startTransition(async () => {
      const result = await savePollOptions(
        poll.id,
        list.items.map((row) => ({
          dish_name: row.dishName,
          description: row.description,
          location_id: row.locationId || null,
          image_url: row.imageUrl,
        })),
      );
      if (!result.ok) return void toast.error(result.error);
      list.markSaved();
      toast.success("Opções salvas.");
      router.refresh();
    });
  }

  if (!editable) {
    return (
      <p className="text-sm text-muted-foreground">
        As opções ficam travadas depois que a votação sai do rascunho, para não
        perder votos.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-4">
        {list.items.map((row, index) => (
          <li key={row.key} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Opção {index + 1}
              </span>
              <ListItemControls
                label={`opção ${index + 1}`}
                isFirst={index === 0}
                isLast={index === list.items.length - 1}
                onMove={(offset) => list.move(row.key, offset)}
                onRemove={() => list.remove(row.key)}
              />
            </div>
            <I18nField
              label="Prato"
              value={row.dishName}
              onChange={(dishName) => list.update(row.key, { dishName })}
              required
            />
            <I18nField
              label="Descrição"
              value={row.description}
              onChange={(description) => list.update(row.key, { description })}
              multiline
              rows={2}
            />
            <div className="flex flex-wrap items-end gap-6">
              <div className="min-w-56 space-y-2">
                <Label htmlFor={`place-${row.key}`}>Lugar (opcional)</Label>
                <NativeSelect
                  id={`place-${row.key}`}
                  value={row.locationId}
                  onChange={(e) =>
                    list.update(row.key, { locationId: e.target.value })
                  }
                >
                  <option value="">—</option>
                  {places.map(({ location }) => (
                    <option key={location.id} value={location.id}>
                      {location.name.pt}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <ImageUpload
                label="Imagem"
                folder="polls"
                value={row.imageUrl}
                onChange={(imageUrl) => list.update(row.key, { imageUrl })}
              />
            </div>
          </li>
        ))}
      </ol>
      <EditorFooter
        onAdd={() => list.add(EMPTY)}
        addLabel="Adicionar opção"
        onSave={save}
        onTranslate={() =>
          fillMissingEnglish(
            list.items.flatMap((row) => [
              {
                value: row.dishName,
                set: (en: string) =>
                  list.update(row.key, { dishName: { ...row.dishName, en } }),
              },
              {
                value: row.description,
                set: (en: string) =>
                  list.update(row.key, {
                    description: { ...row.description, en },
                  }),
              },
            ]),
            translate,
          )
        }
        isPending={isPending}
        isTranslating={isTranslating}
        isDirty={list.isDirty}
      />
    </div>
  );
}
