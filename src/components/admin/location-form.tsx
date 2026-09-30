"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteLocation, saveLocation } from "@/lib/admin/actions/locations";
import {
  flattenTree,
  LOCATION_TYPES,
  parentTypeOf,
  type LocationRow,
  type LocationType,
} from "@/lib/locations";
import { parseDecimal } from "@/lib/numbers";
import { slugify } from "@/lib/slug";
import { ConfirmDelete } from "./confirm-delete";
import { I18nField, toI18nValue } from "./i18n-field";
import { LOCATION_TYPE_LABELS } from "./labels";
import { NativeSelect } from "./native-select";
import { fillMissingEnglish, useTranslator } from "./use-translator";

type Props = {
  locations: LocationRow[];
  location?: LocationRow;
  /** Pre-selected parent when creating a child ("Adicionar cidade"). */
  parent?: LocationRow | null;
};

const CHILD_TYPE: Partial<Record<LocationType, LocationType>> = {
  continent: "country",
  country: "city",
  city: "neighborhood",
};

export function LocationForm({ locations, location, parent }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { translate, isTranslating } = useTranslator();

  const [type, setType] = useState<LocationType>(
    location?.type ??
      (parent ? (CHILD_TYPE[parent.type] ?? "continent") : "continent"),
  );
  const [parentId, setParentId] = useState(
    location?.parent_id ?? parent?.id ?? "",
  );
  const [name, setName] = useState(toI18nValue(location?.name));
  const [slug, setSlug] = useState(location?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(location));
  const [lat, setLat] = useState(location ? String(location.lat) : "");
  const [lng, setLng] = useState(location ? String(location.lng) : "");
  const [isoCode, setIsoCode] = useState(location?.iso_code ?? "");

  const expectedParentType = parentTypeOf(type);
  const parentOptions = useMemo(
    () =>
      flattenTree(locations).filter(
        ({ location: l }) =>
          l.type === expectedParentType && l.id !== location?.id,
      ),
    [locations, expectedParentType, location?.id],
  );

  function updateName(value: typeof name) {
    setName(value);
    if (!slugTouched) setSlug(slugify(value.en || value.pt));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveLocation(location?.id ?? null, {
        type,
        parent_id: expectedParentType ? parentId || null : null,
        name,
        slug,
        // Zod rejects null, so an empty field fails validation instead of becoming 0.
        lat: parseDecimal(lat) as number,
        lng: parseDecimal(lng) as number,
        iso_code: type === "country" ? isoCode || null : null,
      });
      if (!result.ok) return void toast.error(result.error);
      toast.success("Lugar salvo.");
      if (location) router.refresh();
      else router.push(`/admin/locations/${result.data.id}`);
    });
  }

  const childType = CHILD_TYPE[type];

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Tipo</Label>
          <NativeSelect
            id="type"
            value={type}
            onChange={(e) => {
              setType(e.target.value as LocationType);
              setParentId("");
            }}
          >
            {LOCATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {LOCATION_TYPE_LABELS[t]}
              </option>
            ))}
          </NativeSelect>
        </div>
        {expectedParentType && (
          <div className="space-y-2">
            <Label htmlFor="parent">
              {LOCATION_TYPE_LABELS[expectedParentType]}
            </Label>
            <NativeSelect
              id="parent"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              required
            >
              <option value="">Selecione…</option>
              {parentOptions.map(({ location: l }) => (
                <option key={l.id} value={l.id}>
                  {l.name.pt}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
      </div>

      <I18nField label="Nome" value={name} onChange={updateName} required />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="slug">Slug (usado na URL)</Label>
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
        {type === "country" && (
          <div className="space-y-2">
            <Label htmlFor="iso">Código ISO do país</Label>
            <Input
              id="iso"
              value={isoCode}
              onChange={(e) => setIsoCode(e.target.value.toUpperCase())}
              maxLength={2}
              placeholder="IT"
              required
            />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input
            id="lat"
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="40.8518"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input
            id="lng"
            inputMode="decimal"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="14.2681"
            required
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Dica: no Google Maps, clique com o botão direito no lugar para copiar as
        coordenadas.
      </p>

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
              [{ value: name, set: (en) => setName((v) => ({ ...v, en })) }],
              translate,
            )
          }
        >
          Traduzir campos vazios
        </Button>
        {location && childType && (
          <Button asChild variant="ghost">
            <Link href={`/admin/locations/new?parent=${location.id}`}>
              Adicionar {LOCATION_TYPE_LABELS[childType].toLowerCase()}
            </Link>
          </Button>
        )}
        {location && (
          <div className="ml-auto">
            <ConfirmDelete
              title={`Apagar ${location.name.pt}?`}
              description="Só é possível apagar lugares sem sub-lugares e sem pratos."
              onConfirm={async () => {
                const result = await deleteLocation(location.id);
                if (!result.ok) return void toast.error(result.error);
                toast.success("Lugar apagado.");
                router.push("/admin/locations");
              }}
            />
          </div>
        )}
      </div>
    </form>
  );
}
