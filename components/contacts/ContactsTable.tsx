"use client";

import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import type { Contact } from "@/types";
import { useToast } from "@/lib/state/ToastContext";
import { Icon } from "@/components/layout/Icon";

const LANGS: { code: Contact["language"]; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "es", label: "Spanish" },
];

function normalizeLanguage(raw: string): Contact["language"] {
  const l = (raw || "").trim().toLowerCase();
  const found = LANGS.find((opt) => opt.code === l || opt.label.toLowerCase() === l);
  return (found?.code as Contact["language"]) || "en";
}

export function ContactsTable({
  contacts,
  setContacts,
}: {
  contacts: Contact[];
  setContacts: (next: Contact[] | ((prev: Contact[]) => Contact[])) => void;
}) {
  const { addToast } = useToast();
  const [search, setSearch] = useState("");
  const [dirty, setDirty] = useState(false);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) => [c.supplierName, c.contactName, c.contactEmail, c.notes].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [contacts, search]);

  function updateContact(idx: number, field: keyof Contact, val: string) {
    setContacts(contacts.map((c, i) => (i === idx ? { ...c, [field]: val } : c)));
    setDirty(true);
  }

  function addRow() {
    setContacts([...contacts, { supplierName: "", contactName: "", contactEmail: "", language: "en", notes: "" }]);
    setDirty(true);
  }

  function deleteRow(idx: number) {
    setContacts(contacts.filter((_, i) => i !== idx));
    setDirty(true);
  }

  function exportXLSX() {
    const rows = [
      ["COMPANY NAME", "CONTACT NAME", "CONTACT EMAIL", "LANGUAGE", "NOTES"],
      ...contacts.map((c) => [c.supplierName || "", c.contactName || "", c.contactEmail || "", c.language || "", c.notes || ""]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 35 }, { wch: 28 }, { wch: 38 }, { wch: 12 }, { wch: 40 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Suppliers");
    XLSX.writeFile(wb, "supplier-contacts.xlsx");
    setDirty(false);
    addToast("Supplier directory exported.", "success");
  }

  async function handleFile(file: File) {
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (raw.length < 2) {
        addToast("That file has no data rows.", "error");
        return;
      }
      const header = (raw[0] as unknown[]).map((h) => String(h).trim().toUpperCase());
      const col = (name: string) => header.findIndex((h) => h === name);
      const iCompany = col("COMPANY NAME");
      const iContact = col("CONTACT NAME");
      const iEmail = col("CONTACT EMAIL");
      const iLang = col("LANGUAGE");
      const iNotes = col("NOTES");

      const imported: Contact[] = [];
      for (let i = 1; i < raw.length; i++) {
        const r = raw[i];
        const company = String(r[iCompany] ?? "").trim();
        if (!company) continue;
        imported.push({
          supplierName: company,
          contactName: iContact >= 0 ? String(r[iContact] ?? "").trim() : "",
          contactEmail: iEmail >= 0 ? String(r[iEmail] ?? "").trim() : "",
          language: iLang >= 0 ? normalizeLanguage(String(r[iLang] ?? "").trim()) : "en",
          notes: iNotes >= 0 ? String(r[iNotes] ?? "").trim() : "",
        });
      }

      const merged = [...contacts];
      imported.forEach((imp) => {
        const idx = merged.findIndex((c) => (c.supplierName || "").toLowerCase() === imp.supplierName.toLowerCase());
        if (idx >= 0) merged[idx] = { ...merged[idx], ...imp };
        else merged.push(imp);
      });
      setContacts(merged);
      setDirty(false);
      addToast(`Imported ${imported.length} supplier(s).`, "success");
    } catch (err) {
      addToast(`Could not read XLSX file: ${err instanceof Error ? err.message : String(err)}`, "error");
    } finally {
      setImporting(false);
    }
  }

  function handleImportInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-stretch">
        <div className="card rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2.5 mb-3.5">
            <div
              className="w-[30px] h-[30px] rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(79,110,247,0.12)", border: "1px solid rgba(79,110,247,0.22)", color: "var(--blue)" }}
            >
              <Icon name="book" className="w-3.5 h-3.5" />
            </div>
            <span className="text-[13px] font-bold" style={{ color: "var(--text)" }}>
              Supplier Directory Import
            </span>
          </div>
          <input ref={importInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportInput} />
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !importing && importInputRef.current?.click()}
            className="flex-1 flex flex-col items-center justify-center gap-2 rounded-[10px] text-center transition-all"
            style={{
              border: `1.5px dashed ${dragOver ? "var(--blue)" : "var(--border2)"}`,
              padding: "22px 20px",
              cursor: importing ? "wait" : "pointer",
              background: dragOver ? "rgba(79,110,247,0.05)" : "transparent",
              opacity: importing ? 0.6 : 1,
            }}
          >
            {importing ? (
              <>
                <span style={{ color: "var(--blue)" }}>
                  <Icon name="refresh" className="w-5 h-5 animate-spin" />
                </span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  Importing suppliers…
                </span>
              </>
            ) : (
              <>
                <div
                  className="w-[38px] h-[38px] rounded-full flex items-center justify-center"
                  style={{ background: "rgba(79,110,247,0.08)", border: "1.5px solid rgba(79,110,247,0.18)", color: "var(--blue)" }}
                >
                  <Icon name="upload" className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--text)" }}>
                    Drop your supplier XLSX here
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--muted)" }}>
                    Expected columns: COMPANY NAME · CONTACT NAME · CONTACT EMAIL · LANGUAGE · NOTES
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card rounded-xl p-5 flex flex-col gap-3.5">
          <div className="text-[9.5px] font-bold tracking-widest uppercase" style={{ color: "var(--muted)" }}>
            Directory Status
          </div>
          <div>
            <div className="text-[22px] font-black leading-none font-mono" style={{ color: "var(--text)" }}>
              {contacts.length}
            </div>
            <div className="text-[11px] mt-1" style={{ color: "var(--muted)" }}>
              suppliers loaded
            </div>
          </div>
          <div className="h-px" style={{ background: "var(--border)" }} />
          <button
            type="button"
            onClick={exportXLSX}
            className="w-full rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            style={{
              padding: "9px 12px",
              background: dirty ? "var(--blue)" : "var(--card2)",
              color: dirty ? "#fff" : "var(--text2)",
              boxShadow: dirty ? "0 0 14px rgba(79,110,247,0.35)" : "none",
              border: dirty ? "none" : "1px solid var(--border)",
            }}
          >
            <Icon name="download" className="w-3 h-3" />
            {dirty ? "Save → Export XLSX ●" : "Export XLSX"}
          </button>
          {dirty && (
            <div className="text-[10px] text-center -mt-1.5" style={{ color: "var(--muted)" }}>
              Unsaved changes — export to update your file
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search suppliers…"
          className="text-sm rounded-lg outline-none"
          style={{ padding: "8px 14px", border: "1px solid var(--border)", background: "var(--card2)", color: "var(--text)", minWidth: 220 }}
        />
        <div className="ml-auto flex gap-2 items-center flex-wrap">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {contacts.length} suppliers
          </span>
          <button
            type="button"
            onClick={addRow}
            className="px-3 py-2 text-xs font-semibold rounded-lg hover:opacity-80 transition-opacity flex items-center gap-1.5"
            style={{ background: "var(--blue)", color: "#fff" }}
          >
            <Icon name="plus" className="w-3 h-3" />
            Add Supplier
          </button>
        </div>
      </div>

      <div className="card rounded-xl overflow-hidden">
        <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 320px)" }}>
          <table className="w-full text-sm" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th className="th-cell text-left">Company Name</th>
                <th className="th-cell text-left">Contact Name</th>
                <th className="th-cell text-left">Contact Email</th>
                <th className="th-cell text-left">Language</th>
                <th className="th-cell text-left">Notes</th>
                <th className="th-cell"></th>
              </tr>
            </thead>
            <tbody>
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs" style={{ color: "var(--muted)" }}>
                    No suppliers yet — import your XLSX file or click Add Supplier.
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-xs" style={{ color: "var(--muted)" }}>
                    No suppliers match your search.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((c) => {
                  const idx = contacts.indexOf(c);
                  return (
                    <tr key={idx} className="row-alt">
                      <td className="px-4 py-2.5">
                        <input
                          value={c.supplierName || ""}
                          onChange={(e) => updateContact(idx, "supplierName", e.target.value)}
                          placeholder="Company name…"
                          className="w-full text-sm rounded-md outline-none font-semibold"
                          style={{ background: "transparent", color: "var(--text)", padding: "4px 6px" }}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          value={c.contactName || ""}
                          onChange={(e) => updateContact(idx, "contactName", e.target.value)}
                          placeholder="Full name…"
                          className="w-full text-sm rounded-md outline-none"
                          style={{ background: "transparent", color: "var(--text)", padding: "4px 6px" }}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="email"
                          value={c.contactEmail || ""}
                          onChange={(e) => updateContact(idx, "contactEmail", e.target.value)}
                          placeholder="email@company.com"
                          className="w-full text-xs rounded-md outline-none font-mono"
                          style={{ background: "transparent", color: "var(--text)", padding: "4px 6px" }}
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={c.language || "en"}
                          onChange={(e) => updateContact(idx, "language", e.target.value)}
                          className="w-full text-xs rounded-md"
                          style={{ background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)", padding: "3px 6px" }}
                        >
                          {LANGS.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          value={c.notes || ""}
                          onChange={(e) => updateContact(idx, "notes", e.target.value)}
                          placeholder="Notes…"
                          className="w-full text-sm rounded-md outline-none"
                          style={{ background: "transparent", color: "var(--muted)", padding: "4px 6px" }}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => deleteRow(idx)}
                          title="Delete"
                          className="hover:opacity-80 transition-opacity"
                          style={{ color: "var(--red)" }}
                        >
                          <Icon name="trash" className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dirty && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs fade-in"
          style={{ background: "rgba(79,110,247,0.08)", border: "1px solid rgba(79,110,247,0.2)", color: "var(--text2)" }}
        >
          <span className="flex-shrink-0" style={{ color: "var(--blue)" }}>
            <Icon name="alert" className="w-3.5 h-3.5" />
          </span>
          You have unsaved changes. Click <strong style={{ color: "var(--blue)" }}>&nbsp;Save → Export XLSX&nbsp;</strong> to
          download the updated file and replace your original.
        </div>
      )}
    </div>
  );
}
