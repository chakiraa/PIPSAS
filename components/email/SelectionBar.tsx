"use client";

/**
 * Generic bulk-select action bar. Used by the standalone Email Generator
 * tab and (imported) by the per-tab row-selection UI in MC16/Backlog/MRP/SC/PMS,
 * built by a parallel workstream. Kept deliberately generic — it knows
 * nothing about row shapes, only a selection count.
 */
export function SelectionBar({
  count,
  onGenerate,
  onClear,
  label = "Generate Email",
}: {
  count: number;
  onGenerate: () => void;
  onClear: () => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        {count > 0 ? `${count} selected` : "Nothing selected"}
      </span>
      {count > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="text-xs hover:opacity-70 transition-opacity"
          style={{ color: "var(--muted)" }}
        >
          Clear selection
        </button>
      )}
      <button
        type="button"
        onClick={onGenerate}
        disabled={count === 0}
        className="ml-auto flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg transition-all"
        style={{
          background: count > 0 ? "var(--blue)" : "var(--card2)",
          color: count > 0 ? "#fff" : "var(--muted)",
          border: `1px solid ${count > 0 ? "var(--blue)" : "var(--border)"}`,
          opacity: count === 0 ? 0.45 : 1,
          cursor: count === 0 ? "not-allowed" : "pointer",
          boxShadow: count > 0 ? "0 0 14px rgba(99,102,241,0.3)" : "none",
        }}
      >
        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <polyline points="22,6 12,13 2,6" />
        </svg>
        {label}
        {count > 0 ? ` (${count})` : ""}
      </button>
    </div>
  );
}
