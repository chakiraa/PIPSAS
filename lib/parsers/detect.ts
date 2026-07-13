import * as XLSX from "xlsx";
import type { BacklogRow, Mc16Row, MrpRow, PmsRow, ScRow } from "@/types";
import { parseMC16 } from "./mc16";
import { parsePMS } from "./pms";
import { parseBacklog } from "./backlog";
import { parseMRP } from "./mrp";
import { parseSC } from "./sc";

export type DetectedModule = "mc16" | "pms" | "backlog" | "mrp" | "sc";

export interface DetectedFile {
  module: DetectedModule;
  data: Mc16Row[] | PmsRow[] | BacklogRow[] | MrpRow[] | ScRow[];
  count: number;
  /** Raw array-of-arrays sheet data, kept for the column-mapping preview flow. */
  rawRows?: unknown[][];
}

/** Ported 1:1 from legacy detectAndParseFile — same detection order and fallback cascade. */
export async function detectAndParseFile(file: File): Promise<DetectedFile> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    const text = await file.text();
    const data = parsePMS(text);
    return { module: "pms", data, count: data.length };
  }

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];

  for (let i = 2; i < Math.min(raw.length, 20); i++) {
    const r = raw[i];
    if (r && parseInt(String(r[14]), 10) === 16) {
      const data = parseMC16(raw);
      if (data.length > 0) return { module: "mc16", data, count: data.length, rawRows: raw };
    }
  }

  const h0 = ((raw[0] || []) as unknown[]).map((c) => String(c).toLowerCase().trim());
  const h1 = ((raw[1] || []) as unknown[]).map((c) => String(c).toLowerCase().trim());
  const hAll = [...h0, ...h1].join("|");

  if (hAll.includes("backlogline") || hAll.includes("backlog line") || hAll.includes("lignes")) {
    const data = parseBacklog(raw);
    if (data.length > 0) return { module: "backlog", data, count: data.length, rawRows: raw };
  }
  if (
    hAll.includes("schedulenumber") ||
    hAll.includes("schedule number") ||
    hAll.includes("numéro de planning")
  ) {
    const data = parseSC(raw);
    if (data.length > 0) return { module: "sc", data, count: data.length, rawRows: raw };
  }
  if (
    hAll.includes("ordernumber") ||
    hAll.includes("order number") ||
    hAll.includes("numéro de commande") ||
    hAll.includes("commande achat")
  ) {
    const data = parseMRP(raw);
    if (data.length > 0) return { module: "mrp", data, count: data.length, rawRows: raw };
  }

  const mrpData = parseMRP(raw);
  if (mrpData.length > 0) return { module: "mrp", data: mrpData, count: mrpData.length, rawRows: raw };

  const scData = parseSC(raw);
  if (scData.length > 0) return { module: "sc", data: scData, count: scData.length, rawRows: raw };

  const backlogData = parseBacklog(raw);
  if (backlogData.length > 0)
    return { module: "backlog", data: backlogData, count: backlogData.length, rawRows: raw };

  if (hAll.includes("company name") || hAll.includes("contact email") || hAll.includes("contact name")) {
    throw new Error(
      'This looks like a supplier contacts file. Please use the "Import XLSX" button on the Supplier Directory page.',
    );
  }

  throw new Error("Could not auto-detect file type. Check column structure.");
}
