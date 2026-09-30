"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteDish, saveDish } from "@/lib/admin/actions/dishes";
import type { AdminDish } from "@/lib/admin/queries";
import { fromLocalInput, toLocalInput } from "@/lib/datetime";
import {
  flattenTree,
  indexById,
  pathOf,
  type LocationRow,
} from "@/lib/locations";
import { parseDecimal } from "@/lib/numbers";
import { slugify } from "@/lib/slug";
import { ConfirmDelete } from "./confirm-delete";
import { I18nField, toI18nValue } from "./i18n-field";
import { ImageUpload } from "./image-upload";
import { ACCESS_LABELS, DIFFICULTY_LABELS } from "./labels";
import { NativeSelect } from "@/components/ui/native-select";
import { fillMissingEnglish, useTranslator } from "./use-translator";

type Props = { locations: LocationRow[]; dish?: AdminDish };

export function DishForm({ locations, dish }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { translate, isTranslating } = useTranslator();

  const [locationId, setLocationId] = useState(dish?.location_id ?? "");
  const [name, setName] = useState(toI18nValue(dish?.name));
  const [slug, setSlug] = useState(dish?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(dish));
  const [story, setStory] = useState(toI18nValue(dish?.story));
  const [coverUrl, setCoverUrl] = useState(dish?.cover_url ?? null);
  const [prepMinutes, setPrepMinutes] = useState(
    dish?.prep_minutes?.toString() ?? "",
  );
  const [difficulty, setDifficulty] = useState(dish?.difficulty ?? "medium");
  const [servings, setServings] = useState(
    dish?.base_servings.toString() ?? "4",
  );
  const [access, setAccess] = useState(dish?.access ?? "premium");
  const [status, setStatus] = useState(dish?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(
    toLocalInput(dish?.published_at ?? null),
  );

  const locationOptions = useMemo(() => {
    const byId = indexById(locations);
    return flattenTree(locations)
      .filter(({ location }) => location.type !== "continent")
      .map(({ location }) => ({
        id: location.id,
        label: pathOf(location.id, byId)
          .slice(1)
          .map((l) => l.name.pt)
          .join(" › "),
      }));
  }, [locations]);

  function updateName(value: typeof name) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value.pt));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveDish(dish?.id ?? null, {
        location_id: locationId,
        slug,
        name,
        story,
        cover_url: coverUrl,
        prep_minutes: parseDecimal(prepMinutes),
        difficulty,
        base_servings: parseDecimal(servings) as number,
        access,
        status,
        published_at: fromLocalInput(publishedAt),
      });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Prato salvo.");
      if (dish) router.refresh();
      else router.push(`/admin/dishes/${result.data.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="max-w-4xl space-y-6">
      <I18nField label="Nome" value={name} onChange={updateName} required />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="location">Lugar</Label>
          <NativeSelect
            id="location"
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            required
          >
            <option value="">Selecione…</option>
            {locationOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL do prato)</Label>
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
      </div>

      <I18nField
        label="História"
        value={story}
        onChange={setStory}
        multiline
        rows={6}
      />

      <ImageUpload
        label="Capa"
        folder="covers"
        value={coverUrl}
        onChange={setCoverUrl}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="prep">Tempo total (min)</Label>
          <Input
            id="prep"
            inputMode="numeric"
            value={prepMinutes}
            onChange={(e) => setPrepMinutes(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="servings">Porções da receita</Label>
          <Input
            id="servings"
            inputMode="numeric"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Dificuldade</Label>
          <NativeSelect
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
          >
            {Object.entries(DIFFICULTY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>

      <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="access">Acesso</Label>
          <NativeSelect
            id="access"
            value={access}
            onChange={(e) => setAccess(e.target.value as typeof access)}
          >
            {Object.entries(ACCESS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
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
        <div className="space-y-2">
          <Label htmlFor="published-at">Publicar em</Label>
          <Input
            id="published-at"
            type="datetime-local"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            aria-describedby="published-at-hint"
          />
          <p id="published-at-hint" className="text-xs text-muted-foreground">
            Horário de Brasília. Vazio = agora; data futura agenda a publicação.
          </p>
        </div>
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
                { value: story, set: (en) => setStory((v) => ({ ...v, en })) },
              ],
              translate,
            )
          }
        >
          Traduzir campos vazios
        </Button>
        {dish && (
          <div className="ml-auto">
            <ConfirmDelete
              title={`Apagar ${dish.name.pt}?`}
              description="Apaga o prato com ingredientes, passos e vídeos. Não dá para desfazer."
              onConfirm={async () => {
                const result = await deleteDish(dish.id);
                if (!result.ok) return void toast.error(result.error);
                toast.success("Prato apagado.");
                router.push("/admin/dishes");
              }}
            />
          </div>
        )}
      </div>
    </form>
  );
}
