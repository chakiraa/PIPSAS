import type { ConfirmationStatus, MrpRow } from "@/types";
import { stripTime, toItemNum } from "@/lib/utils/dates";
import { cell } from "./helpers";

/**
 * Ported 1:1 from legacy parseMRP. Mostly fixed column positions (standard
 * Infor LN purchase-order export); 4 columns are header-detected (FR/EN
 * keyword match) with hardcoded fallback indices when detection fails.
 */
export function parseMRP(sheetData: unknown[][]): MrpRow[] {
  const headers = (sheetData[1] || []) as unknown[];
  let confAcceptedIdx = -1;
  let confDateSupIdx = -1;
  let orderDateIdx = -1;
  let plannedDateIdx = -1;

  headers.forEach((h, i) => {
    const s = String(h).toLowerCase().trim();
    if (confAcceptedIdx === -1 && (s.includes("accept") || s.includes("accepté"))) confAcceptedIdx = i;
    if (
      confDateSupIdx === -1 &&
      s.includes("conf") &&
      (s.includes("del") || s.includes("liv") || (s.includes("date") && s.includes("sup")))
    )
      confDateSupIdx = i;
    if (orderDateIdx === -1 && (s === "order date" || s === "date commande" || s === "date de commande"))
      orderDateIdx = i;
    if (plannedDateIdx === -1 && s.includes("current") && s.includes("plan")) plannedDateIdx = i;
  });

  if (confAcceptedIdx === -1) confAcceptedIdx = 23;
  if (confDateSupIdx === -1) confDateSupIdx = 21;
  if (orderDateIdx === -1) orderDateIdx = 27;
  if (plannedDateIdx === -1) plannedDateIdx = 31;

  const rows: MrpRow[] = [];
  for (let i = 2; i < sheetData.length; i++) {
    const r = sheetData[i];
    if (!r || r.length < 38) continue;
    const orderNum = cell(r, 8);
    if (!orderNum) continue;
    const itemNum = toItemNum(r[17]);
    if (!itemNum) continue;

    const confDateSup = stripTime(r[confDateSupIdx]);
    const rawAccepted = cell(r, confAcceptedIdx);
    let confDateAccepted: boolean | null = null;
    if (rawAccepted === "Oui") confDateAccepted = true;
    else if (rawAccepted === "Non") confDateAccepted = false;

    let confirmationStatus: ConfirmationStatus = "Not Confirmed";
    if (confDateAccepted === true) confirmationStatus = "Accepted";
    else if (confDateAccepted === false) confirmationStatus = "Pending Acceptance";
    else if (confDateSup) confirmationStatus = "Confirmed";

    const qtyOrdered = parseFloat(String(r[38])) || 0;
    const qtyDelivered = parseFloat(String(r[41])) || 0;

    rows.push({
      orderNumber: orderNum,
      supplierNumber: cell(r, 13),
      supplierName: cell(r, 14),
      itemNumber: itemNum,
      itemDescription: cell(r, 18),
      confDeliveryDateSupplier: confDateSup,
      confDateAccepted,
      confirmationStatus,
      confirmedQuantity: parseFloat(String(r[24])) || 0,
      orderDate: stripTime(r[orderDateIdx]),
      plannedReceiptDate: stripTime(r[plannedDateIdx]),
      quantityOrdered: qtyOrdered,
      quantityDelivered: qtyDelivered,
      isPartialDelivery: qtyDelivered > 0 && qtyDelivered < qtyOrdered,
      source: "MRP",
      comment: "",
      rowStatus: "Active",
    });
  }
  return rows;
}
