"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "@/lib/nav";
import { openAIAssistant } from "@/lib/ai/events";
import { Icon } from "./Icon";
import { useAppData } from "@/lib/state/AppDataContext";

function tabBadge(id: string, state: ReturnType<typeof useAppData>["state"]): number | null {
  switch (id) {
    case "mc16":
      return state.mc16.filter((r) => r.status === "Active").length || null;
    case "mrp":
      return state.mrp.filter((r) => r.rowStatus === "Active").length || null;
    case "sc":
      return state.sc.filter((r) => r.rowStatus === "Active").length || null;
    case "pms":
      return state.pms.length || null;
    case "backlog": {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const combined = [
        ...state.mrp.filter((r) => r.rowStatus === "Active"),
        ...state.sc.filter((r) => r.rowStatus === "Active"),
      ];
      const overdue = combined.filter((r) => r.plannedReceiptDate && new Date(r.plannedReceiptDate) <= today);
      return overdue.length || null;
    }
    default:
      return null;
  }
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { state } = useAppData();

  return (
    <>
      <div
        className={`sidebar-overlay fixed inset-0 bg-black/50 z-40 lg:hidden ${open ? "block" : "hidden"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-[216px] flex flex-col overflow-y-auto transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "var(--sidebar-bg)", borderRight: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 px-4 pt-5 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <div
            className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--grad-signature)" }}
          >
            <span className="text-white font-bold text-xs">PIP</span>
          </div>
          <div>
            <div className="font-display font-extrabold text-[13.5px] leading-tight" style={{ color: "var(--text)" }}>
              PIP
            </div>
            <div className="text-[8.5px] font-semibold tracking-widest uppercase mt-0.5" style={{ color: "var(--muted)" }}>
              Procurement Intelligence
            </div>
          </div>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto">
          <div className="text-[9px] font-bold tracking-widest uppercase px-4 pt-4 pb-1 opacity-70" style={{ color: "var(--muted)" }}>
            Menu
          </div>
          {NAV_ITEMS.filter((n) => n.group === "menu").map((item, i) => {
            const active = pathname === item.href;
            const badge = tabBadge(item.id, state);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className="mx-2 mb-0.5 flex items-center gap-2 rounded-[14px] px-3 py-2 text-[12.5px] font-medium transition-colors"
                style={
                  active
                    ? { background: "var(--blue)", color: "#fff" }
                    : { color: "var(--text2)" }
                }
              >
                <span className="text-[9px] font-mono w-3.5 flex-shrink-0 opacity-60">{i + 1}</span>
                <Icon name={item.icon} className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {badge != null && (
                  <span
                    className="ml-auto text-[9.5px] font-bold font-mono px-1.5 rounded-full"
                    style={active ? { background: "rgba(255,255,255,0.25)" } : { background: "var(--blue-dim)", color: "var(--blue)" }}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="text-[9px] font-bold tracking-widest uppercase px-4 pt-4 pb-1 opacity-70" style={{ color: "var(--muted)" }}>
            General
          </div>
          {NAV_ITEMS.filter((n) => n.group === "general").map((item, i) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onClose}
                className="mx-2 mb-0.5 flex items-center gap-2 rounded-[14px] px-3 py-2 text-[12.5px] font-medium transition-colors"
                style={active ? { background: "var(--blue)", color: "#fff" } : { color: "var(--text2)" }}
              >
                <span className="text-[9px] font-mono w-3.5 flex-shrink-0 opacity-60">{i + 8}</span>
                <Icon name={item.icon} className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
          <Link
            href="/emails"
            className="w-full flex items-center justify-center gap-2 rounded-[14px] px-3 py-2.5 text-[11px] font-bold tracking-wide uppercase text-white mb-1"
            style={{ background: "var(--blue)" }}
          >
            <Icon name="mail" className="w-4 h-4" />
            Generate Emails
          </Link>
          <Link
            href="/profile"
            className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium"
            style={{ color: "var(--muted)" }}
          >
            <Icon name="settings" className="w-4 h-4" />
            Settings
          </Link>
          <button
            type="button"
            onClick={() => openAIAssistant()}
            className="w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium"
            style={{ color: "var(--muted)" }}
          >
            <Icon name="robot" className="w-4 h-4" />
            AI Assistant &amp; Support
          </button>
        </div>
      </aside>
    </>
  );
}
