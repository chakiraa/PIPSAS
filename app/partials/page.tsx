"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/state/AppDataContext";
import { exportCSV } from "@/lib/utils/csv";
import { formatDateHuman } from "@/lib/utils/dates";
import { UploadZone } from "@/components/import/UploadZone";
import { Icon } from "@/components/layout/Icon";
import { StatusBadge } from "@/components/tables/StatusBadge";

interface PartialRow {
  source: "MRP" | "SC";
  orderRef: string;
  supplierName: string;
  supplierNumber: string;
  itemNumber: string;
  itemDescription: string;
  qtyOrdered: number;
  qtyDelivered: number;
  gap: number;
  plannedDate: string;
  comment: string;
  _key: string;
}

function fmtNum(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("fr-CH");
}

export default function PartialsPage() {
  const { state } = useAppData();
  const { mrp, sc } = state;
  const [search, setSearch] = useState("");

  const combined = useMemo<PartialRow[]>(() => {
    const mrpRows: PartialRow[] = mrp
      .filter((r) => r.isPartialDelivery && r.rowStatus !== "Closed")
      .map((r) => ({
        source: "MRP",
        orderRef: r.orderNumber,
        supplierName: r.supplierName,
        supplierNumber: r.supplierNumber,
        itemNumber: r.itemNumber,
        itemDescription: r.itemDescription,
        qtyOrdered: r.quantityOrdered,
        qtyDelivered: r.quantityDelivered,
        gap: r.quantityOrdered - r.quantityDelivered,
        plannedDate: r.plannedReceiptDate,
        comment: r.comment,
        _key: `MRP-${r.orderNumber}_${r.itemNumber}`,
      }));
    const scRows: PartialRow[] = sc
      .filter((r) => r.isPartialDelivery && r.rowStatus !== "Cleared")
      .map((r) => ({
        source: "SC",
        orderRef: r.scheduleNumber,
        supplierName: r.supplierName,
        supplierNumber: r.supplierNumber,
        itemNumber: r.itemNumber,
        itemDescription: r.itemDescription,
        qtyOrdered: r.scheduleQuantity,
        qtyDelivered: r.quantityDelivered,
        gap: r.scheduleQuantity - r.quantityDelivered,
        plannedDate: r.plannedReceiptDate,
        comment: r.comment,
        _key: `SC-${r.scheduleNumber}_${r.itemNumber}_${r.plannedReceiptDate}`,
      }));
    return [...mrpRows, ...scRows].sort((a, b) => b.gap - a.gap);
  }, [mrp, sc]);

  const filtered = useMemo(() => {
    if (!search) return combined;
    const q = search.toLowerCase();
    return combined.filter((r) =>
      [r.source, r.orderRef, r.supplierName, r.itemNumber, r.itemDescription, r.comment].some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      ),
    );
  }, [combined, search]);

  function handleExport() {
    exportCSV(
      "partial_deliveries.csv",
      filtered.map((r) => ({
        Source: r.source,
        "Order/Sched #": r.orderRef,
        Supplier: r.supplierName,
        "Item #": r.itemNumber,
        "Qty Ordered": r.qtyOrdered,
        "Qty Delivered": r.qtyDelivered,
        Gap: r.gap,
        "Planned Date": formatDateHuman(r.plannedDate),
        Comment: r.comment,
      })),
    );
  }

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-xl font-display font-extrabold" style={{ color: "var(--text)" }}>
          Partial Delivery SC
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          MRP + SC order lines with a delivered quantity below what was ordered, largest gap first
        </p>
      </div>

      <UploadZone compact />

      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
            <Icon name="search" className="w-3 h-3" />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partial deliveries…"
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
          <table className="w-full text-sm min-w-[1100px]">
            <thead>
              <tr>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Source</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Order/Sched #</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Supplier</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Item #</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Description</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Qty Ordered</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Qty Delivered</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Gap ↓</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Planned Date</th>
                <th className="th-cell px-4 py-2.5 text-left whitespace-nowrap">Comment</th>
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
                        <Icon name="split" className="w-5 h-5" />
                      </div>
                      <div className="text-sm font-medium" style={{ color: "var(--muted)" }}>
                        No partial deliveries found. Upload MRP and SC files.
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={`${row.source}-${row._key}`} className="row-alt row-amber">
                    <td className="px-4 py-3">
                      <StatusBadge status={row.source} />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold" style={{ color: "var(--blue)" }}>
                      {row.orderRef}
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
                    <td className="px-4 py-3 text-right font-mono text-xs">{fmtNum(row.qtyOrdered)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{fmtNum(row.qtyDelivered)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold" style={{ color: "var(--amber)" }}>
                      {fmtNum(row.gap)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>
                      {formatDateHuman(row.plannedDate)}
                    </td>
                    <td className="px-4 py-3 text-xs max-w-[180px]" style={{ color: row.comment ? "var(--text2)" : "var(--muted)" }}>
                      <span
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {row.comment || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
