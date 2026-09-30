import { describe, expect, it } from "vitest";
import {
  formatQuantity,
  pickMeasure,
  pluralCount,
  toFraction,
} from "./quantity";

describe("toFraction", () => {
  it.each([
    [0.5, "½"],
    [1.33, "1 ⅓"],
    [0.25, "¼"],
    [2, "2"],
    [2.97, "3"],
    [0.66, "⅔"],
    [1.125, "1 ⅛"],
    [3.01, "3"],
  ])("%d → %s", (value, expected) => {
    expect(toFraction(value)).toBe(expected);
  });
});

describe("pickMeasure", () => {
  const amount = {
    qtyMetric: 250,
    unitMetric: "g" as const,
    qtyUs: 1,
    unitUs: "cup" as const,
  };

  it("scales to the chosen servings", () => {
    expect(pickMeasure(amount, "metric", 8, 4)).toEqual({
      qty: 500,
      unit: "g",
    });
    expect(pickMeasure(amount, "us", 2, 4)).toEqual({ qty: 0.5, unit: "cup" });
  });

  it("falls back to the other system when one is missing", () => {
    const metricOnly = { ...amount, qtyUs: null, unitUs: null };
    expect(pickMeasure(metricOnly, "us", 4, 4)).toEqual({
      qty: 250,
      unit: "g",
    });
  });

  it("returns null for 'to taste'", () => {
    const toTaste = {
      qtyMetric: null,
      unitMetric: null,
      qtyUs: null,
      unitUs: null,
    };
    expect(pickMeasure(toTaste, "metric", 4, 4)).toBeNull();
  });
});

describe("formatQuantity", () => {
  it("uses the locale's decimal separator for metric", () => {
    expect(formatQuantity({ qty: 1.5, unit: "kg" }, "pt")).toBe("1,5");
    expect(formatQuantity({ qty: 1.5, unit: "kg" }, "en")).toBe("1.5");
  });

  it("rounds grams like a printed recipe", () => {
    expect(formatQuantity({ qty: 333.33, unit: "g" }, "pt")).toBe("335");
    expect(formatQuantity({ qty: 12.4, unit: "g" }, "pt")).toBe("12");
    expect(formatQuantity({ qty: 2.25, unit: "g" }, "en")).toBe("2.3");
  });

  it("uses fractions for cups and counts", () => {
    expect(formatQuantity({ qty: 0.75, unit: "cup" }, "en")).toBe("¾");
    expect(formatQuantity({ qty: 1.5, unit: "unit" }, "pt")).toBe("1 ½");
    expect(formatQuantity({ qty: 8.75, unit: "oz" }, "pt")).toBe("8 ¾");
  });
});

describe("pluralCount", () => {
  it("treats fractions up to one as singular", () => {
    expect(pluralCount(0.5)).toBe(1);
    expect(pluralCount(1)).toBe(1);
    expect(pluralCount(1.5)).toBe(2);
  });
});
