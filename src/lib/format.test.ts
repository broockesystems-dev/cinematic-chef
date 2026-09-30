import { describe, expect, it } from "vitest";
import { formatClock, formatMinutes } from "./format";

describe("formatMinutes", () => {
  it.each([
    [45, "45 min"],
    [60, "1 h"],
    [90, "1 h 30 min"],
    [300, "5 h"],
  ])("%d → %s", (value, expected) =>
    expect(formatMinutes(value)).toBe(expected),
  );
});

describe("formatClock", () => {
  it.each([
    [0, "0:00"],
    [245, "4:05"],
    [3723, "1:02:03"],
    [59.2, "1:00"],
  ])("%d → %s", (value, expected) => expect(formatClock(value)).toBe(expected));
});
