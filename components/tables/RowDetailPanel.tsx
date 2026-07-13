"use client";

import { useAppData } from "@/lib/state/AppDataContext";
import { CARRIERS } from "@/lib/tracking/carriers";
import type { MrpRow, ScRow } from "@/types";

/**
 * Expandable "ERP data fields + note history" panel shown when a row's
 * chevron is clicked, ported from the legacy PIP app's `RowDetailPanel`
 * (legacy/PIP_V8_AI_Assistant.html ~L2655-2749). Shared by the Backlog, MRP
 * and SC tabs — parameterized by a `fields` list rather than re-implemented
 * three times. Use `mrpDetailFields` / `scDetailFields` below to build the
 * field list for a given row (ported verbatim from legacy `mrpFields` /
 * `scFields`, including the "Not stored — add to parser." placeholders for
 * ERP fields the parsers don't currently capture).
 */

export interface DetailField {
  k: string;
  v: unknown;
}

export function mrpDetailFields(row: MrpRow): DetailField[] {
  return [
    { k: "Order Type", v: null },
    { k: "Planner", v: null },
    { k: "Purchase Department", v: null },
    { k: "Supplier Address", v: null },
    { k: "Line", v: null },
    { k: "Seq.", v: null },
    { k: "Order Reference Supplier", v: null },
    { k: "Conf. Del. Date Supplier", v: row.confDeliveryDateSupplier },
    { k: "Confirmed Quantity", v: row.confirmedQuantity },
    { k: "Confirm. Qty Accepted", v: null },
    {
      k: "Conf. Date Accepted",
      v: row.confDateAccepted === true ? "Yes" : row.confDateAccepted === false ? "No" : row.confDateAccepted,
    },
    { k: "Order Date", v: row.orderDate },
    { k: "Date réception confirmée", v: null },
    { k: "Date réception modifiée", v: null },
    { k: "Statistical Delivery Date", v: null },
    { k: "Current Plan. Rec. Date", v: row.plannedReceiptDate },
    { k: "Backorder Qty", v: null },
    { k: "Prix (unit price)", v: null },
    { k: "Unité de prix (price unit)", v: null },
    { k: "Orig. Drawing Index", v: null },
    { k: "Conf. Drawing Index", v: null },
    { k: "Curr. Drawing Index", v: null },
    { k: "Suppress Reschedule-In", v: null },
    { k: "Suppress Reschedule-Out", v: null },
    { k: "Suppress Cancel", v: null },
    { k: "Order Line Text", v: null },
    { k: "Free Text", v: null },
    { k: "Production Order", v: null },
    { k: "Arbeitsgang", v: null },
    { k: "Priority", v: null },
    { k: "Operated Item", v: null },
    { k: "Conditions de règlement", v: null },
    { k: "DT", v: null },
    { k: "Terms of Packaging", v: null },
    { k: "Purchase Acknowledgment", v: null },
    { k: "Remark", v: null },
    { k: "Confirmation Required", v: null },
    { k: "Date of Confirmation", v: null },
    { k: "Type of Conf.", v: null },
    { k: "Country of Origin", v: null },
    { k: "EDI ORDERS", v: null },
    { k: "EDI ORDCHG", v: null },
    { k: "Transmitted by EDI", v: null },
  ];
}

export function scDetailFields(row: ScRow): DetailField[] {
  return [
    { k: "Position", v: null },
    { k: "Requirement Type", v: null },
    { k: "Réception", v: null },
    { k: "Statut", v: row.status },
  ];
}

function fmtLogDate(ts: string): string {
  try {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts || "";
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(
      d.getHours(),
    ).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return ts || "";
  }
}

/** Small carrier pill for a note-history entry's tracking link, mirroring TrackBtn's own CarrierBadge. */
function LogCarrierBadge({ carrierId }: { carrierId: string }) {
  const carrier = CARRIERS.find((c) => c.id === carrierId);
  if (!carrier) {
    return (
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          padding: "1px 5px",
          borderRadius: 4,
          background: "rgba(107,114,128,0.15)",
          color: "#6b7280",
          border: "1px solid rgba(107,114,128,0.3)",
          letterSpacing: "0.04em",
        }}
      >
        {carrierId || "Track"}
      </span>
    );
  }
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: "1px 5px",
        borderRadius: 4,
        background: `${carrier.color}25`,
        color: carrier.color,
        border: `1px solid ${carrier.color}50`,
        letterSpacing: "0.04em",
      }}
    >
      {carrier.flag} {carrier.name}
    </span>
  );
}

export function RowDetailPanel({
  fields,
  colSpan,
  storeKey,
}: {
  fields: DetailField[];
  colSpan: number;
  /** Full, module-prefixed comment-store key, e.g. `mrp:123_456` or `sc:789_456_2026-07-01`. */
  storeKey: string;
}) {
  const { commentStore } = useAppData();
  const entry = commentStore[storeKey];
  const log = (entry?.log ?? []).slice().reverse();

  return (
    <tr style={{ background: "var(--row-alt)" }}>
      <td colSpan={colSpan} style={{ padding: 0, borderBottom: "1px solid var(--border)" }}>
        <div
          className="flex flex-wrap"
          style={{ padding: "20px 24px", background: "rgba(0,0,0,0.1)", borderLeft: "3px solid var(--blue)", gap: 40 }}
        >
          <div style={{ flex: 1, minWidth: 260 }}>
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
            >
              ERP Data Fields
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "8px 16px" }}>
              {fields.map((f) => {
                const has = f.v !== null && f.v !== undefined && f.v !== "";
                return (
                  <div
                    key={f.k}
                    className="flex justify-between"
                    style={{ borderBottom: "1px solid var(--border2)", paddingBottom: 4 }}
                  >
                    <span style={{ fontSize: 11.5, color: "var(--muted)", fontWeight: 500 }}>{f.k}</span>
                    <span
                      style={{
                        fontSize: 11.5,
                        color: has ? "var(--text)" : "var(--red)",
                        fontFamily: "var(--font-mono, monospace)",
                        opacity: has ? 1 : 0.6,
                        textAlign: "right",
                        paddingLeft: 12,
                      }}
                    >
                      {has ? String(f.v) : "Not stored — add to parser."}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ width: 320, flexShrink: 0, borderLeft: "1px solid var(--border)", paddingLeft: 24 }}>
            <div
              className="text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{ color: "var(--muted)", letterSpacing: "0.1em" }}
            >
              Note History {log.length > 0 && <span style={{ color: "var(--blue)", marginLeft: 6 }}>{log.length}</span>}
            </div>
            {log.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>No notes yet.</div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: "auto", paddingRight: 8 }}>
                {log.map((e, i) => (
                  <div
                    key={i}
                    style={{ marginBottom: 8, padding: "8px 10px", borderRadius: 8, background: "var(--card2)", border: "1px solid var(--border)" }}
                  >
                    <div style={{ fontSize: 9.5, color: "var(--muted)", marginBottom: 3 }}>
                      {fmtLogDate(e.ts)}
                      {e.statusAtTime ? ` · ${e.statusAtTime}` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5, marginBottom: e.tracking ? 5 : 0 }}>
                      {e.text || <em style={{ color: "var(--muted)" }}>—</em>}
                    </div>
                    {e.tracking && (
                      <div className="flex items-center" style={{ gap: 6 }}>
                        {e.carrier && <LogCarrierBadge carrierId={e.carrier} />}
                        <a
                          href={e.tracking}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center"
                          style={{ fontSize: 10.5, color: "var(--blue)", textDecoration: "none", gap: 3 }}
                        >
                          Open tracking ↗
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}
