"use client";

import { useState } from "react";
import type { ColumnMapping, FieldSpec } from "@/types";
import { Icon } from "@/components/layout/Icon";

export interface MappingReviewRequest {
  fileName: string;
  fileKindLabel: string;
  headers: string[];
  fields: FieldSpec[];
  mapping: ColumnMapping;
  confidences: Record<string, number>;
}

function confidenceColor(score: number): string {
  if (score >= 80) return "var(--green)";
  if (score >= 40) return "var(--amber)";
  return "var(--muted)";
}

export function ColumnMappingPreview({
  request,
  onConfirm,
  onCancel,
}: {
  request: MappingReviewRequest;
  onConfirm: (mapping: ColumnMapping) => void;
  onCancel: () => void;
}) {
  const [mapping, setMapping] = useState<ColumnMapping>(request.mapping);

  const usedColumns = new Set(Object.values(mapping).filter((v): v is number => v != null));

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
      <div
        className="w-full rounded-2xl fade-in flex flex-col"
        style={{ maxWidth: 640, maxHeight: "85vh", background: "var(--card)", border: "1px solid var(--border2)", boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}
      >
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
            Confirm column mapping — {request.fileKindLabel}
          </div>
          <div className="text-sm" style={{ color: "var(--text2)" }}>
            {request.fileName} — we detected these columns by header name. Correct any that look wrong; we&apos;ll
            remember your choice for next time.
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          {request.fields.map((f) => {
            const colIdx = mapping[f.key];
            const confidence = colIdx != null ? request.confidences[f.key] ?? 0 : 0;
            return (
              <div key={f.key} className="flex items-center gap-3">
                <div className="w-44 flex-shrink-0">
                  <div className="text-xs font-semibold" style={{ color: "var(--text)" }}>
                    {f.label}
                    {f.required && (
                      <span className="ml-1" style={{ color: "var(--red)" }}>
                        *
                      </span>
                    )}
                  </div>
                </div>
                <Icon name="chevron" className="w-3.5 h-3.5 flex-shrink-0 opacity-40" />
                <select
                  value={colIdx ?? ""}
                  onChange={(e) => {
                    const v = e.target.value === "" ? null : Number(e.target.value);
                    setMapping((m) => ({ ...m, [f.key]: v }));
                  }}
                  className="flex-1 rounded-lg text-sm px-2.5 py-2"
                  style={{ background: "var(--card2)", border: "1px solid var(--border)", color: "var(--text)" }}
                >
                  <option value="">— not mapped —</option>
                  {request.headers.map((h, i) => (
                    <option key={i} value={i} disabled={usedColumns.has(i) && mapping[f.key] !== i}>
                      {h || `Column ${i + 1}`}
                    </option>
                  ))}
                </select>
                {colIdx != null && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ color: confidenceColor(confidence), background: `${confidenceColor(confidence)}18` }}
                  >
                    {confidence}%
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 py-4 flex justify-end gap-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ border: "1px solid var(--border)", color: "var(--text2)" }}
          >
            Skip this file
          </button>
          <button
            type="button"
            onClick={() => onConfirm(mapping)}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "var(--blue)" }}
          >
            Confirm &amp; Import
          </button>
        </div>
      </div>
    </div>
  );
}
