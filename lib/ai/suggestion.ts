import type { AppState } from "@/types";
import { daysDiff, TODAY_STR } from "@/lib/utils/dates";

export interface AISuggestion {
  text: string;
  prompt: string;
  targetHref: string;
  score: string;
}

/**
 * Picks the single highest-priority insight to proactively surface, in the
 * same priority order as the legacy app: MC16 critical > overdue orders >
 * pending PMS actions > unconfirmed MRP. `score` is a fingerprint of the
 * counts involved — used to avoid re-showing the same insight after it's
 * been dismissed, while still re-surfacing if the underlying numbers change.
 */
export function computeAISuggestion(state: AppState): AISuggestion | null {
  const mc16Critical = state.mc16.filter((r) => {
    if (r.status === "Resolved") return false;
    const d = daysDiff(r.outOfStockDate);
    return !Number.isNaN(d) && d <= 7;
  });

  const mrpActive = state.mrp.filter((r) => r.rowStatus !== "Closed");
  const scActive = state.sc.filter((r) => r.rowStatus !== "Cleared");
  const overdueCount =
    mrpActive.filter((r) => r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR).length +
    scActive.filter((r) => r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR).length;

  const pendingPms = state.pms.filter((r) => r.signal === "Accelerate" || r.signal === "Cancel" || r.signal === "Delay").length;
  const unconfirmedMrp = mrpActive.filter((r) => r.confirmationStatus === "Not Confirmed").length;

  const fingerprint = `mc16:${mc16Critical.length}|overdue:${overdueCount}|pms:${pendingPms}|unconf:${unconfirmedMrp}`;

  if (mc16Critical.length > 0) {
    return {
      text: `${mc16Critical.length} MC16 alert${mc16Critical.length !== 1 ? "s" : ""} critical (stockout within 7 days).`,
      prompt: "Summarize the critical MC16 stockout alerts and what I should do first.",
      targetHref: "/mc16",
      score: fingerprint,
    };
  }
  if (overdueCount > 0) {
    return {
      text: `${overdueCount} order${overdueCount !== 1 ? "s are" : " is"} overdue right now.`,
      prompt: "Which overdue orders should I follow up on first, and what should I say to the suppliers?",
      targetHref: "/backlog",
      score: fingerprint,
    };
  }
  if (pendingPms > 0) {
    return {
      text: `${pendingPms} PSM Dashboard action${pendingPms !== 1 ? "s" : ""} awaiting a response.`,
      prompt: "Explain the pending PSM Dashboard actions and what I should action first.",
      targetHref: "/pms",
      score: fingerprint,
    };
  }
  if (unconfirmedMrp > 0) {
    return {
      text: `${unconfirmedMrp} MRP order${unconfirmedMrp !== 1 ? "s" : ""} still unconfirmed.`,
      prompt: "Draft a follow-up to get the unconfirmed MRP orders confirmed.",
      targetHref: "/mrp",
      score: fingerprint,
    };
  }
  return null;
}
