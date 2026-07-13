"use client";

import { useRef, useState } from "react";
import { useProfile } from "@/lib/state/ProfileContext";
import { useToast } from "@/lib/state/ToastContext";
import { getInitials } from "@/lib/utils/text";
import { STORAGE_KEY, COMMENT_KEY_V2, SHIPMENT_KEY, TODO_KEY, TOGGLE_DATE_KEY, safeLoad } from "@/lib/storage/keys";
import { Icon } from "@/components/layout/Icon";

interface ProfileForm {
  fullName: string;
  discode: string;
  email: string;
  phone: string;
  language: string;
  signature: string;
}

const LANGUAGE_OPTIONS = ["Français (Régional)", "English (Global)", "Deutsch", "Italiano", "Español"];

const inputClass = "w-full rounded-lg text-sm outline-none transition-colors";
const inputStyle: React.CSSProperties = {
  background: "var(--card2)",
  border: "1px solid var(--border2)",
  color: "var(--text)",
  padding: "9px 12px",
};
const labelClass = "block text-[10px] font-bold tracking-widest uppercase mb-1.5";

export default function ProfilePage() {
  const { fullName, setFullName } = useProfile();
  const { addToast } = useToast();
  const [form, setForm] = useState<ProfileForm>({
    fullName: fullName || "Amine Chakir",
    discode: "XP-882-LDR",
    email: "a.chakir@pip-procurement.com",
    phone: "+41 26 484 00 00",
    language: "Français (Régional)",
    signature: `${fullName || "Amine Chakir"}\nProcurement Intelligence Analyst | PIP\nLiebherr Machines Bulle SA\n+41 26 484 00 00`,
  });
  const [saved, setSaved] = useState(false);
  const [backupMsg, setBackupMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  function save() {
    setFullName(form.fullName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleExport() {
    const backup = {
      version: 2,
      exportedAt: new Date().toISOString(),
      appState: safeLoad<unknown>(STORAGE_KEY, null),
      comments: safeLoad<Record<string, unknown>>(COMMENT_KEY_V2, {}),
      shipments: safeLoad<Record<string, unknown>>(SHIPMENT_KEY, {}),
      todos: safeLoad<unknown[]>(TODO_KEY, []),
      toggleDate: (typeof window !== "undefined" && localStorage.getItem(TOGGLE_DATE_KEY)) || null,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pip_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);

    const appState = backup.appState as { mrp?: unknown[]; sc?: unknown[]; mc16?: unknown[] } | null;
    const totalComments = Object.keys(backup.comments).length;
    const totalShipments = Object.keys(backup.shipments).length;
    const totalRows = appState ? (appState.mrp?.length || 0) + (appState.sc?.length || 0) + (appState.mc16?.length || 0) : 0;
    setBackupMsg({ ok: true, text: `Exported ${totalRows} orders, ${totalComments} comment(s), ${totalShipments} tracking entry(ies).` });
    addToast("Full app backup exported.", "success");
    setTimeout(() => setBackupMsg(null), 5000);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(String(ev.target?.result));
        if (!data.comments && !data.shipments && !data.appState) throw new Error("Unrecognised backup format");
        if (data.appState) localStorage.setItem(STORAGE_KEY, JSON.stringify(data.appState));
        if (data.comments) localStorage.setItem(COMMENT_KEY_V2, JSON.stringify(data.comments));
        if (data.shipments) localStorage.setItem(SHIPMENT_KEY, JSON.stringify(data.shipments));
        if (data.todos) localStorage.setItem(TODO_KEY, JSON.stringify(data.todos));
        if (data.toggleDate) localStorage.setItem(TOGGLE_DATE_KEY, data.toggleDate);

        const totalComments = Object.keys(data.comments || {}).length;
        const totalShipments = Object.keys(data.shipments || {}).length;
        const totalRows = data.appState
          ? (data.appState.mrp || []).length + (data.appState.sc || []).length + (data.appState.mc16 || []).length
          : 0;
        setBackupMsg({ ok: true, text: `Restored ${totalRows} orders, ${totalComments} comment(s), ${totalShipments} tracking entry(ies). Reloading…` });
        setTimeout(() => window.location.reload(), 1400);
      } catch {
        setBackupMsg({ ok: false, text: "Invalid backup file. Please use a file exported from this app." });
        addToast("Could not read that backup file.", "error");
        setTimeout(() => setBackupMsg(null), 5000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="fade-in flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-display font-extrabold" style={{ color: "var(--text)" }}>
            Settings &amp; Identity
          </h1>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            Manage your profile, preferences and default email signature
          </p>
        </div>
        <button
          type="button"
          onClick={save}
          className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
          style={{ background: "var(--blue)", color: "#fff" }}
        >
          {saved ? (
            <>
              <Icon name="check" className="w-3.5 h-3.5" />
              Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </button>
      </div>

      <div className="card rounded-xl" style={{ padding: 32, maxWidth: 700 }}>
        <div
          className="flex items-center gap-4 rounded-lg mb-7"
          style={{ padding: "16px 20px", background: "var(--card2)", border: "1px solid var(--border)" }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-base"
            style={{ background: "var(--grad-signature)" }}
          >
            {getInitials(form.fullName)}
          </div>
          <div>
            <div className="text-[15px] font-bold" style={{ color: "var(--text)" }}>
              {form.fullName || "—"}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--muted)" }}>
              Procurement Intelligence &middot; Liebherr Machines Bulle SA
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-7 gap-y-5 mb-5">
          {(
            [
              { label: "Full Name", key: "fullName", type: "text" },
              { label: "Disponent Code", key: "discode", type: "text" },
              { label: "Email Address", key: "email", type: "email" },
              { label: "Phone", key: "phone", type: "tel" },
            ] as { label: string; key: keyof ProfileForm; type: string }[]
          ).map((f) => (
            <div key={f.key}>
              <label className={labelClass} style={{ color: "var(--muted)" }}>
                {f.label}
              </label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        <div className="mb-5">
          <label className={labelClass} style={{ color: "var(--muted)" }}>
            Preferred Language
          </label>
          <select
            value={form.language}
            onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
            className={inputClass}
            style={inputStyle}
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        <div className="mb-7">
          <label className={labelClass} style={{ color: "var(--muted)" }}>
            Default Email Signature
          </label>
          <textarea
            rows={5}
            value={form.signature}
            onChange={(e) => setForm((p) => ({ ...p, signature: e.target.value }))}
            className={inputClass}
            style={{ ...inputStyle, fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.6, resize: "vertical" }}
          />
        </div>

        <div
          className="flex justify-between items-center flex-wrap gap-2 pt-4"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>
            PIP PROCUREMENT INTELLIGENCE PLATFORM © 2026
          </span>
          <span className="text-[10px] font-mono" style={{ color: "var(--muted)" }}>
            AI-ASSISTED BUILD
          </span>
        </div>
      </div>

      <div className="card rounded-xl" style={{ padding: 24, maxWidth: 700 }}>
        <div className="text-[11px] font-bold tracking-widest uppercase mb-1" style={{ color: "var(--muted)" }}>
          Full App Backup
        </div>
        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          Export or restore all uploaded ERP data, comments, tracking entries and to-do items as a single JSON file.
          Supplier contacts are stored separately and are not included in this backup.
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
            style={{ background: "var(--blue)", color: "#fff" }}
          >
            <Icon name="download" className="w-3.5 h-3.5" />
            Export Backup
          </button>
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            className="px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
            style={{ background: "var(--card2)", color: "var(--text)", border: "1px solid var(--border)" }}
          >
            <Icon name="upload" className="w-3.5 h-3.5" />
            Import Backup
          </button>
          <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
        {backupMsg && (
          <div
            className="mt-3 text-xs px-3 py-2 rounded-lg"
            style={{
              background: backupMsg.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: backupMsg.ok ? "#10b981" : "var(--red)",
            }}
          >
            {backupMsg.text}
          </div>
        )}
      </div>
    </div>
  );
}
