"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/state/AppDataContext";
import { daysDiff, TODAY, TODAY_STR } from "@/lib/utils/dates";
import type { MrpRow, ScRow } from "@/types";
import { Icon } from "@/components/layout/Icon";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { DonutChart } from "@/components/dashboard/DonutChart";
import { HBarChart } from "@/components/dashboard/HBarChart";
import { WeeklyBarChart } from "@/components/dashboard/WeeklyBarChart";

function weekLabel(offset: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + offset * 7);
  const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `W+${offset} (${dateStr})`;
}

const EMPTY_LINKS = [
  { href: "/mc16", label: "MC16 Alerts", icon: "alert" },
  { href: "/backlog", label: "Backlog", icon: "clock" },
  { href: "/pms", label: "PSM Dashboard", icon: "radio" },
  { href: "/mrp", label: "MRP Orders", icon: "box" },
  { href: "/sc", label: "SC Orders", icon: "layers" },
];

export default function DashboardPage() {
  const { state } = useAppData();
  const { mc16, pms, backlog, mrp, sc } = state;

  const hasAnyData = mc16.length > 0 || pms.length > 0 || backlog.length > 0 || mrp.length > 0 || sc.length > 0;

  const stats = useMemo(() => {
    const mc16Active = mc16.filter((r) => r.status === "Active");
    const mc16Critical = mc16Active.filter((r) => {
      const d = daysDiff(r.outOfStockDate);
      return !Number.isNaN(d) && d <= 7;
    }).length;
    const mc16Warn = mc16Active.filter((r) => {
      const d = daysDiff(r.outOfStockDate);
      return !Number.isNaN(d) && d > 7 && d <= 14;
    }).length;
    const mc16OK = mc16Active.filter((r) => {
      const d = daysDiff(r.outOfStockDate);
      return !Number.isNaN(d) && d > 14;
    }).length;

    const mrpActive = mrp.filter((r) => r.rowStatus !== "Closed");
    const scActive = sc.filter((r) => r.rowStatus !== "Cleared");

    const mrpUnconf = mrpActive.filter((r) => r.confirmationStatus === "Not Confirmed").length;
    const mrpConf = mrpActive.filter((r) => r.confirmationStatus === "Confirmed").length;
    const mrpAccept = mrpActive.filter((r) => r.confirmationStatus === "Accepted").length;
    const mrpPending = mrpActive.filter((r) => r.confirmationStatus === "Pending Acceptance").length;
    const mrpConfPct = mrpActive.length ? Math.round(((mrpConf + mrpAccept) / mrpActive.length) * 100) : 0;

    const mrpLate = mrpActive.filter((r) => r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR).length;
    const scLate = scActive.filter((r) => r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR).length;
    const totalOverdue = mrpLate + scLate;

    const partials =
      mrpActive.filter((r) => r.isPartialDelivery).length + scActive.filter((r) => r.isPartialDelivery).length;

    const combinedActive: (MrpRow | ScRow)[] = [...mrpActive, ...scActive];

    const upcomingBars = [0, 1, 2, 3].map((w) => {
      const lo = w * 7;
      const hi = w * 7 + 6;
      const count = combinedActive.filter((r) => {
        if (!r.plannedReceiptDate) return false;
        const d = daysDiff(r.plannedReceiptDate);
        return !Number.isNaN(d) && d >= lo && d <= hi;
      }).length;
      return { label: weekLabel(w), value: count, color: w === 0 ? "var(--amber)" : "var(--blue)" };
    });

    // "Late" (strictly overdue, excludes due-today) mirrors the app's DaysBdg
    // semantics elsewhere: days === 0 is "Due today", only days > 0 is "late".
    const lateBySupplier = new Map<string, number>();
    for (const r of combinedActive) {
      if (!r.plannedReceiptDate) continue;
      const d = daysDiff(r.plannedReceiptDate);
      if (Number.isNaN(d) || d >= 0) continue;
      const name = r.supplierName || "Unknown";
      lateBySupplier.set(name, (lateBySupplier.get(name) || 0) + 1);
    }
    const supplierBars = [...lateBySupplier.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value, color: "var(--red)" }));

    const mrpDonut = [
      { label: "Accepted", value: mrpAccept, color: "var(--green)" },
      { label: "Confirmed", value: mrpConf, color: "var(--blue)" },
      { label: "Pending Acceptance", value: mrpPending, color: "var(--amber)" },
      { label: "Not Confirmed", value: mrpUnconf, color: "var(--red)" },
    ];
    const mc16Donut = [
      { label: "Critical ≤ 7d", value: mc16Critical, color: "var(--red)" },
      { label: "Warning ≤ 14d", value: mc16Warn, color: "var(--orange)" },
      { label: "OK > 14d", value: mc16OK, color: "var(--green)" },
    ];

    return {
      mc16ActiveCount: mc16Active.length,
      mc16Critical,
      mc16Warn,
      mrpActiveCount: mrpActive.length,
      mrpUnconf,
      mrpConfPct,
      mrpLate,
      scLate,
      totalOverdue,
      partials,
      upcomingBars,
      supplierBars,
      mrpDonut,
      mc16Donut,
    };
  }, [mc16, mrp, sc]);

  // Manual formatting (not toLocaleDateString) so server and client render
  // byte-identical output regardless of available ICU data — avoids a
  // hydration mismatch some Node builds produce for "long" date styles.
  const todayLabel = useMemo(() => {
    const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const MONTHS = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const d = new Date();
    return `${WEEKDAYS[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  const kpiCards = [
    {
      label: "MC16 Active",
      value: stats.mc16ActiveCount,
      sub: `${stats.mc16Critical} critical · ${stats.mc16Warn} warning`,
      accent: "var(--red)",
      icon: "alert",
      href: "/mc16",
    },
    {
      label: "Overdue Orders",
      value: stats.totalOverdue,
      sub: `${stats.mrpLate} MRP · ${stats.scLate} SC`,
      accent: "var(--orange)",
      icon: "clock",
      href: "/backlog",
    },
    {
      label: "Unconfirmed MRP",
      value: stats.mrpUnconf,
      sub: "Needs follow-up",
      accent: "var(--blue)",
      icon: "clipboard",
      href: "/mrp",
    },
    {
      label: "Partial Deliv.",
      value: stats.partials,
      sub: "MRP + SC combined",
      accent: "var(--amber)",
      icon: "split",
      href: "/partials",
    },
    {
      label: "MRP Confirmed",
      value: `${stats.mrpConfPct}%`,
      sub: `of ${stats.mrpActiveCount} active orders`,
      accent: "var(--green)",
      icon: "check",
      href: "/mrp",
    },
  ];

  return (
    <div className="fade-in">
      <div className="flex items-center gap-2 mb-6">
        <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Overview
        </div>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <div className="text-[10.5px] font-medium" style={{ color: "var(--muted)" }}>
          {todayLabel}
        </div>
      </div>

      {!hasAnyData ? (
        <div className="card rounded-2xl p-10 flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--blue-dim)", color: "var(--blue)" }}
          >
            <Icon name="upload" className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold mb-1.5" style={{ color: "var(--text)" }}>
              No data imported yet
            </h2>
            <p className="text-sm leading-relaxed max-w-md" style={{ color: "var(--muted)" }}>
              Import your first Excel/CSV export from Infor LN to populate the dashboard. Pick a module below to get
              started.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
            {EMPTY_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                style={{ background: "var(--card2)", border: "1px solid var(--border)", color: "var(--text2)" }}
              >
                <Icon name={l.icon} className="w-3.5 h-3.5" />
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
            {kpiCards.map((c) => (
              <KpiCard key={c.label} icon={c.icon} label={c.label} value={c.value} sub={c.sub} accent={c.accent} href={c.href} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="stat-card rounded-2xl p-5 flex flex-col gap-4" style={{ borderTop: "2px solid var(--purple)" }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--purple)" }} />
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  MRP — Confirmation
                </span>
              </div>
              <DonutChart segments={stats.mrpDonut} centerLabel={stats.mrpActiveCount || "—"} />
            </div>

            <div className="stat-card rounded-2xl p-5 flex flex-col gap-4" style={{ borderTop: "2px solid var(--red)" }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--red)" }} />
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  MC16 — Urgency
                </span>
              </div>
              <DonutChart segments={stats.mc16Donut} centerLabel={stats.mc16ActiveCount || "—"} />
            </div>

            <div className="stat-card rounded-2xl p-5 flex flex-col gap-4" style={{ borderTop: "2px solid var(--amber)" }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--amber)" }} />
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  Upcoming Deliveries
                </span>
              </div>
              {stats.upcomingBars.every((b) => b.value === 0) ? (
                <div className="text-xs italic py-4" style={{ color: "var(--muted)" }}>
                  No data — upload MRP/SC files
                </div>
              ) : (
                <WeeklyBarChart bars={stats.upcomingBars} />
              )}
              <div className="text-xs font-medium" style={{ color: "var(--muted)" }}>
                {stats.upcomingBars.reduce((s, b) => s + b.value, 0)} total · next 4 weeks
              </div>
            </div>

            <div className="stat-card rounded-2xl p-5 flex flex-col gap-4" style={{ borderTop: "2px solid var(--orange)" }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--orange)" }} />
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--muted)" }}>
                  Late — Top Suppliers
                </span>
              </div>
              {stats.supplierBars.length === 0 ? (
                <div className="text-xs italic py-4" style={{ color: "var(--muted)" }}>
                  No late orders detected
                </div>
              ) : (
                <HBarChart bars={stats.supplierBars} />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
