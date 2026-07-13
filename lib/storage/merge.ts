import type { BacklogRow, CommentStore, Mc16Row, MrpRow, ScRow } from "@/types";
import { backlogKey, mc16Key, mrpKey, scKey } from "./comments";

function latestLogText(entry: CommentStore[string] | undefined): string {
  if (!entry) return "";
  const log = entry.log ?? [];
  if (log.length > 0) {
    const sorted = [...log].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
    return sorted[0]?.text || entry.latestText || "";
  }
  return entry.latestText || "";
}

/** Existing rows not present in the new import are kept but marked Resolved. */
export function mergeMC16(ex: Mc16Row[], inc: Mc16Row[], cs: CommentStore): Mc16Row[] {
  const exMap: Record<string, Mc16Row> = {};
  ex.forEach((r) => (exMap[r.articleNumber] = r));
  const inKeys = new Set(inc.map((r) => r.articleNumber));

  const out: Mc16Row[] = inc.map((r) => ({
    ...r,
    comment: latestLogText(cs[mc16Key(r)]) || exMap[r.articleNumber]?.comment || "",
    status: exMap[r.articleNumber]?.status || "Active",
  }));

  ex.forEach((r) => {
    if (!inKeys.has(r.articleNumber)) {
      out.push({ ...r, comment: latestLogText(cs[mc16Key(r)]) || r.comment || "", status: "Resolved" });
    }
  });
  return out;
}

export function mergeBacklog(ex: BacklogRow[], inc: BacklogRow[], cs: CommentStore): BacklogRow[] {
  const key = (r: BacklogRow) => `${r.purchaseOrder}_${r.backlogLine}`;
  const exMap: Record<string, BacklogRow> = {};
  ex.forEach((r) => (exMap[key(r)] = r));
  const inKeys = new Set(inc.map(key));

  const out: BacklogRow[] = inc.map((r) => ({
    ...r,
    comment: latestLogText(cs[backlogKey(r)]) || exMap[key(r)]?.comment || "",
    status: "Active",
  }));

  ex.forEach((r) => {
    if (!inKeys.has(key(r))) {
      out.push({ ...r, comment: latestLogText(cs[backlogKey(r)]) || r.comment || "", status: "Cleared" });
    }
  });
  return out;
}

export function mergeMRP(ex: MrpRow[], inc: MrpRow[], cs: CommentStore): MrpRow[] {
  const key = (r: MrpRow) => `${r.orderNumber}_${r.itemNumber}`;
  const exMap: Record<string, MrpRow> = {};
  ex.forEach((r) => (exMap[key(r)] = r));
  const inKeys = new Set(inc.map(key));

  const out: MrpRow[] = inc.map((r) => ({
    ...r,
    comment: latestLogText(cs[mrpKey(r)]) || exMap[key(r)]?.comment || "",
    rowStatus: "Active",
  }));

  ex.forEach((r) => {
    if (!inKeys.has(key(r))) {
      out.push({ ...r, comment: latestLogText(cs[mrpKey(r)]) || r.comment || "", rowStatus: "Closed" });
    }
  });
  return out;
}

export function mergeSC(ex: ScRow[], inc: ScRow[], cs: CommentStore): ScRow[] {
  const key = (r: ScRow) => `${r.scheduleNumber}_${r.itemNumber}_${r.plannedReceiptDate}`;
  const exMap: Record<string, ScRow> = {};
  ex.forEach((r) => (exMap[key(r)] = r));
  const inKeys = new Set(inc.map(key));

  const out: ScRow[] = inc.map((r) => ({
    ...r,
    comment: latestLogText(cs[scKey(r)]) || exMap[key(r)]?.comment || "",
    rowStatus: "Active",
  }));

  ex.forEach((r) => {
    if (!inKeys.has(key(r))) {
      out.push({ ...r, comment: latestLogText(cs[scKey(r)]) || r.comment || "", rowStatus: "Cleared" });
    }
  });
  return out;
}
