"use client";

export function applyDateRange<T extends Record<string, unknown>>(
  rows: T[],
  field: keyof T,
  from: string,
  to: string,
): T[] {
  if (!from && !to) return rows;
  return rows.filter((r) => {
    const v = r[field];
    if (!v || typeof v !== "string") return false;
    if (from && v < from) return false;
    if (to && v > to) return false;
    return true;
  });
}

export function DateRangeFilter({
  from,
  to,
  onFrom,
  onTo,
  onClear,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onClear: () => void;
}) {
  const active = Boolean(from || to);
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        value={from}
        onChange={(e) => onFrom(e.target.value)}
        className="px-2 py-1.5 rounded-lg text-xs outline-none"
        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
      />
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        →
      </span>
      <input
        type="date"
        value={to}
        onChange={(e) => onTo(e.target.value)}
        className="px-2 py-1.5 rounded-lg text-xs outline-none"
        style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
      />
      {active && (
        <button
          type="button"
          onClick={onClear}
          className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
          style={{ color: "var(--muted)" }}
          title="Clear date range"
        >
          ✕
        </button>
      )}
    </div>
  );
}
