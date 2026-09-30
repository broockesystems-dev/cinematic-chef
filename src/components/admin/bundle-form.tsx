"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { deleteBundle, saveBundle } from "@/lib/admin/actions/bundles";
import type { AdminDish } from "@/lib/admin/queries";
import type { Bundle } from "@/lib/bundles";
import { parseDecimal } from "@/lib/numbers";
import { slugify } from "@/lib/slug";
import { ConfirmDelete } from "./confirm-delete";
import { I18nField, toI18nValue } from "./i18n-field";
import { ImageUpload } from "./image-upload";
import { ListItemControls } from "./list-item-controls";
import { fillMissingEnglish, useTranslator } from "./use-translator";

type Props = { dishes: AdminDish[]; bundle?: Bundle };

/** "29,90" → 2990 minor units; empty → null. */
function toMinor(value: string): number | null {
  const parsed = parseDecimal(value);
  return parsed === null ? null : Math.round(parsed * 100);
}

export function BundleForm({ dishes, bundle }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { translate, isTranslating } = useTranslator();
  const [name, setName] = useState(toI18nValue(bundle?.name));
  const [slug, setSlug] = useState(bundle?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(bundle));
  const [description, setDescription] = useState(
    toI18nValue(bundle?.description),
  );
  const [coverUrl, setCoverUrl] = useState(bundle?.coverUrl ?? null);
  const [priceBrl, setPriceBrl] = useState(
    bundle ? String(bundle.priceBrl / 100) : "",
  );
  const [priceUsd, setPriceUsd] = useState(
    bundle ? String(bundle.priceUsd / 100) : "",
  );
  const [status, setStatus] = useState(bundle?.status ?? "draft");
  const [dishIds, setDishIds] = useState<string[]>(bundle?.dishIds ?? []);
  const [picker, setPicker] = useState("");

  const byId = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const available = dishes.filter((d) => !dishIds.includes(d.id));

  function move(index: number, offset: -1 | 1) {
    setDishIds((ids) => {
      const next = [...ids];
      const to = index + offset;
      if (to < 0 || to >= next.length) return ids;
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveBundle(bundle?.id ?? null, {
        slug,
        name,
        description,
        cover_url: coverUrl,
        price_brl: toMinor(priceBrl) as number,
        price_usd: toMinor(priceUsd) as number,
        status,
        dish_ids: dishIds,
      });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Roteiro salvo.");
      if (bundle) router.refresh();
      else router.push(`/admin/bundles/${result.data.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="max-w-4xl space-y-6">
      <I18nField
        label="Nome"
        value={name}
        onChange={(value) => {
          setName(value);
          if (!slugTouched) setSlug(slugify(value.pt));
        }}
        required
      />
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price-brl">Preço (R$)</Label>
          <Input
            id="price-brl"
            inputMode="decimal"
            value={priceBrl}
            onChange={(e) => setPriceBrl(e.target.value)}
            placeholder="29,90"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price-usd">Preço (US$)</Label>
          <Input
            id="price-usd"
            inputMode="decimal"
            value={priceUsd}
            onChange={(e) => setPriceUsd(e.target.value)}
            placeholder="9.00"
            required
          />
        </div>
      </div>
      <I18nField
        label="Descrição"
        value={description}
        onChange={setDescription}
        multiline
        rows={4}
      />
      <ImageUpload
        label="Capa"
        folder="bundles"
        value={coverUrl}
        onChange={setCoverUrl}
      />

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">
          Pratos do roteiro (recomendado: 5 a 7)
        </legend>
        <ol className="space-y-2">
          {dishIds.map((id, index) => (
            <li
              key={id}
              className="flex items-center gap-3 rounded-md border px-3 py-2"
            >
              <span className="w-5 text-sm text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <span className="flex-1">{byId.get(id)?.name.pt ?? id}</span>
              <ListItemControls
                label={byId.get(id)?.name.pt ?? "prato"}
                isFirst={index === 0}
                isLast={index === dishIds.length - 1}
                onMove={(offset) => move(index, offset)}
                onRemove={() =>
                  setDishIds((ids) => ids.filter((x) => x !== id))
                }
              />
            </li>
          ))}
        </ol>
        <div className="flex max-w-md gap-2">
          <NativeSelect
            aria-label="Adicionar prato"
            value={picker}
            onChange={(e) => setPicker(e.target.value)}
          >
            <option value="">Adicionar prato…</option>
            {available.map((dish) => (
              <option key={dish.id} value={dish.id}>
                {dish.name.pt}
                {dish.status === "draft" ? " (rascunho)" : ""}
              </option>
            ))}
          </NativeSelect>
          <Button
            type="button"
            variant="outline"
            disabled={!picker}
            onClick={() => {
              setDishIds((ids) => [...ids, picker]);
              setPicker("");
            }}
          >
            Adicionar
          </Button>
        </div>
      </fieldset>

      <div className="max-w-xs space-y-2">
        <Label htmlFor="status">Status</Label>
        <NativeSelect
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          <option value="draft">Rascunho</option>
          <option value="published">Publicado</option>
        </NativeSelect>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t pt-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isTranslating}
          onClick={() =>
            fillMissingEnglish(
              [
                { value: name, set: (en) => setName((v) => ({ ...v, en })) },
                {
                  value: description,
                  set: (en) => setDescription((v) => ({ ...v, en })),
                },
              ],
              translate,
            )
          }
        >
          Traduzir campos vazios
        </Button>
        {bundle && (
          <div className="ml-auto">
            <ConfirmDelete
              title="Apagar este roteiro?"
              description="Roteiros já vendidos não podem ser apagados; nesse caso, despublique."
              onConfirm={async () => {
                const result = await deleteBundle(bundle.id);
                if (!result.ok) return void toast.error(result.error);
                router.push("/admin/bundles");
              }}
            />
          </div>
        )}
      </div>
    </form>
  );
}
