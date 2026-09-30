/** Parses user-typed decimals, accepting the Brazilian comma. Empty → null. */
export function parseDecimal(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatDecimal(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}
