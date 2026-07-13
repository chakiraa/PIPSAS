"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AppState, BacklogRow, CommentStore, Mc16Row, ModuleKey, MrpRow, PmsRow, ScRow } from "@/types";
import { STORAGE_KEY, safeLoad, safeSave } from "@/lib/storage/keys";
import { addCommentEntry, backlogKey, loadCommentStore, mc16Key, mrpKey, saveCommentStore, scKey } from "@/lib/storage/comments";
import { mergeBacklog, mergeMC16, mergeMRP, mergeSC } from "@/lib/storage/merge";

const EMPTY_STATE: AppState = { mc16: [], pms: [], backlog: [], mrp: [], sc: [], lastUpload: {} };

interface AppDataContextValue {
  state: AppState;
  commentStore: CommentStore;
  uploadMC16: (data: Mc16Row[]) => void;
  uploadPMS: (data: PmsRow[]) => void;
  uploadBacklog: (data: BacklogRow[]) => void;
  uploadMRP: (data: MrpRow[]) => void;
  uploadSC: (data: ScRow[]) => void;
  updateComment: (
    module: ModuleKey,
    key: string,
    text: string,
    extra?: { tracking?: string; carrier?: string; statusAtTime?: string },
  ) => void;
  resetData: () => void;
  reloadComments: (store: CommentStore) => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function rowStableKey(module: ModuleKey, row: unknown): string {
  switch (module) {
    case "mc16":
      return mc16Key(row as Mc16Row);
    case "backlog":
      return backlogKey(row as BacklogRow);
    case "mrp":
      return mrpKey(row as MrpRow);
    case "sc":
      return scKey(row as ScRow);
    default:
      return "";
  }
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [commentStore, setCommentStore] = useState<CommentStore>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(safeLoad<AppState>(STORAGE_KEY, EMPTY_STATE));
    setCommentStore(loadCommentStore());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) safeSave(STORAGE_KEY, state);
  }, [state, hydrated]);

  const uploadMC16 = useCallback(
    (data: Mc16Row[]) => {
      setState((prev) => ({
        ...prev,
        mc16: mergeMC16(prev.mc16, data, commentStore),
        lastUpload: { ...prev.lastUpload, mc16: new Date().toISOString() },
      }));
    },
    [commentStore],
  );

  const uploadPMS = useCallback((data: PmsRow[]) => {
    setState((prev) => ({ ...prev, pms: data, lastUpload: { ...prev.lastUpload, pms: new Date().toISOString() } }));
  }, []);

  const uploadBacklog = useCallback(
    (data: BacklogRow[]) => {
      setState((prev) => ({
        ...prev,
        backlog: mergeBacklog(prev.backlog, data, commentStore),
        lastUpload: { ...prev.lastUpload, backlog: new Date().toISOString() },
      }));
    },
    [commentStore],
  );

  const uploadMRP = useCallback(
    (data: MrpRow[]) => {
      setState((prev) => ({
        ...prev,
        mrp: mergeMRP(prev.mrp, data, commentStore),
        lastUpload: { ...prev.lastUpload, mrp: new Date().toISOString() },
      }));
    },
    [commentStore],
  );

  const uploadSC = useCallback(
    (data: ScRow[]) => {
      setState((prev) => ({
        ...prev,
        sc: mergeSC(prev.sc, data, commentStore),
        lastUpload: { ...prev.lastUpload, sc: new Date().toISOString() },
      }));
    },
    [commentStore],
  );

  const updateComment = useCallback(
    (
      module: ModuleKey,
      key: string,
      text: string,
      extra?: { tracking?: string; carrier?: string; statusAtTime?: string },
    ) => {
      const storeKey = `${module}:${key}`;
      setCommentStore((prevCs) => {
        const next = addCommentEntry(prevCs, storeKey, text, extra);
        saveCommentStore(next);
        return next;
      });
      setState((prev) => {
        if (module === "mc16")
          return { ...prev, mc16: prev.mc16.map((r) => (r.articleNumber === key ? { ...r, comment: text } : r)) };
        if (module === "backlog")
          return {
            ...prev,
            backlog: prev.backlog.map((r) => (`${r.purchaseOrder}_${r.backlogLine}` === key ? { ...r, comment: text } : r)),
          };
        if (module === "mrp")
          return { ...prev, mrp: prev.mrp.map((r) => (`${r.orderNumber}_${r.itemNumber}` === key ? { ...r, comment: text } : r)) };
        if (module === "sc")
          return {
            ...prev,
            sc: prev.sc.map((r) =>
              `${r.scheduleNumber}_${r.itemNumber}_${r.plannedReceiptDate}` === key ? { ...r, comment: text } : r,
            ),
          };
        return prev;
      });
    },
    [],
  );

  const resetData = useCallback(() => {
    setState(EMPTY_STATE);
  }, []);

  const reloadComments = useCallback((store: CommentStore) => {
    setCommentStore(store);
    setState((prev) => {
      const getText = (m: ModuleKey, row: unknown) => {
        const v = store[`${m}:${rowStableKey(m, row)}`];
        if (!v) return "";
        const log = v.log ?? [];
        if (log.length > 0) {
          const sorted = [...log].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());
          return sorted[0]?.text || "";
        }
        return v.latestText || "";
      };
      return {
        ...prev,
        mc16: prev.mc16.map((r) => ({ ...r, comment: getText("mc16", r) || r.comment })),
        backlog: prev.backlog.map((r) => ({ ...r, comment: getText("backlog", r) || r.comment })),
        mrp: prev.mrp.map((r) => ({ ...r, comment: getText("mrp", r) || r.comment })),
        sc: prev.sc.map((r) => ({ ...r, comment: getText("sc", r) || r.comment })),
      };
    });
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      state,
      commentStore,
      uploadMC16,
      uploadPMS,
      uploadBacklog,
      uploadMRP,
      uploadSC,
      updateComment,
      resetData,
      reloadComments,
    }),
    [state, commentStore, uploadMC16, uploadPMS, uploadBacklog, uploadMRP, uploadSC, updateComment, resetData, reloadComments],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
