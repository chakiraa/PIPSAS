"use client";

import { useState, type FormEvent } from "react";
import { useShipmentsContext } from "@/lib/state/ShipmentsContext";
import { useAppData } from "@/lib/state/AppDataContext";
import { CARRIERS } from "@/lib/tracking/carriers";

function CarrierBadge({ carrierId }: { carrierId: string }) {
  const carrier = CARRIERS.find((c) => c.id === carrierId);
  if (!carrier) {
    return (
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        {carrierId}
      </span>
    );
  }
  return (
    <span
      className="text-xs font-semibold px-1.5 py-0.5 rounded inline-flex items-center gap-1"
      style={{ background: `${carrier.color}18`, color: carrier.color }}
    >
      {carrier.flag} {carrier.name}
    </span>
  );
}

/**
 * Inline "+ Track" button + modal, ported from the legacy PIP app's
 * `TrackBtn` component. Reusable on any MRP/SC/Backlog order row.
 *
 * `commentStoreKey` is an additive, optional prop (not in the legacy
 * signature) that lets a caller opt into the legacy fallback behavior of
 * reading tracking info surfaced via the latest comment-log entry that has
 * a `tracking` value, when no dedicated shipment has been saved yet.
 */
export function TrackBtn({
  poRef,
  supplierName,
  orderRef,
  commentStoreKey,
}: {
  poRef: string;
  supplierName?: string;
  orderRef?: string;
  commentStoreKey?: string;
}) {
  const { shipments, setShipment } = useShipmentsContext();
  const { commentStore } = useAppData();
  const [open, setOpen] = useState(false);

  const entry = shipments[poRef];
  const displayRef = orderRef || poRef;

  const commentEntry = commentStoreKey ? commentStore[commentStoreKey] : undefined;
  const commentTracking = commentEntry?.latestTracking || "";
  const commentCarrier =
    commentEntry?.log
      ?.slice()
      .reverse()
      .find((e) => e.tracking)?.carrier || "";

  const trackUrl = entry?.trackingUrl || commentTracking || "";
  const trackRef = entry?.trackingRef || "";
  const carrier = entry?.carrier || commentCarrier || "";
  const hasData = !!(trackRef || trackUrl);

  const carrierOpts = [{ id: "", label: "— Select carrier —" }, ...CARRIERS.map((c) => ({ id: c.id, label: c.name }))];

  function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const carrierVal = (form.elements.namedItem("carrier") as HTMLSelectElement).value;
    const trackingRefVal = (form.elements.namedItem("trackingRef") as HTMLInputElement).value.trim();
    const trackingUrlVal = (form.elements.namedItem("trackingUrl") as HTMLInputElement).value.trim();
    setShipment(poRef, {
      carrier: carrierVal,
      trackingRef: trackingRefVal,
      trackingUrl: trackingUrlVal,
      supplierName: supplierName || "",
      orderRef: displayRef,
      updatedAt: new Date().toISOString(),
    });
    setOpen(false);
  }

  function openLink() {
    if (trackUrl) {
      window.open(trackUrl, "_blank");
    } else {
      const c = CARRIERS.find((c) => c.id === carrier);
      if (c?.url) window.open(c.url, "_blank");
    }
  }

  return (
    <>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          title={hasData ? `Track: ${trackRef || carrier || "link saved"}` : "Add tracking"}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="inline-flex items-center gap-1 rounded-md font-semibold whitespace-nowrap"
          style={{
            padding: "3px 8px",
            fontSize: 10.5,
            background: hasData ? "rgba(16,185,129,0.15)" : "rgba(79,110,247,0.1)",
            color: hasData ? "#10b981" : "var(--blue)",
          }}
        >
          <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          {hasData ? trackRef || "🔗" : "+ Track"}
        </button>
        {hasData && carrier && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              openLink();
            }}
            style={{ cursor: trackUrl ? "pointer" : "default" }}
          >
            <CarrierBadge carrierId={carrier} />
          </span>
        )}
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="fade-in w-full m-4 rounded-2xl"
            style={{ maxWidth: 360, background: "var(--card)", border: "1px solid var(--border2)", padding: 24, boxShadow: "0 24px 64px rgba(0,0,0,0.7)" }}
          >
            <div className="flex justify-between items-start mb-5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--muted)" }}>
                  Shipment Tracking
                </div>
                <div className="text-[15px] font-extrabold" style={{ color: "var(--text)", fontFamily: "var(--font-mono)" }}>
                  {displayRef}
                </div>
                {supplierName && (
                  <div className="text-xs mt-0.5" style={{ color: "var(--text2)" }}>
                    {supplierName}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg flex-shrink-0"
                style={{ background: "var(--card2)", border: "1px solid var(--border)", color: "var(--muted)", padding: "5px 7px", lineHeight: 1 }}
              >
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
                  Carrier
                </label>
                <select
                  name="carrier"
                  defaultValue={entry?.carrier || ""}
                  className="w-full rounded-lg text-sm"
                  style={{ padding: "9px 11px", border: "1px solid var(--border)", background: "var(--card2)", color: "var(--text)" }}
                >
                  {carrierOpts.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
                  Tracking number
                </label>
                <input
                  name="trackingRef"
                  defaultValue={entry?.trackingRef || ""}
                  placeholder="e.g. 1Z999AA10123456784"
                  className="w-full rounded-lg text-sm box-border"
                  style={{ padding: "9px 11px", border: "1px solid var(--border)", background: "var(--card2)", color: "var(--text)" }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--muted)" }}>
                  Custom tracking URL <span className="font-normal">(optional)</span>
                </label>
                <input
                  name="trackingUrl"
                  defaultValue={entry?.trackingUrl || ""}
                  placeholder="https://..."
                  className="w-full rounded-lg text-sm box-border"
                  style={{ padding: "9px 11px", border: "1px solid var(--border)", background: "var(--card2)", color: "var(--text)" }}
                />
              </div>
              <div className="flex gap-2 mt-1">
                <button
                  type="submit"
                  className="flex-1 rounded-lg font-bold text-sm"
                  style={{ padding: 10, background: "var(--blue)", color: "#fff", boxShadow: "0 4px 14px rgba(79,110,247,0.35)" }}
                >
                  Save
                </button>
                {hasData && (
                  <button
                    type="button"
                    onClick={openLink}
                    className="flex-1 rounded-lg font-bold text-sm"
                    style={{ padding: 10, background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.25)" }}
                  >
                    Open Tracking ↗
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
