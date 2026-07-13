import * as XLSX from "xlsx";
import type { FileKind } from "@/types";
import { FIELD_SPECS } from "./fieldSpecs";
import { normalizeHeader, scoreHeaderMatch } from "@/lib/utils/fuzzyMatch";

export interface SniffedFile {
  fileKind: Exclude<FileKind, "contacts">;
  headers: string[];
  headerRowIndex: number;
  dataStartIndex: number;
  rawRows: unknown[][];
}

// Row conventions match the legacy Infor LN exports: MC16/PMS/MRP/SC carry
// two meta/header rows before data; Backlog carries three.
const ROW_CONVENTION: Record<Exclude<FileKind, "contacts">, { headerRowIndex: number; dataStartIndex: number }> = {
  mc16: { headerRowIndex: 1, dataStartIndex: 2 },
  pms: { headerRowIndex: 1, dataStartIndex: 2 },
  mrp: { headerRowIndex: 1, dataStartIndex: 2 },
  sc: { headerRowIndex: 1, dataStartIndex: 2 },
  backlog: { headerRowIndex: 2, dataStartIndex: 3 },
};

function headerCoverageScore(headers: string[], fileKind: Exclude<FileKind, "contacts">): number {
  const normalized = headers.map(normalizeHeader);
  const fields = FIELD_SPECS[fileKind].filter((f) => f.required);
  let total = 0;
  for (const f of fields) {
    let best = 0;
    for (const h of normalized) {
      const score = scoreHeaderMatch(h, f.aliases);
      if (score > best) best = score;
    }
    total += best;
  }
  return fields.length ? total / fields.length : 0;
}

function buildRows(raw: unknown[][], fileKind: Exclude<FileKind, "contacts">): SniffedFile {
  const { headerRowIndex, dataStartIndex } = ROW_CONVENTION[fileKind];
  const headers = ((raw[headerRowIndex] || []) as unknown[]).map((c) => String(c ?? ""));
  return { fileKind, headers, headerRowIndex, dataStartIndex, rawRows: raw };
}

/**
 * Identifies which PIP module a dropped file belongs to and returns its raw
 * grid plus header row — but does NOT extract field values by position.
 * Column-level extraction always goes through detectColumnMapping (header
 * name based), never hardcoded indices.
 */
export async function sniffFile(file: File): Promise<SniffedFile> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const raw = lines.map((l) => l.split(";"));
    return buildRows(raw, "pms");
  }

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];

  // MC16 has a hard signature: priority code 16 in column 14 of any data row.
  for (let i = 2; i < Math.min(raw.length, 20); i++) {
    const r = raw[i];
    if (r && parseInt(String(r[14]), 10) === 16) {
      return buildRows(raw, "mc16");
    }
  }

  const h0 = ((raw[0] || []) as unknown[]).map((c) => String(c).toLowerCase().trim());
  const h1 = ((raw[1] || []) as unknown[]).map((c) => String(c).toLowerCase().trim());
  const hAll = [...h0, ...h1].join("|");

  if (hAll.includes("backlogline") || hAll.includes("backlog line") || hAll.includes("lignes")) {
    return buildRows(raw, "backlog");
  }
  if (hAll.includes("schedulenumber") || hAll.includes("schedule number") || hAll.includes("numéro de planning")) {
    return buildRows(raw, "sc");
  }
  if (
    hAll.includes("ordernumber") ||
    hAll.includes("order number") ||
    hAll.includes("numéro de commande") ||
    hAll.includes("commande achat")
  ) {
    return buildRows(raw, "mrp");
  }

  if (hAll.includes("company name") || hAll.includes("contact email") || hAll.includes("contact name")) {
    throw new Error(
      'This looks like a supplier contacts file. Please use the "Import XLSX" button on the Supplier Directory page.',
    );
  }

  // Fallback: score each candidate module's required-field header coverage
  // against both plausible header rows, and pick the best match.
  const candidates: Exclude<FileKind, "contacts">[] = ["mrp", "sc", "backlog"];
  let best: { kind: Exclude<FileKind, "contacts">; score: number } | null = null;
  for (const kind of candidates) {
    const { headerRowIndex } = ROW_CONVENTION[kind];
    const headers = ((raw[headerRowIndex] || []) as unknown[]).map((c) => String(c ?? ""));
    const score = headerCoverageScore(headers, kind);
    if (!best || score > best.score) best = { kind, score };
  }

  if (best && best.score >= 30) {
    return buildRows(raw, best.kind);
  }

  throw new Error("Could not auto-detect file type from its column headers. Check the file structure.");
}
