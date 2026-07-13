"use client";

import { useMemo, useState } from "react";
import type { Mc16Row } from "@/types";
import { useAppData } from "@/lib/state/AppDataContext";
import { useSort } from "@/hooks/useSort";
import { daysDiff, formatDateHuman } from "@/lib/utils/dates";
import { exportCSV } from "@/lib/utils/csv";
import { applyDateRange, DateRangeFilter } from "@/components/tables/DateRangeFilter";
import { CommentPanel } from "@/components/tables/CommentPanel";
import { StatusBadge } from "@/components/tables/StatusBadge";
import { UploadZone } from "@/components/import/UploadZone";
import { Icon } from "@/components/layout/Icon";
import { UrgencyFilterBar, type Urgency } from "@/components/mc16/UrgencyFilterBar";
import { OosBadge } from "@/components/mc16/OosBadge";

// useSort/applyDateRange's generic constraint (`T extends Record<string, unknown>`) requires
// an index signature that Mc16Row doesn't declare; intersecting with Record<string, unknown>
// here satisfies the constraint at the call sites without touching the shared hooks.
type SortableMc16Row = Mc16Row & Record<string, unknown>;

export default function Mc16Page() {
  const { state } = useAppData();
  const data = state.mc16 as SortableMc16Row[];

  const [search, setSearch] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [urgency, setUrgency] = useState<Urgency>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { field, dir, toggle, sort } = useSort<SortableMc16Row>("outOfStockDate", "asc");

  const filtered = useMemo(() => {
    let rows = showResolved ? data : data.filter((r) => r.status !== "Resolved");
    if (urgency === "Critical") {
      rows = rows.filter((r) => {
        const d = daysDiff(r.outOfStockDate);
        return !Number.isNaN(d) && d <= 7;
      });
    } else if (urgency === "Warning") {
      rows = rows.filter((r) => {
        const d = daysDiff(r.outOfStockDate);
        return !Number.isNaN(d) && d > 7 && d <= 14;
      });
    } else if (urgency === "OK") {
      rows = rows.filter((r) => {
        const d = daysDiff(r.outOfStockDate);
        return !Number.isNaN(d) && d > 14;
      });
    }
    rows = applyDateRange(rows, "outOfStockDate", dateFrom, dateTo);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        [r.articleNumber, r.articleName, r.articleDescription, r.comment, r.status].some((v) =>
          String(v ?? "").toLowerCase().includes(q),
        ),
      );
    }
    return sort(rows);
  }, [data, search, showResolved, urgency, dateFrom, dateTo, sort]);

  const urgencyCounts = useMemo(() => {
    const active = data.filter((r) => r.status !== "Resolved");
    const critical = active.filter((r) => {
      const d = daysDiff(r.outOfStockDate);
      return !Number.isNaN(d) && d <= 7;
    }).length;
    const warning = active.filter((r) => {
      const d = daysDiff(r.outOfStockDate);
      return !Number.isNaN(d) && d > 7 && d <= 14;
    }).length;
    const ok = active.filter((r) => {
      const d = daysDiff(r.outOfStockDate);
      return !Number.isNaN(d) && d > 14;
    }).length;
    return { All: active.length, Critical: critical, Warning: warning, OK: ok } as Record<Urgency, number>;
  }, [data]);

  function handleExport() {
    exportCSV(
      "mc16_alerts.csv",
      filtered.map((r) => ({
        "Article #": r.articleNumber,
        Name: r.articleName,
        Description: r.articleDescription,
        "OOS Date": formatDateHuman(r.outOfStockDate),
        Status: r.status,
        Comment: r.comment,
      })),
    );
  }

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-xl font-display font-extrabold" style={{ color: "var(--text)" }}>
          MC16 Alerts
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          Out-of-stock exceptions from the MC16 report, ranked by urgency
        </p>
      </div>

      <UploadZone compact />

      <UrgencyFilterBar active={urgency} onChange={setUrgency} counts={urgencyCounts} />

      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
            <Icon name="search" className="w-3 h-3" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search MC16 alerts…"
            className="pl-8 pr-3 py-2.5 text-sm w-72 rounded-lg outline-none"
            style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)" }}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-80 text-sm"
              style={{ color: "var(--muted)" }}
            >
              ×
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            OOS Date:
          </span>
          <DateRangeFilter
            from={dateFrom}
            to={dateTo}
            onFrom={setDateFrom}
            onTo={setDateTo}
            onClear={() => {
              setDateFrom("");
              setDateTo("");
            }}
          />
        </div>

        <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: "var(--muted)" }}>
          <input
            type="checkbox"
            checked={showResolved}
            onChange={(e) => setShowResolved(e.target.checked)}
            style={{ accentColor: "var(--amber)" }}
          />
          Show resolved
        </label>

        <div className="ml-auto flex gap-3 items-center">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {filtered.length} rows
          </span>
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 text-xs rounded-lg hover:opacity-80 flex items-center gap-2 whitespace-nowrap transition-all font-semibold"
            style={{ background: "var(--card2)", color: "var(--text2)", border: "1px solid var(--border)" }}
          >
            <Icon name="download" className="w-3 h-3" />
            CSV
          </button>
        </div>
      </div>

      <div className="card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[880px]">
            <thead>
              <tr>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Article #</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Name</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Description</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggle("outOfStockDate")}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  >
                    OOS Date
                    <span className="text-xs opacity-50">
                      {field === "outOfStockDate" ? (dir === "asc" ? "↑" : "↓") : "↕"}
                    </span>
                  </button>
                </th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Days Until OOS</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Status</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Comment</th>
              </tr>
            </thead>
            <tbody className="row-alt">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: "var(--card2)", border: "1px solid var(--border)" }}
                      >
                        <Icon name="alert" className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                        No MC16 alerts. Upload the exceptions file.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const resolved = row.status === "Resolved";
                  const d = daysDiff(row.outOfStockDate);
                  const accent = !resolved && !Number.isNaN(d) && d <= 7 ? "row-red" : !resolved && !Number.isNaN(d) && d <= 14 ? "row-amber" : "";
                  return (
                    <tr key={row.articleNumber} className={`row-alt ${resolved ? "opacity-40" : ""} ${accent}`}>
                      <td className={`px-4 py-3 font-mono text-xs font-semibold ${resolved ? "line-through" : ""}`} style={{ color: "var(--amber)" }}>
                        {row.articleNumber}
                      </td>
                      <td className={`px-4 py-3 font-medium text-xs ${resolved ? "line-through" : ""}`}>{row.articleName}</td>
                      <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: "var(--muted)" }}>
                        {row.articleDescription}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text2)" }}>
                        {formatDateHuman(row.outOfStockDate)}
                      </td>
                      <td className="px-4 py-3">
                        <OosBadge days={d} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3">
                        <CommentPanel module="mc16" rowKey={row.articleNumber} value={row.comment} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
