"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAppData } from "@/lib/state/AppDataContext";
import { useContacts } from "@/lib/state/ContactsContext";
import { useSolved } from "@/lib/state/SolvedContext";
import { daysLate as calcDaysLate, TODAY_STR, formatDateHuman } from "@/lib/utils/dates";
import { exportCSV } from "@/lib/utils/csv";
import { applyDateRange, DateRangeFilter } from "@/components/tables/DateRangeFilter";
import { CommentPanel } from "@/components/tables/CommentPanel";
import { IOSToggle } from "@/components/tables/IOSToggle";
import { TrackBtn } from "@/components/tracking/TrackBtn";
import { StatusBadge, MiniBadge } from "@/components/tables/StatusBadge";
import { RowDetailPanel, mrpDetailFields, scDetailFields } from "@/components/tables/RowDetailPanel";
import { UploadZone } from "@/components/import/UploadZone";
import { SelectionBar } from "@/components/email/SelectionBar";
import { InlineEmailPanel } from "@/components/email/InlineEmailPanel";
import { genEmailsFromOverdueItems, type GeneratedEmail, type OverdueLineItem } from "@/lib/email/generators";
import { Icon } from "@/components/layout/Icon";
import type { MrpRow, ScRow } from "@/types";

/* ── Days-late pill, ported from legacy DaysBdg(mode:'late') ──
   days === null/undefined or < 0 -> em dash. days === 0 -> "Due today".
   days > 0 -> "{days}d late", red except a 7-13 day yellow band (legacy quirk, preserved). */
function DaysBadge({ days }: { days: number | null | undefined }) {
  if (days === null || days === undefined || days < 0) {
    return <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>;
  }
  if (days === 0) return <MiniBadge label="Due today" color="yellow" />;
  const color = days >= 14 ? "red" : days >= 7 ? "yellow" : "red";
  return <MiniBadge label={`${days}d late`} color={color} />;
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
            <Icon name="clock" className="w-5 h-5" />
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

type SourceFilter = "All" | "MRP" | "SC";

interface CombinedRow {
  source: "MRP" | "SC";
  ref: string;
  supplierName: string;
  supplierNumber: string;
  itemNumber: string;
  itemDescription: string;
  plannedReceiptDate: string;
  daysLate: number | null;
  confirmationStatus?: string;
  comment: string;
  key: string; // unprefixed stable key, shared with comments/solved-state
  module: "mrp" | "sc";
  origRow: MrpRow | ScRow;
}

export default function BacklogPage() {
  const { state } = useAppData();
  const { contacts } = useContacts();
  const { solved, toggleSolved } = useSolved();

  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [hideSolved, setHideSolved] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emails, setEmails] = useState<GeneratedEmail[] | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Derived view: active MRP + active SC rows with a planned receipt date on
  // or before today, sorted most-overdue first. This tab does NOT read
  // state.backlog — that legacy XLSX format is a separate, vestigial path.
  const combined = useMemo<CombinedRow[]>(() => {
    const mrpRows: CombinedRow[] = state.mrp
      .filter((r) => r.rowStatus !== "Closed" && r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR)
      .map((r) => ({
        source: "MRP" as const,
        ref: r.orderNumber,
        supplierName: r.supplierName,
        supplierNumber: r.supplierNumber,
        itemNumber: r.itemNumber,
        itemDescription: r.itemDescription,
        plannedReceiptDate: r.plannedReceiptDate,
        daysLate: calcDaysLate(r.plannedReceiptDate),
        confirmationStatus: r.confirmationStatus,
        comment: r.comment,
        key: `${r.orderNumber}_${r.itemNumber}`,
        module: "mrp" as const,
        origRow: r,
      }));
    const scRows: CombinedRow[] = state.sc
      .filter((r) => r.rowStatus !== "Cleared" && r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR)
      .map((r) => ({
        source: "SC" as const,
        ref: r.scheduleNumber,
        supplierName: r.supplierName,
        supplierNumber: r.supplierNumber,
        itemNumber: r.itemNumber,
        itemDescription: r.itemDescription,
        plannedReceiptDate: r.plannedReceiptDate,
        daysLate: calcDaysLate(r.plannedReceiptDate),
        comment: r.comment,
        key: `${r.scheduleNumber}_${r.itemNumber}_${r.plannedReceiptDate}`,
        module: "sc" as const,
        origRow: r,
      }));
    // Keep original sort order (most late first) — solved rows stay in place, just dimmed
    return [...mrpRows, ...scRows].sort((a, b) => (b.daysLate || 0) - (a.daysLate || 0));
  }, [state.mrp, state.sc]);

  const filtered = useMemo(() => {
    let rows = combined;
    if (hideSolved) rows = rows.filter((r) => !solved.has(r.key));
    if (sourceFilter !== "All") rows = rows.filter((r) => r.source === sourceFilter);
    rows = applyDateRange(rows as unknown as (CombinedRow & Record<string, unknown>)[], "plannedReceiptDate", dateFrom, dateTo) as CombinedRow[];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        [r.source, r.ref, r.supplierName, r.supplierNumber, r.itemNumber, r.itemDescription, r.comment].some((v) =>
          String(v ?? "").toLowerCase().includes(q),
        ),
      );
    }
    return rows;
  }, [combined, search, sourceFilter, dateFrom, dateTo, hideSolved, solved]);

  const counts = useMemo(
    () => ({
      All: combined.length,
      MRP: combined.filter((r) => r.source === "MRP").length,
      SC: combined.filter((r) => r.source === "SC").length,
    }),
    [combined],
  );

  const solvedCount = useMemo(() => [...solved].filter((k) => combined.some((r) => r.key === k)).length, [solved, combined]);

  useEffect(() => {
    // Reset selection/generated emails whenever the visible row set changes underneath them.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(new Set());
    setEmails(null);
  }, [sourceFilter, search, dateFrom, dateTo]);

  function toggleRow(key: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }
  function selectAll() {
    setSelected(new Set(filtered.map((r) => r.key)));
  }
  function deselectAll() {
    setSelected(new Set());
  }
  function handleGenerate() {
    const rows = filtered.filter((r) => selected.has(r.key));
    const items: OverdueLineItem[] = rows.map((r) => ({
      supplierName: r.supplierName,
      ref: r.ref,
      itemNumber: r.itemNumber,
      itemDescription: r.itemDescription,
      plannedReceiptDate: r.plannedReceiptDate,
      daysLate: r.daysLate,
    }));
    setEmails(genEmailsFromOverdueItems(items, contacts));
  }

  return (
    <div className="flex flex-col gap-6 fade-in">
      <UploadZone compact />

      <div className="card rounded-xl px-5 py-4 flex items-center gap-4" style={{ borderLeft: "3px solid var(--red)" }}>
        <span style={{ color: "var(--red)" }}>
          <Icon name="clock" className="w-3.5 h-3.5" />
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          All orders with planned receipt date ≤ today, sorted by days overdue.
          <span className="ml-1" style={{ color: "var(--text2)" }}>
            Use the toggle to mark handled lines as solved — your selection is saved automatically.
          </span>
        </span>
        {solvedCount > 0 && (
          <span
            className="ml-auto flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full font-mono"
            style={{ background: "rgba(16,185,129,0.12)", color: "var(--green)", border: "1px solid rgba(16,185,129,0.2)" }}
          >
            {solvedCount} solved
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(["All", "MRP", "SC"] as const).map((s) => (
          <FilterBtn key={s} label={s} active={sourceFilter === s} onClick={() => setSourceFilter(s)} count={counts[s]} />
        ))}
        {solvedCount > 0 && (
          <FilterBtn
            label={hideSolved ? `Show solved (${solvedCount})` : `Hide solved (${solvedCount})`}
            active={hideSolved}
            onClick={() => setHideSolved((h) => !h)}
          />
        )}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchBar value={search} onChange={setSearch} placeholder="Search overdue backlog…" />
        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          Planned Date:
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
        <div className="ml-auto flex gap-3 items-center">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {filtered.length} orders
          </span>
          <ExportBtn
            onClick={() =>
              exportCSV(
                "backlog_overdue.csv",
                filtered.map((r) => ({
                  Source: r.source,
                  Ref: r.ref,
                  Supplier: r.supplierName,
                  "Item #": r.itemNumber,
                  Description: r.itemDescription,
                  "Planned Date": formatDateHuman(r.plannedReceiptDate),
                  "Days Late": r.daysLate,
                  Solved: solved.has(r.key) ? "Yes" : "No",
                  Comment: r.comment,
                })),
              )
            }
          />
        </div>
      </div>

      <SelectionBar count={selected.size} onGenerate={handleGenerate} onClear={deselectAll} />

      <div className="card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[1160px]">
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
                <Th>Solved</Th>
                <Th>Source</Th>
                <Th>Ref #</Th>
                <Th>Supplier</Th>
                <Th>Item #</Th>
                <Th>Description</Th>
                <Th>Planned Date</Th>
                <Th>Days Late</Th>
                <Th>Conf. Status</Th>
                <Th>Comment</Th>
                <Th>Track</Th>
              </tr>
            </thead>
            <tbody className="row-alt">
              {filtered.length === 0 ? (
                <EmptyRow cols={12} label="No overdue orders. Upload MRP and SC files." />
              ) : (
                filtered.map((row) => {
                  const isSolved = solved.has(row.key);
                  const isSel = selected.has(row.key);
                  const rowClass = `row-alt ${isSolved ? "row-solved" : "row-red"}`;
                  return (
                    <Fragment key={`${row.source}-${row.key}`}>
                      <tr
                        className={rowClass}
                        onClick={() => {
                          if (!isSolved) toggleRow(row.key);
                        }}
                        style={{ cursor: isSolved ? "default" : "pointer", background: isSel ? "var(--blue-dim)" : undefined }}
                      >
                        <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                          {!isSolved && <input type="checkbox" checked={isSel} onChange={() => toggleRow(row.key)} />}
                        </td>
                        <td style={{ padding: "4px 6px", width: 32 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setExpandedRow(expandedRow === row.key ? null : row.key)}
                            title="View details"
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              opacity: 0.55,
                              padding: 2,
                              lineHeight: 1,
                              transition: "transform 0.2s",
                              transform: expandedRow === row.key ? "rotate(90deg)" : "none",
                            }}
                          >
                            <Icon name="chevron" className="w-3.5 h-3.5" />
                          </button>
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <IOSToggle checked={isSolved} onChange={() => toggleSolved(row.key)} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={row.source} />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: "var(--blue)" }}>
                          {row.ref}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs font-medium">{row.supplierName}</div>
                          {row.supplierNumber && (
                            <div className="font-mono text-xs" style={{ color: "var(--muted)" }}>
                              {row.supplierNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--amber)" }}>
                          {row.itemNumber}
                        </td>
                        <td className="px-4 py-3 text-xs max-w-[140px] truncate" style={{ color: "var(--muted)" }}>
                          {row.itemDescription}
                        </td>
                        <td
                          className="px-4 py-3 font-mono text-xs font-medium"
                          style={{ color: isSolved ? "var(--muted)" : "var(--red)" }}
                        >
                          {formatDateHuman(row.plannedReceiptDate)}
                        </td>
                        <td className="px-4 py-3">
                          <DaysBadge days={row.daysLate} />
                        </td>
                        <td className="px-4 py-3">
                          {row.source === "MRP" ? (
                            <StatusBadge status={row.confirmationStatus} />
                          ) : (
                            <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                          )}
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <CommentPanel module={row.module} rowKey={row.key} value={row.comment} />
                        </td>
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <TrackBtn
                            poRef={row.key}
                            orderRef={row.ref}
                            supplierName={row.supplierName}
                            commentStoreKey={`${row.module}:${row.key}`}
                          />
                        </td>
                      </tr>
                      {expandedRow === row.key && (
                        <RowDetailPanel
                          fields={row.source === "MRP" ? mrpDetailFields(row.origRow as MrpRow) : scDetailFields(row.origRow as ScRow)}
                          colSpan={12}
                          storeKey={`${row.module}:${row.key}`}
                        />
                      )}
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
