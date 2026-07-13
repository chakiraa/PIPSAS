// Shared status/signal pill, ported 1:1 from the legacy app's `BADGE_MAP` +
// `SBdg` component (legacy/PIP_V8_AI_Assistant.html ~L2049-2071).
//
// Used across MC16 (status: Active/Resolved), Partials (source: MRP/SC),
// and anywhere else a known literal status string needs a colored pill.
// Unknown/unmapped strings fall back to a neutral gray pill showing the
// raw value, matching the legacy fallback behavior exactly.

const BADGE_MAP: Record<string, { bg: string; color: string; label: string }> = {
  Active: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Active" },
  Resolved: { bg: "rgba(100,116,139,0.15)", color: "#64748b", label: "Resolved" },
  Cleared: { bg: "rgba(100,116,139,0.15)", color: "#64748b", label: "Cleared" },
  Closed: { bg: "rgba(100,116,139,0.15)", color: "#64748b", label: "Closed" },
  Accepted: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Accepted" },
  Confirmed: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6", label: "Confirmed" },
  "Pending Acceptance": { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Pending" },
  "Not Confirmed": { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Not Confirmed" },
  MRP: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6", label: "MRP" },
  SC: { bg: "rgba(168,85,247,0.15)", color: "#a855f7", label: "SC" },
  Release: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Release" },
  "Delayed Release": { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Delayed Release" },
  "Prio Release too Late": { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Prio Release" },
  Cancel: { bg: "rgba(239,68,68,0.15)", color: "#ef4444", label: "Cancel" },
  Accelerate: { bg: "rgba(16,185,129,0.15)", color: "#10b981", label: "Accelerate" },
  Delay: { bg: "rgba(249,115,22,0.15)", color: "#f97316", label: "Delay" },
  Partial: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b", label: "Partial" },
};

export function StatusBadge({ status }: { status: string | null | undefined }) {
  const cfg = BADGE_MAP[status ?? ""] ?? { bg: "rgba(100,116,139,0.12)", color: "#64748b", label: status || "—" };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

/** Generic small pill for ad-hoc labels (e.g. "OOS now", "3d late", "Due today") — ported from legacy `Bdg`. */
const MINI_COLORS: Record<string, { bg: string; color: string }> = {
  yellow: { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" },
  red: { bg: "rgba(239,68,68,0.15)", color: "#ef4444" },
  blue: { bg: "rgba(59,130,246,0.15)", color: "#3b82f6" },
  green: { bg: "rgba(16,185,129,0.15)", color: "#10b981" },
  gray: { bg: "rgba(100,116,139,0.12)", color: "#64748b" },
};

export function MiniBadge({ label, color = "gray" }: { label: string; color?: keyof typeof MINI_COLORS }) {
  const c = MINI_COLORS[color] ?? MINI_COLORS.gray;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" style={{ background: c.bg, color: c.color }}>
      {label}
    </span>
  );
}
