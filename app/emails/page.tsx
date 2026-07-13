"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/state/AppDataContext";
import { useContacts } from "@/lib/state/ContactsContext";
import {
  classifySignal,
  genEmailsFromMRPRows,
  genEmailsFromOverdueItems,
  genEmailsFromPMSRows,
  type GeneratedEmail,
  type OverdueLineItem,
} from "@/lib/email/generators";
import { InlineEmailPanel } from "@/components/email/InlineEmailPanel";
import { TODAY_STR, daysLate, stripTime, threeDaysAgo } from "@/lib/utils/dates";

type PresetId = "overdue" | "not_confirmed" | "pms_actions";

const PRESETS: { id: PresetId; icon: string; label: string; desc: string; color: string }[] = [
  { id: "overdue", icon: "🔴", label: "Overdue Deliveries", desc: "MRP + SC orders at or past planned date", color: "var(--red)" },
  { id: "not_confirmed", icon: "⏳", label: "Unconfirmed / Pending ≥3d", desc: "MRP orders with no confirmation or pending acceptance", color: "var(--amber)" },
  { id: "pms_actions", icon: "📡", label: "PMS Actions", desc: "Accelerate / Cancel / Delay from PMS Dashboard", color: "var(--blue)" },
];

export default function EmailsPage() {
  const { state } = useAppData();
  const { contacts } = useContacts();
  const [preset, setPreset] = useState<PresetId>("overdue");
  const [generated, setGenerated] = useState<GeneratedEmail[]>([]);
  const [genError, setGenError] = useState<string | null>(null);

  // threeDaysAgo() returns a Date 3 *business* days before today — used for
  // the "Unconfirmed ≥3 days" preset, ported exactly from the legacy tab.
  const thresholdDate = useMemo(() => stripTime(threeDaysAgo()), []);

  const counts = useMemo(() => {
    const overdueSet = new Set<string>([
      ...state.mrp.filter((r) => r.rowStatus !== "Closed" && r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR).map((r) => r.supplierName),
      ...state.sc.filter((r) => r.rowStatus !== "Cleared" && r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR).map((r) => r.supplierName),
    ]);
    const notConfSet = new Set<string>(
      state.mrp
        .filter(
          (r) =>
            r.rowStatus !== "Closed" &&
            (r.confirmationStatus === "Not Confirmed" || r.confirmationStatus === "Pending Acceptance") &&
            r.orderDate &&
            r.orderDate <= thresholdDate,
        )
        .map((r) => r.supplierName),
    );
    // All PMS suppliers — the shared genEmailsFromPMSRows buckets every row via
    // classifySignal (including "Other"), so the preview count reflects that.
    const pmsSet = new Set<string>(state.pms.filter((r) => classifySignal(r.signal)).map((r) => r.supplier));
    return { overdue: overdueSet.size, not_confirmed: notConfSet.size, pms_actions: pmsSet.size };
  }, [state, thresholdDate]);

  function genOverdue(): GeneratedEmail[] {
    const items: OverdueLineItem[] = [
      ...state.mrp
        .filter((r) => r.rowStatus !== "Closed" && r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR)
        .map((r) => ({
          supplierName: r.supplierName || "Unknown",
          ref: r.orderNumber,
          itemNumber: r.itemNumber,
          itemDescription: r.itemDescription,
          plannedReceiptDate: r.plannedReceiptDate,
          daysLate: daysLate(r.plannedReceiptDate),
        })),
      ...state.sc
        .filter((r) => r.rowStatus !== "Cleared" && r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR)
        .map((r) => ({
          supplierName: r.supplierName || "Unknown",
          ref: r.scheduleNumber,
          itemNumber: r.itemNumber,
          itemDescription: r.itemDescription,
          plannedReceiptDate: r.plannedReceiptDate,
          daysLate: daysLate(r.plannedReceiptDate),
        })),
    ];
    return genEmailsFromOverdueItems(items, contacts);
  }

  function genNotConfirmed(): GeneratedEmail[] {
    const rows = state.mrp.filter(
      (r) =>
        r.rowStatus !== "Closed" &&
        (r.confirmationStatus === "Not Confirmed" || r.confirmationStatus === "Pending Acceptance") &&
        r.orderDate &&
        r.orderDate <= thresholdDate,
    );
    return genEmailsFromMRPRows(rows, contacts);
  }

  function generate() {
    try {
      let emails: GeneratedEmail[] = [];
      if (preset === "overdue") emails = genOverdue();
      if (preset === "not_confirmed") emails = genNotConfirmed();
      if (preset === "pms_actions") emails = genEmailsFromPMSRows(state.pms, contacts);
      setGenerated(emails);
      setGenError(null);
    } catch (err) {
      setGenerated([]);
      setGenError(`Generation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-xl font-display font-extrabold" style={{ color: "var(--text)" }}>
          Email Generator
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          One email per supplier — all matching lines grouped and localized
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PRESETS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setPreset(t.id);
              setGenerated([]);
              setGenError(null);
            }}
            className="rounded-xl p-5 text-left border-2 transition-all hover:opacity-90"
            style={{
              background: preset === t.id ? `color-mix(in srgb, ${t.color} 8%, var(--card))` : "var(--card)",
              borderColor: preset === t.id ? t.color : "var(--border)",
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">{t.icon}</span>
              <span className="text-sm font-semibold" style={{ color: preset === t.id ? t.color : "var(--text)" }}>
                {t.label}
              </span>
              <span
                className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: `color-mix(in srgb, ${t.color} 15%, transparent)`, color: t.color }}
              >
                {counts[t.id]} supplier{counts[t.id] !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              {t.desc}
            </div>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {!contacts.length && (
          <div className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg" style={{ background: "var(--card2)", color: "var(--muted)" }}>
            <span>💡</span>
            <span>
              Add contacts in <strong style={{ color: "var(--text)" }}>Supplier Directory</strong> to auto-fill email,
              name &amp; language.
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={generate}
          className="ml-auto px-5 py-2 text-sm font-semibold rounded-lg text-black flex items-center gap-2 hover:opacity-90 transition-opacity"
          style={{ background: "var(--amber)" }}
        >
          ✉ Generate Templates
        </button>
      </div>

      {genError && (
        <div className="card rounded-xl px-4 py-3 text-xs flex items-center gap-2" style={{ borderLeft: "3px solid var(--red)", color: "var(--red)" }}>
          <span>⚠</span>
          <span>{genError}</span>
          <button type="button" onClick={() => setGenError(null)} className="ml-auto opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {!genError && generated.length === 0 && (
        <div className="card rounded-xl p-16 text-center flex flex-col items-center gap-3">
          <div className="text-5xl opacity-10">✉</div>
          <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            No templates yet
          </div>
          <div className="text-xs max-w-xs leading-relaxed" style={{ color: "var(--muted)" }}>
            Select a type above and click &quot;Generate Templates&quot;. One email per supplier — all lines grouped.
          </div>
        </div>
      )}

      {!genError && generated.length > 0 && <InlineEmailPanel emails={generated} onClear={() => setGenerated([])} />}
    </div>
  );
}
