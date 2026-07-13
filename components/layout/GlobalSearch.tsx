"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/state/AppDataContext";
import { Icon } from "./Icon";

interface Result {
  tab: string;
  label: string;
  href: string;
  sub: string;
}

export function GlobalSearch() {
  const { state } = useAppData();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo<Result[]>(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return [];
    const out: Result[] = [];

    for (const r of state.mc16) {
      if (
        r.articleNumber.toLowerCase().includes(query) ||
        r.articleName.toLowerCase().includes(query) ||
        r.articleDescription.toLowerCase().includes(query)
      ) {
        out.push({ tab: "MC16", label: r.articleNumber, sub: r.articleName, href: "/mc16" });
      }
    }
    for (const r of state.pms) {
      if (
        r.itemNumber.toLowerCase().includes(query) ||
        r.supplier.toLowerCase().includes(query) ||
        r.poNumber.toLowerCase().includes(query)
      ) {
        out.push({ tab: "PMS", label: r.itemNumber, sub: r.supplier, href: "/pms" });
      }
    }
    for (const r of state.mrp) {
      if (
        r.orderNumber.toLowerCase().includes(query) ||
        r.itemNumber.toLowerCase().includes(query) ||
        r.supplierName.toLowerCase().includes(query)
      ) {
        out.push({ tab: "MRP", label: r.orderNumber, sub: `${r.supplierName} — ${r.itemDescription}`, href: "/mrp" });
      }
    }
    for (const r of state.sc) {
      if (
        r.scheduleNumber.toLowerCase().includes(query) ||
        r.itemNumber.toLowerCase().includes(query) ||
        r.supplierName.toLowerCase().includes(query)
      ) {
        out.push({ tab: "SC", label: r.scheduleNumber, sub: r.supplierName, href: "/sc" });
      }
    }
    return out.slice(0, 10);
  }, [q, state]);

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <Icon name="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search orders, articles, suppliers... (⌘K)"
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "var(--card2)", border: "1px solid var(--border)", color: "var(--text)" }}
        />
      </div>
      {open && q.trim().length >= 2 && (
        <div
          className="absolute top-full mt-1 left-0 right-0 rounded-lg overflow-hidden z-50 max-h-80 overflow-y-auto"
          style={{ background: "var(--card)", border: "1px solid var(--border2)", boxShadow: "0 24px 48px rgba(0,0,0,0.25)" }}
        >
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
              No results
            </div>
          ) : (
            results.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  router.push(r.href);
                  setOpen(false);
                  setQ("");
                }}
                className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-black/5"
              >
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "var(--blue-dim)", color: "var(--blue)" }}
                >
                  {r.tab}
                </span>
                <span className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                  {r.label}
                </span>
                <span className="text-xs truncate" style={{ color: "var(--muted)" }}>
                  {r.sub}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
