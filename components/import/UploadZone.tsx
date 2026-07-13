"use client";

import { useRef, useState } from "react";
import { detectAndParseFile } from "@/lib/parsers/detect";
import { useAppData } from "@/lib/state/AppDataContext";
import { useToast } from "@/lib/state/ToastContext";
import { Icon } from "@/components/layout/Icon";
import type { BacklogRow, Mc16Row, MrpRow, PmsRow, ScRow } from "@/types";

export function UploadZone({ compact = false }: { compact?: boolean }) {
  const { uploadMC16, uploadPMS, uploadBacklog, uploadMRP, uploadSC } = useAppData();
  const { addToast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFiles(files: FileList | File[]) {
    setLoading(true);
    for (const file of Array.from(files)) {
      try {
        const result = await detectAndParseFile(file);
        switch (result.module) {
          case "mc16":
            uploadMC16(result.data as Mc16Row[]);
            break;
          case "pms":
            uploadPMS(result.data as PmsRow[]);
            break;
          case "backlog":
            uploadBacklog(result.data as BacklogRow[]);
            break;
          case "mrp":
            uploadMRP(result.data as MrpRow[]);
            break;
          case "sc":
            uploadSC(result.data as ScRow[]);
            break;
        }
        addToast(`${file.name} → ${result.module.toUpperCase()} — ${result.count} rows`, "success");
      } catch (err) {
        addToast(`${file.name}: ${err instanceof Error ? err.message : "Could not parse file."}`, "error");
      }
    }
    setLoading(false);
  }

  return (
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
          .xlsx, .xls, .csv — file type is auto-detected, multiple files supported
        </div>
      )}
    </div>
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
