import type {
  BacklogRow,
  ColumnMapping,
  ConfirmationStatus,
  FieldSpec,
  Mc16Row,
  MrpRow,
  ParseIssueRow,
  PmsRow,
  ScRow,
} from "@/types";
import { stripTime } from "@/lib/utils/dates";
import { FIELD_SPECS } from "./fieldSpecs";

export interface BuildResult<T> {
  data: T[];
  issues: ParseIssueRow[];
}

function coerceField(raw: unknown, field: FieldSpec): { value: unknown; error?: string } {
  const isEmpty = raw == null || String(raw).trim() === "";

  if (field.type === "string") {
    const value = isEmpty ? "" : String(raw).trim();
    if (field.required && !value) return { value, error: "required but blank" };
    return { value };
  }

  if (field.type === "number") {
    if (isEmpty) {
      if (field.required) return { value: 0, error: "required but blank" };
      return { value: 0 };
    }
    const n = parseFloat(String(raw).replace(",", "."));
    if (Number.isNaN(n)) return { value: 0, error: `"${raw}" is not a valid number` };
    return { value: n };
  }

  if (field.type === "date") {
    if (isEmpty) {
      if (field.required) return { value: "", error: "required but blank" };
      return { value: "" };
    }
    const value = stripTime(raw);
    if (/[a-zA-Z]/.test(value)) return { value, error: `"${raw}" is not a recognizable date` };
    return { value };
  }

  // boolean-typed fields (currently unused directly — handled as raw strings by callers)
  const value = isEmpty ? "" : String(raw).trim();
  return { value };
}

function extractFields(
  row: unknown[],
  mapping: ColumnMapping,
  fields: FieldSpec[],
): { values: Record<string, unknown>; errors: string[]; allBlank: boolean } {
  const values: Record<string, unknown> = {};
  const errors: string[] = [];
  let allBlank = true;
  for (const f of fields) {
    const colIdx = mapping[f.key];
    const raw = colIdx == null ? undefined : row[colIdx];
    if (raw != null && String(raw).trim() !== "") allBlank = false;
    const { value, error } = coerceField(raw, f);
    values[f.key] = value;
    if (error) errors.push(`${f.label}: ${error}`);
  }
  return { values, errors, allBlank };
}

function requiredErrors(fields: FieldSpec[], errors: string[]): string[] {
  const requiredKeys = new Set(fields.filter((f) => f.required).map((f) => f.label));
  return errors.filter((e) => requiredKeys.has(e.split(":")[0]));
}

// ── MC16 ─────────────────────────────────────────────────────────────────

export function buildMc16Rows(rawRows: unknown[][], dataStartIndex: number, mapping: ColumnMapping): BuildResult<Mc16Row> {
  const fields = FIELD_SPECS.mc16;
  const data: Mc16Row[] = [];
  const issues: ParseIssueRow[] = [];

  for (let i = dataStartIndex; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r) continue;
    const { values, errors, allBlank } = extractFields(r, mapping, fields);
    if (allBlank) continue;

    // priorityCode acts as a row filter (only code 16 rows are MC16 alerts),
    // not a hard validation failure — but only when the column is actually mapped.
    if (mapping.priorityCode != null && values.priorityCode !== 16) continue;

    const reqErrors = requiredErrors(fields, errors);
    if (reqErrors.length) {
      issues.push({ rowIndex: i, reason: reqErrors.join("; "), raw: r });
      continue;
    }

    data.push({
      articleNumber: String(values.articleNumber),
      articleName: String(values.articleName ?? ""),
      articleDescription: String(values.articleDescription ?? ""),
      priorityCode: 16,
      outOfStockDate: String(values.outOfStockDate ?? ""),
      comment: "",
      status: "Active",
    });
  }

  return { data, issues };
}

// ── PMS ──────────────────────────────────────────────────────────────────

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

export function buildPmsRows(rawRows: unknown[][], dataStartIndex: number, mapping: ColumnMapping): BuildResult<PmsRow> {
  const fields = FIELD_SPECS.pms;
  const data: PmsRow[] = [];
  const issues: ParseIssueRow[] = [];

  for (let i = dataStartIndex; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r) continue;
    const { values, errors, allBlank } = extractFields(r, mapping, fields);
    if (allBlank) continue;

    const reqErrors = requiredErrors(fields, errors);
    if (reqErrors.length) {
      issues.push({ rowIndex: i, reason: reqErrors.join("; "), raw: r });
      continue;
    }

    data.push({
      signal: normalizeSignal(String(values.signal)),
      supplier: String(values.supplier ?? ""),
      supplierNum: String(values.supplierNum ?? ""),
      itemNumber: String(values.itemNumber),
      itemDescription: String(values.itemDescription ?? ""),
      oldDate: String(values.oldDate ?? ""),
      newDate: String(values.newDate ?? ""),
      oldQty: Number(values.oldQty ?? 0),
      newQty: Number(values.newQty ?? 0),
      poNumber: String(values.poNumber ?? ""),
      poLine: String(values.poLine ?? ""),
      orderStatus: String(values.orderStatus ?? ""),
    });
  }

  return { data, issues };
}

// ── MRP ──────────────────────────────────────────────────────────────────

export function buildMrpRows(rawRows: unknown[][], dataStartIndex: number, mapping: ColumnMapping): BuildResult<MrpRow> {
  const fields = FIELD_SPECS.mrp;
  const data: MrpRow[] = [];
  const issues: ParseIssueRow[] = [];

  for (let i = dataStartIndex; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r) continue;
    const { values, errors, allBlank } = extractFields(r, mapping, fields);
    if (allBlank) continue;

    const reqErrors = requiredErrors(fields, errors);
    if (reqErrors.length) {
      issues.push({ rowIndex: i, reason: reqErrors.join("; "), raw: r });
      continue;
    }

    const rawAccepted = String(values.confDateAccepted ?? "");
    const confDateAccepted = rawAccepted === "Oui" ? true : rawAccepted === "Non" ? false : null;
    const confDeliveryDateSupplier = String(values.confDeliveryDateSupplier ?? "");

    let confirmationStatus: ConfirmationStatus = "Not Confirmed";
    if (confDateAccepted === true) confirmationStatus = "Accepted";
    else if (confDateAccepted === false) confirmationStatus = "Pending Acceptance";
    else if (confDeliveryDateSupplier) confirmationStatus = "Confirmed";

    const quantityOrdered = Number(values.quantityOrdered ?? 0);
    const quantityDelivered = Number(values.quantityDelivered ?? 0);

    data.push({
      orderNumber: String(values.orderNumber),
      supplierNumber: String(values.supplierNumber ?? ""),
      supplierName: String(values.supplierName ?? ""),
      itemNumber: String(values.itemNumber),
      itemDescription: String(values.itemDescription ?? ""),
      confDeliveryDateSupplier,
      confDateAccepted,
      confirmationStatus,
      confirmedQuantity: Number(values.confirmedQuantity ?? 0),
      orderDate: String(values.orderDate ?? ""),
      plannedReceiptDate: String(values.plannedReceiptDate ?? ""),
      quantityOrdered,
      quantityDelivered,
      isPartialDelivery: quantityDelivered > 0 && quantityDelivered < quantityOrdered,
      source: "MRP",
      comment: "",
      rowStatus: "Active",
    });
  }

  return { data, issues };
}

// ── SC ───────────────────────────────────────────────────────────────────

export function buildScRows(rawRows: unknown[][], dataStartIndex: number, mapping: ColumnMapping): BuildResult<ScRow> {
  const fields = FIELD_SPECS.sc;
  const data: ScRow[] = [];
  const issues: ParseIssueRow[] = [];

  for (let i = dataStartIndex; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r) continue;
    const { values, errors, allBlank } = extractFields(r, mapping, fields);
    if (allBlank) continue;

    const reqErrors = requiredErrors(fields, errors);
    if (reqErrors.length) {
      issues.push({ rowIndex: i, reason: reqErrors.join("; "), raw: r });
      continue;
    }

    const scheduleQuantity = Number(values.scheduleQuantity ?? 0);
    const quantityDelivered = Number(values.quantityDelivered ?? 0);

    data.push({
      scheduleNumber: String(values.scheduleNumber),
      supplierNumber: String(values.supplierNumber ?? ""),
      supplierName: String(values.supplierName ?? ""),
      itemNumber: String(values.itemNumber),
      itemDescription: String(values.itemDescription ?? ""),
      plannedReceiptDate: String(values.plannedReceiptDate ?? ""),
      status: String(values.status ?? ""),
      scheduleQuantity,
      quantityDelivered,
      isPartialDelivery: quantityDelivered > 0 && quantityDelivered < scheduleQuantity,
      source: "SC",
      comment: "",
      rowStatus: "Active",
    });
  }

  return { data, issues };
}

// ── Backlog ──────────────────────────────────────────────────────────────

export function buildBacklogRows(rawRows: unknown[][], dataStartIndex: number, mapping: ColumnMapping): BuildResult<BacklogRow> {
  const fields = FIELD_SPECS.backlog;
  const data: BacklogRow[] = [];
  const issues: ParseIssueRow[] = [];

  for (let i = dataStartIndex; i < rawRows.length; i++) {
    const r = rawRows[i];
    if (!r) continue;
    const { values, errors, allBlank } = extractFields(r, mapping, fields);
    if (allBlank) continue;

    const reqErrors = requiredErrors(fields, errors);
    if (reqErrors.length) {
      issues.push({ rowIndex: i, reason: reqErrors.join("; "), raw: r });
      continue;
    }

    const bp = String(values.supplierBP ?? "");
    let supplierNumber = "";
    let supplierName = bp;
    const sep = bp.indexOf(" - ");
    if (sep !== -1) {
      supplierNumber = bp.slice(0, sep).trim();
      supplierName = bp.slice(sep + 3).trim();
    }

    const plannedReceiptDate = String(values.plannedReceiptDate ?? "");
    const d = plannedReceiptDate ? -daysDiffFromToday(plannedReceiptDate) : null;

    data.push({
      purchaseOrder: String(values.purchaseOrder),
      supplierNumber,
      supplierName,
      itemNumber: String(values.itemNumber),
      itemDescription: String(values.itemDescription ?? ""),
      backlogLine: Number(values.backlogLine ?? 0),
      plannedReceiptDate,
      daysLate: d,
      comment: "",
      status: "Active",
    });
  }

  return { data, issues };
}

function daysDiffFromToday(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function buildRowsForFileKind(
  fileKind: "mc16" | "pms" | "mrp" | "sc" | "backlog",
  rawRows: unknown[][],
  dataStartIndex: number,
  mapping: ColumnMapping,
): BuildResult<Mc16Row | PmsRow | MrpRow | ScRow | BacklogRow> {
  switch (fileKind) {
    case "mc16":
      return buildMc16Rows(rawRows, dataStartIndex, mapping);
    case "pms":
      return buildPmsRows(rawRows, dataStartIndex, mapping);
    case "mrp":
      return buildMrpRows(rawRows, dataStartIndex, mapping);
    case "sc":
      return buildScRows(rawRows, dataStartIndex, mapping);
    case "backlog":
      return buildBacklogRows(rawRows, dataStartIndex, mapping);
  }
}
