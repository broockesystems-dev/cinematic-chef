import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";

const UNITS = [
  "g",
  "kg",
  "ml",
  "l",
  "unit",
  "clove",
  "slice",
  "bunch",
  "pinch",
  "tsp",
  "tbsp",
  "cup",
  "oz",
  "lb",
  "fl_oz",
] as const;
export type MeasureUnit = (typeof UNITS)[number];

/** Required bilingual text: PT mandatory, empty EN dropped. */
export const i18nText = (max = 200) =>
  z
    .object({
      pt: z.string().trim().min(1, "Preencha o texto em português").max(max),
      en: z.string().trim().max(max).optional(),
    })
    .transform(({ pt, en }) => (en ? { pt, en } : { pt }));

/** Optional bilingual text: null when both languages are empty. */
export const optionalI18nText = (max = 200) =>
  z
    .object({
      pt: z.string().trim().max(max),
      en: z.string().trim().max(max).optional(),
    })
    .transform(({ pt, en }) => {
      if (!pt && !en) return null;
      return en ? { pt, en } : { pt };
    });

const slug = z
  .string()
  .trim()
  .regex(SLUG_PATTERN, "Use só letras minúsculas, números e hífens");

export const LocationSchema = z
  .object({
    type: z.enum(["continent", "country", "city", "neighborhood"]),
    parent_id: z.guid().nullable(),
    name: i18nText(120),
    slug,
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    iso_code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z]{2}$/, "Código ISO de 2 letras (ex: IT)")
      .nullable(),
  })
  .transform((value) => ({
    ...value,
    iso_code: value.type === "country" ? value.iso_code : null,
  }));
export type LocationInput = z.input<typeof LocationSchema>;

export const DishSchema = z
  .object({
    location_id: z.guid("Escolha um lugar"),
    slug,
    name: i18nText(120),
    story: optionalI18nText(5000),
    cover_url: z.url().nullable(),
    prep_minutes: z.number().int().positive().max(10080).nullable(),
    difficulty: z.enum(["easy", "medium", "hard"]),
    base_servings: z.number().int().positive().max(100),
    access: z.enum(["free", "premium"]),
    status: z.enum(["draft", "published"]),
    published_at: z.iso.datetime().nullable(),
  })
  .transform((value) => ({
    ...value,
    story: value.story ?? { pt: "" },
    // Publishing without a date means "now".
    published_at:
      value.status === "published"
        ? (value.published_at ?? new Date().toISOString())
        : value.published_at,
  }));
export type DishInput = z.input<typeof DishSchema>;

const quantity = z.number().positive().max(100000).nullable();

export const IngredientSchema = z.object({
  name: i18nText(160),
  qty_metric: quantity,
  unit_metric: z.enum(UNITS).nullable(),
  qty_us: quantity,
  unit_us: z.enum(UNITS).nullable(),
  note: optionalI18nText(200),
});
export const IngredientListSchema = z.array(IngredientSchema).max(80);
export type IngredientInput = z.input<typeof IngredientSchema>;

export const StepSchema = z.object({
  title: optionalI18nText(120),
  text: i18nText(2000),
  media_url: z.url().nullable(),
  timer_seconds: z.number().int().positive().max(86400).nullable(),
});
export const StepListSchema = z.array(StepSchema).max(60);
export type StepInput = z.input<typeof StepSchema>;

export const MEASURE_UNITS = UNITS;
