"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { saveIngredients } from "@/lib/admin/actions/dishes";
import type { AdminIngredient } from "@/lib/admin/queries";
import { MEASURE_UNITS, type MeasureUnit } from "@/lib/admin/schemas";
import { formatDecimal, parseDecimal } from "@/lib/numbers";
import { EditorFooter } from "./editor-footer";
import { I18nField, toI18nValue } from "./i18n-field";
import { UNIT_LABELS } from "./labels";
import { ListItemControls } from "./list-item-controls";
import { NativeSelect } from "./native-select";
import { useListEditor } from "./use-list-editor";
import {
  fillMissingEnglish,
  useTranslator,
  type I18nValue,
} from "./use-translator";

type Row = {
  name: I18nValue;
  note: I18nValue;
  qtyMetric: string;
  unitMetric: MeasureUnit | "";
  qtyUs: string;
  unitUs: MeasureUnit | "";
};

const EMPTY_ROW: Row = {
  name: { pt: "", en: "" },
  note: { pt: "", en: "" },
  qtyMetric: "",
  unitMetric: "g",
  qtyUs: "",
  unitUs: "cup",
};

export function IngredientsEditor({
  dishId,
  ingredients,
}: {
  dishId: string;
  ingredients: AdminIngredient[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { translate, isTranslating } = useTranslator();
  const list = useListEditor<Row>(
    ingredients.map((i) => ({
      name: toI18nValue(i.name),
      note: toI18nValue(i.note),
      qtyMetric: formatDecimal(i.qty_metric),
      unitMetric: (i.unit_metric as MeasureUnit | null) ?? "",
      qtyUs: formatDecimal(i.qty_us),
      unitUs: (i.unit_us as MeasureUnit | null) ?? "",
    })),
  );

  function save() {
    startTransition(async () => {
      const result = await saveIngredients(
        dishId,
        list.items.map((row) => ({
          name: row.name,
          note: row.note,
          qty_metric: parseDecimal(row.qtyMetric),
          unit_metric: row.unitMetric || null,
          qty_us: parseDecimal(row.qtyUs),
          unit_us: row.unitUs || null,
        })),
      );
      if (!result.ok) return void toast.error(result.error);
      list.markSaved();
      toast.success("Ingredientes salvos.");
      router.refresh();
    });
  }

  function translateMissing() {
    fillMissingEnglish(
      list.items.flatMap((row) => [
        {
          value: row.name,
          set: (en: string) =>
            list.update(row.key, { name: { ...row.name, en } }),
        },
        {
          value: row.note,
          set: (en: string) =>
            list.update(row.key, { note: { ...row.note, en } }),
        },
      ]),
      translate,
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Deixe a quantidade vazia para &ldquo;a gosto&rdquo;. As medidas
        americanas aparecem para quem escolhe esse sistema.
      </p>
      <ol className="space-y-4">
        {list.items.map((row, index) => (
          <li key={row.key} className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Ingrediente {index + 1}
              </span>
              <ListItemControls
                label={`ingrediente ${index + 1}`}
                isFirst={index === 0}
                isLast={index === list.items.length - 1}
                onMove={(offset) => list.move(row.key, offset)}
                onRemove={() => list.remove(row.key)}
              />
            </div>
            <I18nField
              label="Nome"
              value={row.name}
              onChange={(name) => list.update(row.key, { name })}
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <QuantityInput
                label="Métrico"
                qty={row.qtyMetric}
                unit={row.unitMetric}
                onChange={(qtyMetric, unitMetric) =>
                  list.update(row.key, { qtyMetric, unitMetric })
                }
              />
              <QuantityInput
                label="Americano"
                qty={row.qtyUs}
                unit={row.unitUs}
                onChange={(qtyUs, unitUs) =>
                  list.update(row.key, { qtyUs, unitUs })
                }
              />
            </div>
            <I18nField
              label="Observação"
              value={row.note}
              onChange={(note) => list.update(row.key, { note })}
              placeholder="ex: bem escorrida"
            />
          </li>
        ))}
      </ol>
      <EditorFooter
        onAdd={() => list.add(EMPTY_ROW)}
        addLabel="Adicionar ingrediente"
        onSave={save}
        onTranslate={translateMissing}
        isPending={isPending}
        isTranslating={isTranslating}
        isDirty={list.isDirty}
      />
    </div>
  );
}

function QuantityInput({
  label,
  qty,
  unit,
  onChange,
}: {
  label: string;
  qty: string;
  unit: MeasureUnit | "";
  onChange: (qty: string, unit: MeasureUnit | "") => void;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-xs text-muted-foreground">{label}</legend>
      <div className="flex gap-2">
        <Input
          aria-label={`Quantidade (${label})`}
          inputMode="decimal"
          className="w-24"
          value={qty}
          onChange={(e) => onChange(e.target.value, unit)}
        />
        <NativeSelect
          aria-label={`Unidade (${label})`}
          value={unit}
          onChange={(e) => onChange(qty, e.target.value as MeasureUnit | "")}
        >
          <option value="">—</option>
          {MEASURE_UNITS.map((u) => (
            <option key={u} value={u}>
              {UNIT_LABELS[u]}
            </option>
          ))}
        </NativeSelect>
      </div>
    </fieldset>
  );
}
