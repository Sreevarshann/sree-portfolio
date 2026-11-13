/** ISO timestamp of the published build (see next.config.ts). */
export const SITE_UPDATED_AT = process.env.SITE_UPDATED_AT ?? "2026-11-13T12:00:00.000Z";

/** "November 2026": month and year only, in Boston time. */
export function formatUpdated(iso: string = SITE_UPDATED_AT) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "America/New_York" }).format(d);
}

/** "2026-11" in Boston time, for the <time dateTime> attribute. */
export function updatedMonthISO(iso: string = SITE_UPDATED_AT) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", timeZone: "America/New_York" }).formatToParts(d);
  return `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}`;
}
