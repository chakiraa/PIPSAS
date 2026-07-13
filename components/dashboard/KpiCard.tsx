import Link from "next/link";
import { Icon } from "@/components/layout/Icon";

interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
  sub: string;
  /** CSS color value, e.g. "var(--red)" or a hex string. */
  accent: string;
  href: string;
}

/** One hero stat card on the Dashboard: icon, big number, label, colored top accent, clickable. */
export function KpiCard({ icon, label, value, sub, accent, href }: KpiCardProps) {
  return (
    <Link
      href={href}
      className="stat-card rounded-2xl p-6 flex flex-col gap-3 text-left w-full relative overflow-hidden"
      style={{ borderTop: `2px solid ${accent}` }}
    >
      <div
        className="pointer-events-none absolute top-0 right-0 w-[100px] h-[100px] rounded-tr-2xl"
        style={{ background: `radial-gradient(circle at top right, ${accent}30, transparent 70%)` }}
      />
      <div className="flex items-start justify-between gap-2 relative">
        <div className="text-[11px] font-bold uppercase tracking-widest leading-snug" style={{ color: "var(--muted)" }}>
          {label}
        </div>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${accent}20`, color: accent }}
        >
          <Icon name={icon} className="w-[18px] h-[18px]" />
        </div>
      </div>
      <div className="font-black font-mono leading-none text-3xl relative" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-xs truncate font-medium relative" style={{ color: "var(--muted)" }}>
        {sub}
      </div>
    </Link>
  );
}
