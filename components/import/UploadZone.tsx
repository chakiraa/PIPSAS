"use client";

import { useRef, useState } from "react";
import { sniffFile } from "@/lib/mapping/sniff";
import { FIELD_SPECS, FILE_KIND_LABELS } from "@/lib/mapping/fieldSpecs";
import { detectColumnMapping, allRequiredResolvedByMemory } from "@/lib/mapping/detectMapping";
import { buildRowsForFileKind } from "@/lib/mapping/buildRows";
import { getRememberedForFileKind, rememberMappings } from "@/lib/storage/columnMappings";
import { useAppData } from "@/lib/state/AppDataContext";
import { useToast } from "@/lib/state/ToastContext";
import { Icon } from "@/components/layout/Icon";
import { ColumnMappingPreview, type MappingReviewRequest } from "./ColumnMappingPreview";
import { ParseIssuesPanel } from "./ParseIssuesPanel";
import type { BacklogRow, ColumnMapping, Mc16Row, MrpRow, ParseIssueRow, PmsRow, ScRow } from "@/types";

export function UploadZone({ compact = false }: { compact?: boolean }) {
  const { uploadMC16, uploadPMS, uploadBacklog, uploadMRP, uploadSC } = useAppData();
  const { addToast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reviewRequest, setReviewRequest] = useState<MappingReviewRequest | null>(null);
  const [issuesRequest, setIssuesRequest] = useState<{ fileName: string; issues: ParseIssueRow[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingMappingResolve = useRef<((mapping: ColumnMapping | null) => void) | null>(null);
  const pendingIssuesResolve = useRef<(() => void) | null>(null);

  async function processFiles(files: FileList | File[]) {
    setLoading(true);
    for (const file of Array.from(files)) {
      try {
        const sniffed = await sniffFile(file);
        const fields = FIELD_SPECS[sniffed.fileKind];
        const remembered = getRememberedForFileKind(sniffed.fileKind);
        const { mapping, confidences, matchedByMemory } = detectColumnMapping(sniffed.headers, fields, remembered);

        let finalMapping = mapping;

        if (!allRequiredResolvedByMemory(fields, matchedByMemory)) {
          const reviewed = await new Promise<ColumnMapping | null>((resolve) => {
            pendingMappingResolve.current = resolve;
            setReviewRequest({
              fileName: file.name,
              fileKindLabel: FILE_KIND_LABELS[sniffed.fileKind],
              headers: sniffed.headers,
              fields,
              mapping,
              confidences,
            });
          });
          if (reviewed == null) {
            addToast(`${file.name}: import skipped.`, "info");
            continue;
          }
          finalMapping = reviewed;
          rememberMappings(sniffed.fileKind, sniffed.headers, finalMapping);
        }

        const { data, issues } = buildRowsForFileKind(sniffed.fileKind, sniffed.rawRows, sniffed.dataStartIndex, finalMapping);

        switch (sniffed.fileKind) {
          case "mc16":
            uploadMC16(data as Mc16Row[]);
            break;
          case "pms":
            uploadPMS(data as PmsRow[]);
            break;
          case "mrp":
            uploadMRP(data as MrpRow[]);
            break;
          case "sc":
            uploadSC(data as ScRow[]);
            break;
          case "backlog":
            uploadBacklog(data as BacklogRow[]);
            break;
        }

        addToast(
          `${file.name} → ${FILE_KIND_LABELS[sniffed.fileKind]} — ${data.length} rows${issues.length ? `, ${issues.length} skipped` : ""}`,
          issues.length ? "info" : "success",
        );

        if (issues.length) {
          await new Promise<void>((resolve) => {
            pendingIssuesResolve.current = resolve;
            setIssuesRequest({ fileName: file.name, issues });
          });
        }
      } catch (err) {
        addToast(`${file.name}: ${err instanceof Error ? err.message : "Could not parse file."}`, "error");
      }
    }
    setLoading(false);
  }

  return (
    <>
      <div
        className={`upload-zone ${dragOver ? "drag-over" : ""} ${compact ? "p-4" : "p-8"} text-center cursor-pointer`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) processFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <Icon
          name="upload"
          className={`mx-auto mb-2 ${loading ? "animate-spin" : ""} ${compact ? "w-5 h-5" : "w-8 h-8"}`}
        />
        <div className={compact ? "text-xs" : "text-sm"} style={{ color: "var(--text2)" }}>
          {loading ? "Parsing…" : "Drop MC16 / PMS / MRP / SC / Backlog files here, or click to browse"}
        </div>
        {!compact && (
          <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            .xlsx, .xls, .csv — file type &amp; columns are detected by header name, multiple files supported
          </div>
        )}
      </div>

      {reviewRequest && (
        <ColumnMappingPreview
          request={reviewRequest}
          onConfirm={(m) => {
            setReviewRequest(null);
            pendingMappingResolve.current?.(m);
          }}
          onCancel={() => {
            setReviewRequest(null);
            pendingMappingResolve.current?.(null);
          }}
        />
      )}

      {issuesRequest && (
        <ParseIssuesPanel
          fileName={issuesRequest.fileName}
          issues={issuesRequest.issues}
          onClose={() => {
            setIssuesRequest(null);
            pendingIssuesResolve.current?.();
          }}
        />
      )}
    </>
  );
}

const STATUS_MODULES = [
  { key: "mc16", label: "MC16" },
  { key: "pms", label: "PMS" },
  { key: "mrp", label: "MRP" },
  { key: "sc", label: "SC" },
] as const;

export function UploadStatusReport() {
  const { state } = useAppData();
  const todayStr = new Date().toISOString().slice(0, 10);

  const dots = STATUS_MODULES.map((m) => {
    const ts = state.lastUpload[m.key];
    const status = !ts ? "none" : ts.slice(0, 10) === todayStr ? "today" : "stale";
    return { ...m, status };
  });

  const allToday = dots.every((d) => d.status === "today");
  const anyLoaded = dots.some((d) => d.status !== "none");
  const banner = allToday ? "Optimal" : anyLoaded ? "Needs Update" : "Not Loaded";
  const bannerColor = allToday ? "var(--green)" : anyLoaded ? "var(--amber)" : "var(--muted)";

  return (
    <div className="flex items-center gap-3 flex-wrap text-xs">
      <span className="font-semibold" style={{ color: bannerColor }}>
        {banner}
      </span>
      {dots.map((d) => (
        <span key={d.key} className="flex items-center gap-1.5" style={{ color: "var(--text2)" }}>
          <span
            className="w-2 h-2 rounded-full"
            style={{
              background: d.status === "today" ? "var(--green)" : d.status === "stale" ? "var(--red)" : "var(--border2)",
            }}
          />
          {d.label}
        </span>
      ))}
    </div>
  );
}
