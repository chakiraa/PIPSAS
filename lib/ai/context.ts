import type { AppState, Contact } from "@/types";
import { daysDiff, TODAY_STR } from "@/lib/utils/dates";

const MAX_ROWS_PER_SECTION = 35;

function line(...parts: (string | number)[]): string {
  return "  - " + parts.join(" | ");
}

/**
 * Builds a compact, token-budgeted text summary of the currently loaded
 * datasets: aggregate counts plus the most urgent rows per section (capped),
 * never the full raw dataset. Runs entirely client-side so only this
 * summary — not the underlying ERP data — ever leaves the browser.
 */
export function buildAIContext(state: AppState, contacts: Contact[]): string {
  const mc16Active = state.mc16.filter((r) => r.status !== "Resolved");
  const mc16Critical = mc16Active.filter((r) => {
    const d = daysDiff(r.outOfStockDate);
    return !Number.isNaN(d) && d <= 7;
  });
  const mc16Warning = mc16Active.filter((r) => {
    const d = daysDiff(r.outOfStockDate);
    return !Number.isNaN(d) && d > 7 && d <= 14;
  });

  const mrpActive = state.mrp.filter((r) => r.rowStatus !== "Closed");
  const scActive = state.sc.filter((r) => r.rowStatus !== "Cleared");
  const overdue = [
    ...mrpActive
      .filter((r) => r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR)
      .map((r) => ({ source: "MRP", ref: r.orderNumber, supplier: r.supplierName, item: r.itemNumber, date: r.plannedReceiptDate })),
    ...scActive
      .filter((r) => r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR)
      .map((r) => ({ source: "SC", ref: r.scheduleNumber, supplier: r.supplierName, item: r.itemNumber, date: r.plannedReceiptDate })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  const unconfirmedMrp = mrpActive.filter((r) => r.confirmationStatus === "Not Confirmed");
  const partials = [...mrpActive, ...scActive].filter((r) => r.isPartialDelivery);

  const pmsBySignal: Record<string, number> = {};
  for (const r of state.pms) pmsBySignal[r.signal] = (pmsBySignal[r.signal] ?? 0) + 1;

  const supplierOverdueCounts: Record<string, number> = {};
  for (const r of overdue) supplierOverdueCounts[r.supplier] = (supplierOverdueCounts[r.supplier] ?? 0) + 1;
  const topSuppliers = Object.entries(supplierOverdueCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const sections: string[] = [];

  sections.push(
    [
      "SUMMARY COUNTS:",
      `MC16 alerts: ${mc16Active.length} active (${mc16Critical.length} critical <=7d, ${mc16Warning.length} warning <=14d)`,
      `MRP orders: ${mrpActive.length} active, ${unconfirmedMrp.length} not confirmed`,
      `SC schedule lines: ${scActive.length} active`,
      `Overdue (Backlog): ${overdue.length}`,
      `Partial deliveries: ${partials.length}`,
      `PMS signals loaded: ${state.pms.length} (${Object.entries(pmsBySignal).map(([k, v]) => `${k}: ${v}`).join(", ") || "none"})`,
      `Supplier contacts on file: ${contacts.length}`,
    ].join("\n"),
  );

  if (topSuppliers.length) {
    sections.push(
      "TOP SUPPLIERS BY OVERDUE COUNT:\n" + topSuppliers.map(([sup, count]) => line(sup, `${count} overdue`)).join("\n"),
    );
  }

  if (overdue.length) {
    sections.push(
      "OVERDUE ORDERS (most urgent first):\n" +
        overdue
          .slice(0, MAX_ROWS_PER_SECTION)
          .map((r) => line(r.source, r.ref, r.supplier, `item ${r.item}`, `planned ${r.date}`))
          .join("\n") +
        (overdue.length > MAX_ROWS_PER_SECTION ? `\n  ...and ${overdue.length - MAX_ROWS_PER_SECTION} more` : ""),
    );
  }

  if (mc16Active.length) {
    const sorted = [...mc16Active].sort((a, b) => daysDiff(a.outOfStockDate) - daysDiff(b.outOfStockDate));
    sections.push(
      "MC16 ALERTS (most urgent first):\n" +
        sorted
          .slice(0, MAX_ROWS_PER_SECTION)
          .map((r) => line(r.articleNumber, r.articleName, `OOS ${r.outOfStockDate}`))
          .join("\n") +
        (sorted.length > MAX_ROWS_PER_SECTION ? `\n  ...and ${sorted.length - MAX_ROWS_PER_SECTION} more` : ""),
    );
  }

  if (state.pms.length) {
    sections.push(
      "PMS ACTIONS:\n" +
        state.pms
          .slice(0, MAX_ROWS_PER_SECTION)
          .map((r) => line(r.signal, r.poNumber, r.supplier, `item ${r.itemNumber}`, r.newDate ? `new date ${r.newDate}` : ""))
          .join("\n") +
        (state.pms.length > MAX_ROWS_PER_SECTION ? `\n  ...and ${state.pms.length - MAX_ROWS_PER_SECTION} more` : ""),
    );
  }

  if (unconfirmedMrp.length) {
    sections.push(
      "UNCONFIRMED MRP ORDERS:\n" +
        unconfirmedMrp
          .slice(0, MAX_ROWS_PER_SECTION)
          .map((r) => line(r.orderNumber, r.supplierName, `item ${r.itemNumber}`, `ordered ${r.orderDate}`))
          .join("\n") +
        (unconfirmedMrp.length > MAX_ROWS_PER_SECTION ? `\n  ...and ${unconfirmedMrp.length - MAX_ROWS_PER_SECTION} more` : ""),
    );
  }

  return sections.join("\n\n");
}

/**
 * Scans the user's message for tokens that look like PO/item numbers
 * (>=4 chars, >=3 digits) and does an uncapped exact-match lookup across
 * all loaded modules, so specific references always resolve even when the
 * row falls outside the capped summary above.
 */
export function findExactMatches(state: AppState, queryText: string): string {
  const tokens = Array.from(new Set((queryText.match(/[A-Za-z0-9-]{4,}/g) ?? []).filter((t) => (t.match(/\d/g)?.length ?? 0) >= 3))).slice(0, 8);
  if (!tokens.length) return "";

  const hits: string[] = [];
  for (const token of tokens) {
    const t = token.toLowerCase();
    for (const r of state.mrp) {
      if (r.orderNumber.toLowerCase().includes(t) || r.itemNumber.toLowerCase().includes(t)) {
        hits.push(line("MRP", r.orderNumber, r.supplierName, `item ${r.itemNumber}`, r.confirmationStatus, `planned ${r.plannedReceiptDate}`));
      }
    }
    for (const r of state.sc) {
      if (r.scheduleNumber.toLowerCase().includes(t) || r.itemNumber.toLowerCase().includes(t)) {
        hits.push(line("SC", r.scheduleNumber, r.supplierName, `item ${r.itemNumber}`, r.status, `planned ${r.plannedReceiptDate}`));
      }
    }
    for (const r of state.mc16) {
      if (r.articleNumber.toLowerCase().includes(t)) {
        hits.push(line("MC16", r.articleNumber, r.articleName, `OOS ${r.outOfStockDate}`, r.status));
      }
    }
    for (const r of state.pms) {
      if (r.poNumber.toLowerCase().includes(t) || r.itemNumber.toLowerCase().includes(t)) {
        hits.push(line("PMS", r.signal, r.poNumber, r.supplier, `item ${r.itemNumber}`));
      }
    }
  }

  if (!hits.length) return "";
  return "EXACT MATCHES FOR REFERENCES IN THE USER'S MESSAGE:\n" + Array.from(new Set(hits)).slice(0, 40).join("\n");
}
