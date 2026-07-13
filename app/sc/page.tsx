"use client";

import { Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAppData } from "@/lib/state/AppDataContext";
import { useContacts } from "@/lib/state/ContactsContext";
import { daysLate, TODAY_STR } from "@/lib/utils/dates";
import { exportCSV } from "@/lib/utils/csv";
import { applyDateRange, DateRangeFilter } from "@/components/tables/DateRangeFilter";
import { CommentPanel } from "@/components/tables/CommentPanel";
import { TrackBtn } from "@/components/tracking/TrackBtn";
import { StatusBadge, MiniBadge } from "@/components/tables/StatusBadge";
import { RowDetailPanel, scDetailFields } from "@/components/tables/RowDetailPanel";
import { UploadZone } from "@/components/import/UploadZone";
import { SelectionBar } from "@/components/email/SelectionBar";
import { InlineEmailPanel } from "@/components/email/InlineEmailPanel";
import { genEmailsFromSCRows, type GeneratedEmail } from "@/lib/email/generators";
import { Icon } from "@/components/layout/Icon";
import type { ScRow } from "@/types";

function DaysBadge({ days }: { days: number | null | undefined }) {
  if (days === null || days === undefined || days < 0) {
    return <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>;
  }
  if (days === 0) return <MiniBadge label="Due today" color="yellow" />;
  const color = days >= 14 ? "red" : days >= 7 ? "yellow" : "red";
  return <MiniBadge label={`${days}d late`} color={color} />;
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("fr-CH");
}

function Th({ children }: { children: ReactNode }) {
  return <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">{children}</th>;
}

function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-6 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--card2)", border: "1px solid var(--border)" }}
          >
            <Icon name="layers" className="w-5 h-5" />
          </div>
          <div className="text-sm font-medium" style={{ color: "var(--muted)" }}>
            {label}
          </div>
        </div>
      </td>
    </tr>
  );
}

function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
        <Icon name="search" className="w-3 h-3" />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search…"}
        style={{ background: "var(--card)", color: "var(--text)", borderColor: "var(--border)" }}
        className="pl-8 pr-3 py-2.5 text-sm w-72 border rounded-lg focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:opacity-80 text-sm"
          style={{ color: "var(--muted)" }}
        >
          ×
        </button>
      )}
    </div>
  );
}

function ExportBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: "var(--card2)", color: "var(--text2)", borderColor: "var(--border)", borderWidth: 1, borderStyle: "solid" }}
      className="px-4 py-2 text-xs rounded-lg hover:opacity-80 flex items-center gap-2 whitespace-nowrap transition-all font-semibold"
    >
      <Icon name="download" className="w-3 h-3" />
      CSV
    </button>
  );
}

function FilterBtn({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${active ? "filter-btn-active" : "filter-btn"}`}
    >
      {label}
      {count !== undefined && <span className="ml-1.5 opacity-70">{count}</span>}
    </button>
  );
}

type ActiveFilter = "All" | "Late" | "NextWeek";

export default function ScPage() {
  const { state } = useAppData();
  const { contacts } = useContacts();

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("All");
  const [showCleared, setShowCleared] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emails, setEmails] = useState<GeneratedEmail[] | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const data = state.sc;
  const todayStr = TODAY_STR;
  const nextWeekEnd = useMemo(() => {
    const d = new Date(todayStr);
    d.setDate(d.getDate() + 6);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, [todayStr]);

  const base = useMemo(() => (showCleared ? data : data.filter((r) => r.rowStatus !== "Cleared")), [data, showCleared]);
  const active = useMemo(() => data.filter((r) => r.rowStatus !== "Cleared"), [data]);

  const counts = useMemo(
    () => ({
      All: active.length,
      Late: active.filter((r) => r.plannedReceiptDate && r.plannedReceiptDate <= todayStr).length,
      NextWeek: active.filter((r) => r.plannedReceiptDate && r.plannedReceiptDate > todayStr && r.plannedReceiptDate <= nextWeekEnd)
        .length,
    }),
    [active, todayStr, nextWeekEnd],
  );

  function setQuickFilter(val: ActiveFilter) {
    setActiveFilter(val);
    setDateFrom("");
    setDateTo("");
    setSelected(new Set());
    setEmails(null);
  }
  function setDateFromManual(v: string) {
    setDateFrom(v);
    if (v) {
      setActiveFilter("All");
      setSelected(new Set());
    }
  }
  function setDateToManual(v: string) {
    setDateTo(v);
    if (v) {
      setActiveFilter("All");
      setSelected(new Set());
    }
  }

  const filtered = useMemo(() => {
    let rows = base;
    if (dateFrom || dateTo) {
      rows = applyDateRange(rows as unknown as (ScRow & Record<string, unknown>)[], "plannedReceiptDate", dateFrom, dateTo) as ScRow[];
    } else if (activeFilter === "Late") {
      rows = rows.filter((r) => r.plannedReceiptDate && r.plannedReceiptDate <= todayStr);
    } else if (activeFilter === "NextWeek") {
      rows = rows.filter((r) => r.plannedReceiptDate && r.plannedReceiptDate > todayStr && r.plannedReceiptDate <= nextWeekEnd);
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        [r.scheduleNumber, r.supplierName, r.supplierNumber, r.itemNumber, r.itemDescription, r.comment].some((v) =>
          String(v ?? "").toLowerCase().includes(q),
        ),
      );
    }
    return rows;
  }, [base, activeFilter, dateFrom, dateTo, search, todayStr, nextWeekEnd]);

  function toggleRow(key: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }
  function selectAll() {
    setSelected(new Set(filtered.map((r, i) => `${r.scheduleNumber}-${i}`)));
  }
  function deselectAll() {
    setSelected(new Set());
  }
  function handleGenerate() {
    const rows: ScRow[] = filtered.filter((r, i) => selected.has(`${r.scheduleNumber}-${i}`));
    setEmails(genEmailsFromSCRows(rows, contacts));
  }

  const hasDateRange = !!(dateFrom || dateTo);

  return (
    <div className="flex flex-col gap-6 fade-in">
      <UploadZone compact />

      <div className="flex items-center gap-2 flex-wrap">
        <FilterBtn label="All" active={activeFilter === "All" && !hasDateRange} onClick={() => setQuickFilter("All")} count={counts.All} />
        <FilterBtn
          label="🔴 Late"
          active={activeFilter === "Late" && !hasDateRange}
          onClick={() => setQuickFilter(activeFilter === "Late" ? "All" : "Late")}
          count={counts.Late}
        />
        <FilterBtn
          label="📅 Next Week"
          active={activeFilter === "NextWeek" && !hasDateRange}
          onClick={() => setQuickFilter(activeFilter === "NextWeek" ? "All" : "NextWeek")}
          count={counts.NextWeek}
        />
        <label className="flex items-center gap-2 text-xs cursor-pointer select-none ml-2" style={{ color: "var(--muted)" }}>
          <input type="checkbox" checked={showCleared} onChange={(e) => setShowCleared(e.target.checked)} style={{ accentColor: "var(--amber)" }} />
          Show cleared
        </label>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search SC schedule lines…" />
        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          Planned Date:
        </span>
        <DateRangeFilter
          from={dateFrom}
          to={dateTo}
          onFrom={setDateFromManual}
          onTo={setDateToManual}
          onClear={() => {
            setDateFrom("");
            setDateTo("");
          }}
        />
        {hasDateRange && (
          <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: "var(--blue-dim)", color: "var(--blue)" }}>
            Custom date range active
          </span>
        )}
        <div className="ml-auto flex gap-3 items-center">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {filtered.length} rows
          </span>
          <ExportBtn
            onClick={() =>
              exportCSV(
                "sc_orders.csv",
                filtered.map((r) => ({
                  "Schedule #": r.scheduleNumber,
                  Supplier: r.supplierName,
                  "Supplier #": r.supplierNumber,
                  "Item #": r.itemNumber,
                  Description: r.itemDescription,
                  "Planned Date": r.plannedReceiptDate,
                  Status: r.status,
                  "Qty Scheduled": r.scheduleQuantity,
                  "Qty Delivered": r.quantityDelivered,
                  Comment: r.comment,
                })),
              )
            }
          />
        </div>
      </div>

      <SelectionBar count={selected.size} onGenerate={handleGenerate} onClear={deselectAll} label="Request Order Status by Email" />

      <div className="card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: 1020 }}>
            <thead>
              <tr>
                <th className="th-cell px-2" style={{ width: 32 }}>
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
                  />
                </th>
                <th className="th-cell" style={{ width: 32 }} />
                <Th>Schedule #</Th>
                <Th>Supplier</Th>
                <Th>Item #</Th>
                <Th>Description</Th>
                <Th>Planned Date</Th>
                <Th>Days Late</Th>
                <Th>Qty Sched</Th>
                <Th>Qty Del</Th>
                <Th>Status</Th>
                <Th>Comment</Th>
                <Th>Track</Th>
              </tr>
            </thead>
            <tbody className="row-alt">
              {filtered.length === 0 ? (
                <EmptyRow cols={12} label="No SC schedule lines match the current filter. Upload the schedule-lines export." />
              ) : (
                filtered.map((row, i) => {
                  const key = `${row.scheduleNumber}-${i}`;
                  const late = !!row.plannedReceiptDate && row.plannedReceiptDate <= todayStr && row.rowStatus !== "Cleared";
                  const dLate = row.plannedReceiptDate ? daysLate(row.plannedReceiptDate) : null;
                  const sel = selected.has(key);
                  const cleared = row.rowStatus === "Cleared";
                  const scKey = `${row.scheduleNumber}_${row.itemNumber}_${row.plannedReceiptDate}`;
                  return (
                    <Fragment key={key}>
                      <tr
                        className={`row-alt ${cleared ? "opacity-30" : ""} ${late ? "row-red" : ""}`}
                        onClick={() => {
                          if (!cleared) toggleRow(key);
                        }}
                        style={{ cursor: cleared ? "default" : "pointer", background: sel ? "var(--blue-dim)" : undefined }}
                      >
                        <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                          {!cleared && <input type="checkbox" checked={sel} onChange={() => toggleRow(key)} />}
                        </td>
                        <td style={{ padding: "4px 6px", width: 32 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setExpandedRow(expandedRow === key ? null : key)}
                            title="View details"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              opacity: 0.55,
                              padding: 2,
                              lineHeight: 1,
                              transition: "transform 0.2s",
                              transform: expandedRow === key ? "rotate(90deg)" : "none",
                            }}
                          >
                            <Icon name="chevron" className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--blue)", whiteSpace: "nowrap" }} className="font-mono text-xs">
                          {row.scheduleNumber}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontSize: 12, fontWeight: sel ? 700 : 500, color: "var(--text)" }}>{row.supplierName}</div>
                          {row.supplierNumber && (
                            <div className="font-mono" style={{ fontSize: 10.5, color: "var(--muted)" }}>
                              {row.supplierNumber}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px 14px", color: "var(--amber)", whiteSpace: "nowrap" }} className="font-mono text-xs">
                          {row.itemNumber}
                        </td>
                        <td
                          style={{ padding: "10px 14px", fontSize: 11.5, color: "var(--muted)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={row.itemDescription}
                        >
                          {row.itemDescription}
                        </td>
                        <td
                          style={{ padding: "10px 14px", fontWeight: 500, color: late ? "var(--red)" : "var(--text2)", whiteSpace: "nowrap" }}
                          className="font-mono text-xs"
                        >
                          {row.plannedReceiptDate || "—"}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <DaysBadge days={dLate} />
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right" }} className="font-mono text-xs">
                          {fmtNum(row.scheduleQuantity)}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right" }} className="font-mono text-xs">
                          {fmtNum(row.quantityDelivered)}
                          {row.isPartialDelivery && (
                            <span className="ml-1">
                              <MiniBadge label="Partial" color="yellow" />
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <StatusBadge status={row.status} />
                        </td>
                        <td style={{ padding: "10px 14px" }} onClick={(e) => e.stopPropagation()}>
                          <CommentPanel module="sc" rowKey={scKey} value={row.comment} />
                        </td>
                        <td style={{ padding: "10px 14px" }} onClick={(e) => e.stopPropagation()}>
                          <TrackBtn poRef={scKey} orderRef={row.scheduleNumber} supplierName={row.supplierName} commentStoreKey={`sc:${scKey}`} />
                        </td>
                      </tr>
                      {expandedRow === key && <RowDetailPanel fields={scDetailFields(row)} colSpan={12} storeKey={`sc:${scKey}`} />}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {emails && <InlineEmailPanel emails={emails} onClear={() => setEmails(null)} />}
    </div>
  );
}
