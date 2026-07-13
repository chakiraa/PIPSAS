// Core domain types for PIP, mirrored from the legacy app's row shapes.

export type ModuleKey = "mc16" | "pms" | "backlog" | "mrp" | "sc";

export interface Mc16Row {
  articleNumber: string;
  articleName: string;
  articleDescription: string;
  priorityCode: number;
  outOfStockDate: string;
  comment: string;
  status: "Active" | "Resolved";
}

export interface PmsRow {
  signal: string;
  supplier: string;
  supplierNum: string;
  itemNumber: string;
  itemDescription: string;
  oldDate: string;
  newDate: string;
  oldQty: number;
  newQty: number;
  poNumber: string;
  poLine: string;
  orderStatus?: string;
}

export interface BacklogRow {
  purchaseOrder: string;
  supplierNumber: string;
  supplierName: string;
  itemNumber: string;
  itemDescription: string;
  backlogLine: number;
  plannedReceiptDate: string;
  daysLate: number | null;
  comment: string;
  status: "Active" | "Cleared";
}

export type ConfirmationStatus =
  | "Accepted"
  | "Pending Acceptance"
  | "Confirmed"
  | "Not Confirmed";

export interface MrpRow {
  orderNumber: string;
  supplierNumber: string;
  supplierName: string;
  itemNumber: string;
  itemDescription: string;
  confDeliveryDateSupplier: string;
  confDateAccepted: boolean | null;
  confirmationStatus: ConfirmationStatus;
  confirmedQuantity: number;
  orderDate: string;
  plannedReceiptDate: string;
  quantityOrdered: number;
  quantityDelivered: number;
  isPartialDelivery: boolean;
  source: "MRP";
  comment: string;
  rowStatus: "Active" | "Closed";
}

export interface ScRow {
  scheduleNumber: string;
  supplierNumber: string;
  supplierName: string;
  itemNumber: string;
  itemDescription: string;
  plannedReceiptDate: string;
  status: string;
  scheduleQuantity: number;
  quantityDelivered: number;
  isPartialDelivery: boolean;
  source: "SC";
  comment: string;
  rowStatus: "Active" | "Cleared";
}

export interface AppState {
  mc16: Mc16Row[];
  pms: PmsRow[];
  backlog: BacklogRow[];
  mrp: MrpRow[];
  sc: ScRow[];
  lastUpload: Partial<Record<ModuleKey, string>>;
}

export interface Contact {
  supplierName: string;
  contactName: string;
  contactEmail: string;
  language: "en" | "fr" | "de" | "it" | "es";
  notes: string;
}

export interface Shipment {
  carrier: string;
  trackingRef: string;
  trackingUrl: string;
  supplierName: string;
  orderRef: string;
  updatedAt: string;
}

export type ShipmentStore = Record<string, Shipment>;

export interface CommentLogEntry {
  ts: string;
  text: string;
  tracking?: string;
  carrier?: string;
  statusAtTime?: string;
}

export interface CommentEntry {
  log: CommentLogEntry[];
  latestText: string;
  latestTracking?: string;
}

export type CommentStore = Record<string, CommentEntry>;

export interface TodoItem {
  id: string;
  text: string;
  priority: "high" | "medium" | "low";
  done: boolean;
  createdAt: string;
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
  isLocal?: boolean;
}

// ── Column mapping (new feature) ──

export type FileKind = "mc16" | "pms" | "mrp" | "sc" | "backlog" | "contacts";

export interface FieldSpec {
  key: string;
  label: string;
  required: boolean;
  type: "string" | "number" | "date" | "boolean";
  /** Header aliases used for fuzzy detection (lowercased, trimmed). */
  aliases: string[];
}

export interface DetectedMapping {
  fieldKey: string;
  columnIndex: number | null;
  confidence: number; // 0-100
}

export interface ColumnMapping {
  [fieldKey: string]: number | null; // column index or null (unmapped)
}

export interface ParseIssueRow {
  rowIndex: number;
  reason: string;
  raw: unknown[];
}
