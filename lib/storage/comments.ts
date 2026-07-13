import { COMMENT_KEY_V2, safeLoad, safeSave } from "./keys";
import type { CommentEntry, CommentStore, MrpRow, ScRow, Mc16Row, BacklogRow } from "@/types";

// Stable per-line keys — the backbone of "comments survive re-import".
export const mc16Key = (row: Pick<Mc16Row, "articleNumber">) => `mc16:${row.articleNumber}`;
export const backlogKey = (row: Pick<BacklogRow, "purchaseOrder" | "backlogLine">) =>
  `backlog:${row.purchaseOrder}_${row.backlogLine}`;
export const mrpKey = (row: Pick<MrpRow, "orderNumber" | "itemNumber">) =>
  `mrp:${row.orderNumber}_${row.itemNumber}`;
export const scKey = (row: Pick<ScRow, "scheduleNumber" | "itemNumber" | "plannedReceiptDate">) =>
  `sc:${row.scheduleNumber}_${row.itemNumber}_${row.plannedReceiptDate}`;

export function loadCommentStore(): CommentStore {
  const raw = safeLoad<Record<string, unknown>>(COMMENT_KEY_V2, {});
  const migrated: CommentStore = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      // legacy plain-string entry -> upgrade to rich shape
      migrated[key] = { log: value ? [{ ts: new Date().toISOString(), text: value }] : [], latestText: value };
    } else if (value && typeof value === "object") {
      migrated[key] = value as CommentEntry;
    }
  }
  return migrated;
}

export function saveCommentStore(store: CommentStore): void {
  safeSave(COMMENT_KEY_V2, store);
}

export function addCommentEntry(
  store: CommentStore,
  key: string,
  text: string,
  extra?: { tracking?: string; carrier?: string; statusAtTime?: string },
): CommentStore {
  const existing = store[key] ?? { log: [], latestText: "" };
  const entry = {
    ts: new Date().toISOString(),
    text,
    tracking: extra?.tracking,
    carrier: extra?.carrier,
    statusAtTime: extra?.statusAtTime,
  };
  const next: CommentEntry = {
    log: [...existing.log, entry],
    latestText: text || existing.latestText,
    latestTracking: extra?.tracking ?? existing.latestTracking,
  };
  return { ...store, [key]: next };
}

export function getLatestComment(store: CommentStore, key: string): string {
  return store[key]?.latestText ?? "";
}
