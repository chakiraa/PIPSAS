import type { BacklogRow } from "@/types";
import { stripTime, daysLate } from "@/lib/utils/dates";
import { cell } from "./helpers";

/**
 * Ported 1:1 from legacy parseBacklog. This is a distinct legacy XLSX export
 * format (kept for parity even though the live Backlog tab is synthesized
 * from MRP+SC — see migration notes).
 */
export function parseBacklog(sheetData: unknown[][]): BacklogRow[] {
  const rows: BacklogRow[] = [];
  for (let i = 3; i < sheetData.length; i++) {
    const r = sheetData[i];
    if (!r || r.length < 6) continue;
    const po = cell(r, 0);
    if (!po) continue;
    const item = cell(r, 2);
    if (!item) continue;
    const bp = cell(r, 1);
    let supplierNumber = "";
    let supplierName = bp;
    const sep = bp.indexOf(" - ");
    if (sep !== -1) {
      supplierNumber = bp.slice(0, sep).trim();
      supplierName = bp.slice(sep + 3).trim();
    }
    const dateRaw = stripTime(r[5]);
    rows.push({
      purchaseOrder: po,
      supplierNumber,
      supplierName,
      itemNumber: item,
      itemDescription: cell(r, 3),
      backlogLine: parseInt(String(r[4]), 10) || 0,
      plannedReceiptDate: dateRaw,
      daysLate: dateRaw ? daysLate(dateRaw) : null,
      comment: "",
      status: "Active",
    });
  }
  return rows;
}
