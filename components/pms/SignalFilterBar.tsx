/** Dynamic signal filter row for the PMS tab — buttons are built from whatever signals exist in the loaded data. */
export function SignalFilterBar({
  signals,
  active,
  counts,
  onChange,
}: {
  signals: string[];
  active: string;
  counts: Record<string, number>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={() => onChange("All")}
        className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${active === "All" ? "filter-btn-active" : "filter-btn"}`}
      >
        All<span className="ml-1.5 opacity-70">{counts.All ?? 0}</span>
      </button>
      {signals.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${active === s ? "filter-btn-active" : "filter-btn"}`}
        >
          {s}
          <span className="ml-1.5 opacity-70">{counts[s] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
