"use client";

import { useAppData } from "@/lib/state/AppDataContext";
import { useToast } from "@/lib/state/ToastContext";

export function ResetDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { resetData } = useAppData();
  const { addToast } = useToast();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="card rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text)" }}>
          Reset ERP data?
        </h3>
        <p className="text-sm mb-5" style={{ color: "var(--text2)" }}>
          This clears MC16, Backlog, PSM, MRP and SC data. Contacts, comments, shipments, to-dos and your
          profile are kept.
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ border: "1px solid var(--border)", color: "var(--text2)" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              resetData();
              addToast("ERP data reset.", "success");
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--red)" }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
