// PT labels for the admin panel (internal tool, Portuguese only).
import type { MeasureUnit } from "@/lib/admin/schemas";
import type { LocationType } from "@/lib/locations";

export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  continent: "Continente",
  country: "País",
  city: "Cidade",
  neighborhood: "Bairro",
};

export const DIFFICULTY_LABELS = {
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
} as const;
export const ACCESS_LABELS = { free: "Grátis", premium: "Assinantes" } as const;

export const UNIT_LABELS: Record<MeasureUnit, string> = {
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",
  unit: "unidade",
  clove: "dente",
  slice: "fatia",
  bunch: "maço",
  pinch: "pitada",
  tsp: "colher (chá) · tsp",
  tbsp: "colher (sopa) · tbsp",
  cup: "xícara · cup",
  oz: "oz",
  lb: "lb",
  fl_oz: "fl oz",
};
