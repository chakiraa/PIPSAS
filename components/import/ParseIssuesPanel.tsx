"use client";

import type { ParseIssueRow } from "@/types";
import { Icon } from "@/components/layout/Icon";

export function ParseIssuesPanel({
  fileName,
  issues,
  onClose,
}: {
  fileName: string;
  issues: ParseIssueRow[];
  onClose: () => void;
}) {
  if (!issues.length) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div
        className="w-full rounded-2xl fade-in flex flex-col"
        style={{ maxWidth: 640, maxHeight: "80vh", background: "var(--card)", border: "1px solid var(--border2)", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}
      >
        <div className="px-6 pt-6 pb-4 flex items-start gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <span style={{ color: "var(--amber)" }}>
            <Icon name="alert" className="w-5 h-5" />
          </span>
          <div>
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {issues.length} row{issues.length !== 1 ? "s" : ""} in {fileName} could not be imported
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
              These rows were skipped instead of guessed at. Fix them in the source file and re-upload, or ignore
              if they were never meant to be data rows.
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-3">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ color: "var(--muted)" }}>
                <th className="text-left font-semibold py-1.5 pr-3">Row</th>
                <th className="text-left font-semibold py-1.5">Reason</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                  <td className="py-1.5 pr-3 font-mono" style={{ color: "var(--muted)" }}>
                    {issue.rowIndex + 1}
                  </td>
                  <td className="py-1.5" style={{ color: "var(--text2)" }}>
                    {issue.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 flex justify-end" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--blue)" }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
