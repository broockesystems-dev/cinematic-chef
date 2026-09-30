/** Only allow same-origin relative paths, so `next=` can't redirect off-site. */
export function safeNextPath(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return fallback;
  }
  return value;
}
