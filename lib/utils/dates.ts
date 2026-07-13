// Date/number parsing helpers, ported from the legacy PIP app.

export const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

export const TODAY_STR = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})();

/** Normalizes JS Date objects, Excel serial dates, and date strings to "YYYY-MM-DD". */
export function stripTime(v: unknown): string {
  if (v == null || v === "") return "";
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof v === "number" && v >= 36526 && v <= 73050) {
    const date = new Date(Math.round((v - 25569) * 86400000));
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const s = String(v).trim();
  if (!s) return "";
  const part = s.split(/[ T]/)[0];
  return part;
}

export function daysDiff(dateStr: string, from: Date = TODAY): number {
  if (!dateStr) return NaN;
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return NaN;
  return Math.round((d.getTime() - from.getTime()) / 86400000);
}

/** Positive when the date is in the past (i.e. late by N days). */
export function daysLate(dateStr: string, from: Date = TODAY): number | null {
  const d = daysDiff(dateStr, from);
  return Number.isNaN(d) ? null : -d;
}

/** Parses European comma-decimal numbers, e.g. "1,5" -> 1.5. */
export function parseEuFloat(v: unknown): number {
  if (typeof v === "number") return v;
  if (v == null || v === "") return 0;
  const n = parseFloat(String(v).replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

/** Normalizes item numbers that may arrive as floats, e.g. "123.0" -> "123". */
export function toItemNum(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim();
  if (/^\d+\.0+$/.test(s)) return s.split(".")[0];
  return s;
}

export function threeDaysAgo(): Date {
  const d = new Date(TODAY);
  let count = 0;
  while (count < 3) {
    d.setDate(d.getDate() - 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
  }
  return d;
}

export function formatDateHuman(dateStr: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
