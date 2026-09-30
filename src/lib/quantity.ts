import type { MeasureUnit } from "@/lib/admin/schemas";

export type UnitSystem = "metric" | "us";

export type IngredientAmount = {
  qtyMetric: number | null;
  unitMetric: MeasureUnit | null;
  qtyUs: number | null;
  unitUs: MeasureUnit | null;
};

export type Measure = { qty: number; unit: MeasureUnit | null };

/**
 * The measure to show in the chosen system, scaled to `servings`. Falls back
 * to the other system when one is missing; null means "to taste".
 */
export function pickMeasure(
  amount: IngredientAmount,
  system: UnitSystem,
  servings: number,
  baseServings: number,
): Measure | null {
  const metric =
    amount.qtyMetric != null
      ? { qty: amount.qtyMetric, unit: amount.unitMetric }
      : null;
  const us =
    amount.qtyUs != null ? { qty: amount.qtyUs, unit: amount.unitUs } : null;
  const measure = system === "us" ? (us ?? metric) : (metric ?? us);
  if (!measure) return null;
  return { ...measure, qty: (measure.qty * servings) / baseServings };
}

// Metric weights and volumes print as decimals ("1,5 kg"); everything else
// reads as kitchen fractions ("½ cup", "8 ¾ oz", "1 ⅓ eggs").
const DECIMAL_UNITS = new Set<MeasureUnit | null>(["g", "kg", "ml", "l"]);

const FRACTION_GLYPHS: Record<string, string> = {
  "1/8": "⅛",
  "1/4": "¼",
  "1/3": "⅓",
  "3/8": "⅜",
  "1/2": "½",
  "5/8": "⅝",
  "2/3": "⅔",
  "3/4": "¾",
  "7/8": "⅞",
};

/** Nearest common kitchen fraction, e.g. 1.33 → "1 ⅓", 0.5 → "½". */
export function toFraction(value: number): string {
  const whole = Math.floor(value);
  const rest = value - whole;
  let best = { text: "", error: rest };
  for (const denominator of [2, 3, 4, 8]) {
    for (let numerator = 1; numerator < denominator; numerator++) {
      const error = Math.abs(rest - numerator / denominator);
      const glyph = FRACTION_GLYPHS[`${numerator}/${denominator}`];
      if (glyph && error < best.error - 1e-9) best = { text: glyph, error };
    }
  }
  // Closer to the next whole number than to any fraction.
  if (1 - rest < best.error) return String(whole + 1);
  if (!best.text) return String(whole);
  return whole > 0 ? `${whole} ${best.text}` : best.text;
}

/** Rounds metric weights/volumes the way a recipe would print them. */
function roundMetric(qty: number, unit: MeasureUnit | null): number {
  if (unit === "g" || unit === "ml") {
    if (qty >= 100) return Math.round(qty / 5) * 5;
    if (qty >= 10) return Math.round(qty);
    return Math.round(qty * 10) / 10;
  }
  return Math.round(qty * 100) / 100;
}

export function formatQuantity(measure: Measure, locale: string): string {
  if (!DECIMAL_UNITS.has(measure.unit)) return toFraction(measure.qty);
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(
    roundMetric(measure.qty, measure.unit),
  );
}

/** Count used to pick singular/plural unit labels ("½ cup", "2 cups"). */
export function pluralCount(qty: number): number {
  return qty <= 1 ? 1 : Math.ceil(qty);
}

export function defaultUnitSystem(locale: string): UnitSystem {
  return locale === "en" ? "us" : "metric";
}
