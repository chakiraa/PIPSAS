import type { ScRow } from "@/types";
import { stripTime, toItemNum } from "@/lib/utils/dates";
import { cell } from "./helpers";

/**
 * Ported 1:1 from legacy parseSC. Mostly fixed column positions (standard
 * Infor LN schedule-lines export); 4 columns are header-detected with
 * hardcoded fallback indices when detection fails.
 */
export function parseSC(sheetData: unknown[][]): ScRow[] {
  const headers = (sheetData[1] || []) as unknown[];
  let plannedDateIdx = -1;
  let statusIdx = -1;
  let schedQtyIdx = -1;
  let qtyDelIdx = -1;

  headers.forEach((h, i) => {
    const s = String(h).toLowerCase().trim();
    if (plannedDateIdx === -1 && s.includes("plan") && s.includes("rec")) plannedDateIdx = i;
    if (plannedDateIdx === -1 && s.includes("réception") && s.includes("plan")) plannedDateIdx = i;
    if (statusIdx === -1 && (s === "status" || s === "statut" || s === "état")) statusIdx = i;
    if (schedQtyIdx === -1 && s.includes("quantit") && s.includes("schedule")) schedQtyIdx = i;
    if (schedQtyIdx === -1 && s.includes("qté") && s.includes("planif")) schedQtyIdx = i;
    if (qtyDelIdx === -1 && (s.includes("livr") || s.includes("delivered") || s.includes("deliv"))) qtyDelIdx = i;
  });

  if (plannedDateIdx === -1) plannedDateIdx = 11;
  if (statusIdx === -1) statusIdx = 13;
  if (schedQtyIdx === -1) schedQtyIdx = 14;
  if (qtyDelIdx === -1) qtyDelIdx = 16;

  const rows: ScRow[] = [];
  for (let i = 2; i < sheetData.length; i++) {
    const r = sheetData[i];
    if (!r || r.length < 14) continue;
    const schedNum = cell(r, 5);
    if (!schedNum) continue;
    const itemNum = toItemNum(r[9]);
    if (!itemNum) continue;

    const plannedDate = stripTime(r[plannedDateIdx]);
    const schedQty = parseFloat(String(r[schedQtyIdx])) || 0;
    const qtyDelivered = parseFloat(String(r[qtyDelIdx])) || 0;

    rows.push({
      scheduleNumber: schedNum,
      supplierNumber: cell(r, 6),
      supplierName: cell(r, 7),
      itemNumber: itemNum,
      itemDescription: cell(r, 10),
      plannedReceiptDate: plannedDate,
      status: cell(r, statusIdx),
      scheduleQuantity: schedQty,
      quantityDelivered: qtyDelivered,
      isPartialDelivery: qtyDelivered > 0 && qtyDelivered < schedQty,
      source: "SC",
      comment: "",
      rowStatus: "Active",
    });
  }
  return rows;
}
