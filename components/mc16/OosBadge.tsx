import { MiniBadge } from "@/components/tables/StatusBadge";

/**
 * "Days Until OOS" cell badge — ported from legacy `DaysBdg` (mode: "oos").
 *   days <= 0   -> "OOS now" (red)
 *   days <= 7   -> "{days}d" (red, critical)
 *   days <= 14  -> "{days}d" (amber, warning)
 *   days > 14   -> "{days}d" (green, ok)
 */
export function OosBadge({ days }: { days: number }) {
  if (Number.isNaN(days)) return <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>;
  if (days <= 0) return <MiniBadge label="OOS now" color="red" />;
  if (days <= 7) return <MiniBadge label={`${days}d`} color="red" />;
  if (days <= 14) return <MiniBadge label={`${days}d`} color="yellow" />;
  return <MiniBadge label={`${days}d`} color="green" />;
}
