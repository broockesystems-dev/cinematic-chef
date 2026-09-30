// The admin schedules publications in Brasília time. A fixed zone renders the
// same value on the server and in the browser (no hydration mismatch) and
// doesn't depend on where the admin happens to be.
export const ADMIN_TIME_ZONE = "America/Sao_Paulo";

/** Offset such as "-03:00" for `zone` at the given instant. */
function zoneOffset(date: Date, zone: string): string {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "longOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")?.value;
  const offset = name?.replace("GMT", "") ?? "";
  return offset === "" ? "+00:00" : offset;
}

/** ISO timestamp → <input type="datetime-local"> value in Brasília time. */
export function toLocalInput(
  iso: string | null,
  zone = ADMIN_TIME_ZONE,
): string {
  if (!iso) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

/** <input type="datetime-local"> value in Brasília time → ISO timestamp. */
export function fromLocalInput(
  value: string,
  zone = ADMIN_TIME_ZONE,
): string | null {
  if (!value) return null;
  // Resolve the offset at (approximately) that wall time, then apply it.
  const offset = zoneOffset(new Date(`${value}:00Z`), zone);
  return new Date(`${value}:00${offset}`).toISOString();
}
