/**
 * Colors any PMS `signal` string by keyword match — ported 1:1 from legacy
 * `signalColor()` / `SignalBadge` (legacy/PIP_V8_AI_Assistant.html ~L2385-2404).
 *
 * Deliberately NOT the same as `classifySignal` in lib/email/generators.ts:
 * that function buckets signals into 4 coarse groups for email generation,
 * while this ports the finer-grained legacy *display* coloring (distinguishes
 * Release / Delayed Release / Prio-or-Late / Delay-Release / plain Delay).
 */
function signalColor(signal?: string | null): { bg: string; color: string } {
  const s = (signal || "").toLowerCase();
  if (s.includes("cancel")) return { bg: "rgba(239,68,68,0.15)", color: "#ef4444" };
  if (s.includes("accelerate")) return { bg: "rgba(16,185,129,0.15)", color: "#10b981" };
  if (s.includes("prio") || s.includes("late")) return { bg: "rgba(239,68,68,0.15)", color: "#ef4444" };
  if (s.includes("delay") && s.includes("rel")) return { bg: "rgba(245,158,11,0.15)", color: "#f59e0b" };
  if (s.startsWith("delay")) return { bg: "rgba(249,115,22,0.15)", color: "#f97316" };
  if (s.includes("release") || s === "release") return { bg: "rgba(16,185,129,0.15)", color: "#10b981" };
  return { bg: "rgba(100,116,139,0.12)", color: "#64748b" };
}

export function SignalBadge({ signal }: { signal: string }) {
  const { bg, color } = signalColor(signal);
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap" style={{ background: bg, color }}>
      {signal || "—"}
    </span>
  );
}
