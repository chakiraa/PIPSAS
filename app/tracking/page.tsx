"use client";

import { useShipmentsContext } from "@/lib/state/ShipmentsContext";
import { CARRIERS } from "@/lib/tracking/carriers";
import { Icon } from "@/components/layout/Icon";
import type { Shipment } from "@/types";

export default function TrackingPage() {
  const { shipments, removeShipment } = useShipmentsContext();

  const savedList = Object.entries(shipments || {}).sort((a, b) => (b[1].updatedAt || "").localeCompare(a[1].updatedAt || ""));

  function openShipment(entry: Shipment) {
    const url = entry.trackingUrl || CARRIERS.find((c) => c.id === entry.carrier)?.url;
    if (url) window.open(url, "_blank");
  }

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-xl font-display font-extrabold" style={{ color: "var(--text)" }}>
          Tracking
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          Carrier portals and saved shipment references
        </p>
      </div>

      <div className="card rounded-xl px-5 py-4 flex items-center gap-4" style={{ borderLeft: "3px solid var(--blue)" }}>
        <Icon name="alert" className="w-4 h-4 flex-shrink-0" />
        <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
          Quick access to carrier portals. Use the <strong style={{ color: "var(--text)" }}>+ Track</strong> button on
          any MRP or SC order row to save a tracking reference per shipment.
        </span>
      </div>

      <div className="text-[10.5px] font-bold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
        Carrier Portals
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {CARRIERS.map((c) => (
          <a
            key={c.id}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="stat-card rounded-xl p-5 flex flex-col gap-3 hover:opacity-90 transition-all no-underline"
            style={{ borderLeft: `4px solid ${c.color}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: `${c.color}18`, border: `1px solid ${c.color}30` }}
              >
                {c.flag}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm leading-tight" style={{ color: "var(--text)" }}>
                  {c.name}
                </div>
                <div className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
                  {c.description}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="text-xs font-mono truncate" style={{ color: c.color }}>
                {c.url.replace("https://", "")}
              </span>
            </div>
          </a>
        ))}
      </div>

      <div className="text-[10.5px] font-bold tracking-widest uppercase mt-2 flex items-center gap-2" style={{ color: "var(--muted)" }}>
        Saved Shipments
        {savedList.length > 0 && <span style={{ color: "var(--blue)" }}>{savedList.length}</span>}
      </div>

      {savedList.length === 0 ? (
        <div className="card rounded-xl text-center" style={{ padding: "28px 20px" }}>
          <div className="text-[11.5px]" style={{ color: "var(--muted)" }}>
            No shipments saved yet — use the <strong style={{ color: "var(--text)" }}>Track</strong> button on any MRP
            or SC order row to add one.
          </div>
        </div>
      ) : (
        <div className="card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ minWidth: 680 }}>
              <thead>
                <tr>
                  <th className="th-cell text-left">PO / Schedule #</th>
                  <th className="th-cell text-left">Supplier</th>
                  <th className="th-cell text-left">Carrier</th>
                  <th className="th-cell text-left">Tracking Ref</th>
                  <th className="th-cell text-left">Saved</th>
                  <th className="th-cell text-right"></th>
                </tr>
              </thead>
              <tbody>
                {savedList.map(([poRef, entry]) => {
                  const carrier = CARRIERS.find((c) => c.id === entry.carrier);
                  const hasLink = !!(entry.trackingUrl || carrier?.url);
                  return (
                    <tr key={poRef} className="row-alt">
                      <td className="px-4 py-2.5 font-mono text-xs font-bold" style={{ color: "var(--blue)" }}>
                        {entry.orderRef || poRef}
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "var(--text)" }}>
                        {entry.supplierName || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        {carrier ? (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded"
                            style={{ background: `${carrier.color}18`, color: carrier.color }}
                          >
                            {carrier.name}
                          </span>
                        ) : (
                          <span className="text-xs" style={{ color: "var(--muted)" }}>
                            {entry.carrier || "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs" style={{ color: "var(--text2)" }}>
                        {entry.trackingRef || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted)" }}>
                        {entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString("fr-CH") : "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-1.5 justify-end">
                          {hasLink && (
                            <button
                              type="button"
                              onClick={() => openShipment(entry)}
                              className="px-2.5 py-1 rounded text-xs font-bold"
                              style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
                            >
                              Track ↗
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeShipment(poRef)}
                            className="px-2 py-1 rounded text-xs font-semibold"
                            style={{ background: "rgba(239,68,68,0.12)", color: "var(--red)" }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
