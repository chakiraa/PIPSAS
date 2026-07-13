import type { PmsRow } from "@/types";
import { parseEuFloat } from "@/lib/utils/dates";

// Canonical map: normalize whatever Infor LN emits to our button labels.
// Handles casing variants and known truncated export forms.
const SIGNAL_MAP: Record<string, string> = {
  release: "Release",
  "delayed release": "Delayed Release",
  "delayed rele": "Delayed Release",
  "delayed rel": "Delayed Release",
  "prio release too late": "Prio Release too Late",
  "prio release toolate": "Prio Release too Late",
  "prio release too lat": "Prio Release too Late",
  "prio rel too late": "Prio Release too Late",
  cancel: "Cancel",
  accelerate: "Accelerate",
  delay: "Delay",
};

function normalizeSignal(raw: string): string {
  const key = raw.toLowerCase().replace(/\s+/g, " ").trim();
  if (SIGNAL_MAP[key]) return SIGNAL_MAP[key];
  for (const [k, v] of Object.entries(SIGNAL_MAP)) {
    if (k.startsWith(key) || key.startsWith(k)) return v;
  }
  return raw.trim();
}

/** Ported 1:1 from legacy parsePMS. Source is semicolon-delimited CSV text, not XLSX. */
export function parsePMS(text: string): PmsRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const rows: PmsRow[] = [];
  for (let i = 2; i < lines.length; i++) {
    const f = lines[i].split(";");
    if (f.length < 18) continue;
    const rawSignal = (f[17] || "").trim();
    if (!rawSignal) continue;
    const signal = normalizeSignal(rawSignal);
    const itemNumber = (f[7] || "").trim();
    if (!itemNumber) continue;
    const supplier = (f[6] || "").trim() || (f[4] || "").trim();
    const supplierNum = (f[5] || "").trim() || (f[3] || "").trim();
    rows.push({
      signal,
      supplier,
      supplierNum,
      itemNumber,
      itemDescription: (f[8] || "").trim(),
      oldDate: (f[18] || "").trim(),
      newDate: (f[19] || "").trim(),
      oldQty: parseEuFloat(f[20]),
      newQty: parseEuFloat(f[21]),
      poNumber: (f[13] || "").trim(),
      poLine: (f[14] || "").trim(),
      orderStatus: f.length > 25 ? (f[25] || "").trim() : "",
    });
  }
  return rows;
}
