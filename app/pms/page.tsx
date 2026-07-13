"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/state/AppDataContext";
import { useContacts } from "@/lib/state/ContactsContext";
import { exportCSV } from "@/lib/utils/csv";
import { applyDateRange, DateRangeFilter } from "@/components/tables/DateRangeFilter";
import { UploadZone } from "@/components/import/UploadZone";
import { Icon } from "@/components/layout/Icon";
import { SelectionBar } from "@/components/email/SelectionBar";
import { InlineEmailPanel } from "@/components/email/InlineEmailPanel";
import { genEmailsFromPMSRows, type GeneratedEmail } from "@/lib/email/generators";
import { SignalBadge } from "@/components/pms/SignalBadge";
import { SignalFilterBar } from "@/components/pms/SignalFilterBar";
import type { PmsRow } from "@/types";

/** Canonical sort order for the dynamic signal filter buttons — ported from legacy `SIGNAL_ORDER`. */
const SIGNAL_ORDER = [
  "release",
  "delayed release",
  "delayed rel",
  "delayed rele",
  "prio release too late",
  "prio release toolate",
  "cancel",
  "accelerate",
  "delay",
];
function signalSortKey(s: string): number {
  const k = (s || "").toLowerCase();
  const i = SIGNAL_ORDER.findIndex((o) => k === o || k.startsWith(o) || o.startsWith(k));
  return i === -1 ? 99 : i;
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("fr-CH");
}

function rowKey(row: PmsRow, i: number): string {
  return `${row.poNumber}-${row.itemNumber}-${i}`;
}

// applyDateRange's generic constraint (`T extends Record<string, unknown>`) requires an index
// signature that PmsRow doesn't declare; intersecting with Record<string, unknown> here
// satisfies the constraint at the call site without touching the shared hook.
type SortablePmsRow = PmsRow & Record<string, unknown>;

export default function PmsPage() {
  const { state } = useAppData();
  const { contacts } = useContacts();
  const data = state.pms as SortablePmsRow[];

  const [search, setSearch] = useState("");
  const [activeSignal, setActiveSignal] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [emails, setEmails] = useState<GeneratedEmail[] | null>(null);

  // Build the unique signal list + counts directly from the loaded data — no hardcoded strings.
  const { signalList, counts } = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((r) => {
      const s = (r.signal || "").trim();
      if (!s) return;
      map[s] = (map[s] || 0) + 1;
    });
    const list = Object.keys(map).sort((a, b) => signalSortKey(a) - signalSortKey(b));
    return { signalList: list, counts: { All: data.length, ...map } };
  }, [data]);

  const filtered = useMemo(() => {
    let rows = activeSignal === "All" ? data : data.filter((r) => (r.signal || "").trim() === activeSignal);
    rows = applyDateRange(rows, "newDate", dateFrom, dateTo);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
        [r.signal, r.supplier, r.itemNumber, r.poNumber, r.oldDate, r.newDate, r.orderStatus].some((v) =>
          String(v ?? "").toLowerCase().includes(q),
        ),
      );
    }
    return rows;
  }, [data, search, activeSignal, dateFrom, dateTo]);

  // Reset row selection + any generated emails whenever the filter criteria change — mirrors
  // legacy's `useEffect(() => { setSelected(new Set()); setEmails(null); }, [activeSignal, ...])`.
  // Done as a render-time state adjustment (React's recommended alternative to that effect
  // pattern) instead of useEffect, to avoid the extra post-commit render pass.
  const filterKey = `${activeSignal}|${search}|${dateFrom}|${dateTo}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setSelected(new Set());
    setEmails(null);
  }

  function toggleRow(key: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }
  function selectAll() {
    setSelected(new Set(filtered.map((r, i) => rowKey(r, i))));
  }
  function deselectAll() {
    setSelected(new Set());
  }
  function handleGenerate() {
    const rows = filtered.filter((r, i) => selected.has(rowKey(r, i)));
    setEmails(genEmailsFromPMSRows(rows, contacts));
  }

  function handleExport() {
    exportCSV(
      "pms_dashboard.csv",
      filtered.map((r) => ({
        Signal: r.signal,
        Supplier: r.supplier,
        "Supplier #": r.supplierNum,
        "Item #": r.itemNumber,
        "Item Description": r.itemDescription,
        "PO Number": r.poNumber,
        "PO Line": r.poLine,
        "Old Date": r.oldDate,
        "New Date": r.newDate,
        "Old Qty": r.oldQty,
        "New Qty": r.newQty,
        Status: r.orderStatus,
      })),
    );
  }

  const allSelected = selected.size === filtered.length && filtered.length > 0;

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-xl font-display font-extrabold" style={{ color: "var(--text)" }}>
          PSM Dashboard
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          Purchase signal messages from Infor LN — accelerate, cancel and delay requests
        </p>
      </div>

      <UploadZone compact />

      <div className="flex items-center gap-3 flex-wrap">
        <SignalFilterBar signals={signalList} active={activeSignal} counts={counts} onChange={setActiveSignal} />
        <div className="ml-auto flex gap-3 items-center">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
              <Icon name="search" className="w-3 h-3" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search PMS…"
              className="pl-8 pr-3 py-2 text-xs w-48 rounded-lg outline-none"
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

      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          New Date:
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
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {filtered.length} rows
        </span>
      </div>

      <SelectionBar count={selected.size} onGenerate={handleGenerate} onClear={deselectAll} />

      <div className="card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[920px]">
            <thead>
              <tr>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => (e.target.checked ? selectAll() : deselectAll())}
                  />
                </th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Signal</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Supplier</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Item #</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">PO Number</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Old Date</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">New Date</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Old Qty</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">New Qty</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody className="row-alt">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{ background: "var(--card2)", border: "1px solid var(--border)" }}
                      >
                        <Icon name="radio" className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                        No PMS data. Upload the PMS Dashboard CSV.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => {
                  const key = rowKey(row, i);
                  const sel = selected.has(key);
                  return (
                    <tr
                      key={key}
                      className={`row-alt ${sel ? "row-blue" : ""}`}
                      onClick={() => toggleRow(key)}
                      style={{ cursor: "pointer", background: sel ? "var(--row-hover)" : undefined }}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={sel} onChange={() => toggleRow(key)} />
                      </td>
                      <td className="px-4 py-3">
                        <SignalBadge signal={row.signal} />
                      </td>
                      <td className="px-4 py-3 font-medium text-xs">{row.supplier}</td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--amber)" }}>
                        {row.itemNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--blue)" }}>
                        {row.poNumber}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>
                        {row.oldDate || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text2)" }}>
                        {row.newDate || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{fmtNum(row.oldQty)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{fmtNum(row.newQty)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                        {row.orderStatus}
                      </td>
                    </tr>
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
