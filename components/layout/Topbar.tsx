"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/nav";
import { Icon } from "./Icon";
import { GlobalSearch } from "./GlobalSearch";
import { ResetDialog } from "./ResetDialog";
import { useTheme } from "@/lib/state/ThemeContext";
import { useAppData } from "@/lib/state/AppDataContext";
import { useToast } from "@/lib/state/ToastContext";
import { useProfile } from "@/lib/state/ProfileContext";
import { getInitials } from "@/lib/utils/text";

export function Topbar({ onHamburger }: { onHamburger: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { state, commentStore, reloadComments } = useAppData();
  const { addToast } = useToast();
  const { fullName } = useProfile();
  const [resetOpen, setResetOpen] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const current = NAV_ITEMS.find((n) => n.href === pathname);
  const currentIndex = NAV_ITEMS.findIndex((n) => n.href === pathname);

  const lastTs = Object.values(state.lastUpload).filter(Boolean).sort().slice(-1)[0];

  function exportComments() {
    const blob = new Blob([JSON.stringify(commentStore, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pip_comments_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Comment backup exported.", "success");
  }

  async function importComments(file: File) {
    try {
      const text = await file.text();
      const incoming = JSON.parse(text);
      const merged = { ...commentStore };
      for (const [key, value] of Object.entries<{ log?: { ts: string }[] }>(incoming)) {
        if (!merged[key]) {
          merged[key] = value as (typeof merged)[string];
        } else {
          const existingTs = new Set((merged[key].log || []).map((l) => l.ts));
          const newEntries = (value.log || []).filter((l) => !existingTs.has(l.ts));
          merged[key] = { ...merged[key], log: [...merged[key].log, ...newEntries] };
        }
      }
      reloadComments(merged);
      addToast("Comment backup imported and merged.", "success");
    } catch {
      addToast("Could not read that comment backup file.", "error");
    }
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur" style={{ background: "var(--hdr-bg)", borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3 px-4 lg:px-8 py-2.5">
        <button type="button" onClick={onHamburger} className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center" style={{ border: "1px solid var(--border)" }}>
          <Icon name="menu" className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex items-center gap-1.5 flex-shrink-0 text-sm" style={{ color: "var(--muted)" }}>
          {currentIndex >= 0 && <span className="font-mono text-xs">{String(currentIndex + 1).padStart(2, "0")}</span>}
          <span className="font-semibold" style={{ color: "var(--text)" }}>
            {current?.label ?? "PIP"}
          </span>
        </div>

        <GlobalSearch />

        <div className="hidden md:flex items-center gap-1.5 text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>
          <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: lastTs ? "var(--green)" : "var(--muted)" }} />
          {lastTs ? `Updated ${new Date(lastTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "No data yet"}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button type="button" title="Export comment backup" onClick={exportComments} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ border: "1px solid var(--border)", color: "var(--hdr-icon-clr, var(--muted))" }}>
            <Icon name="download" className="w-4 h-4" />
          </button>
          <button type="button" title="Import comment backup" onClick={() => importRef.current?.click()} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ border: "1px solid var(--border)" }}>
            <Icon name="upload" className="w-4 h-4" />
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importComments(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            title="No new data to refresh"
            onClick={() => addToast("No new data to refresh.", "info")}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ border: "1px solid var(--border)" }}
          >
            <Icon name="refresh" className="w-4 h-4" />
          </button>
          <button type="button" title="Toggle theme" onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ border: "1px solid var(--border)" }}>
            <Icon name={theme === "dark" ? "sun" : "moon"} className="w-4 h-4" />
          </button>
          <button type="button" title="Reset ERP data" onClick={() => setResetOpen(true)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ border: "1px solid var(--border)", color: "var(--red)" }}>
            <Icon name="reset" className="w-4 h-4" />
          </button>
          <Link
            href="/profile"
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
            style={{ background: "var(--grad-signature)" }}
          >
            {getInitials(fullName)}
          </Link>
        </div>
      </div>
      <ResetDialog open={resetOpen} onClose={() => setResetOpen(false)} />
    </header>
  );
}
