export type Urgency = "All" | "Critical" | "Warning" | "OK";

const OPTIONS: { value: Urgency; label: string }[] = [
  { value: "All", label: "All" },
  { value: "Critical", label: "Critical ≤7d" },
  { value: "Warning", label: "Warning ≤14d" },
  { value: "OK", label: "OK >14d" },
];

/** Ported from legacy MC16Tab's urgency `FilterBtn` row. */
export function UrgencyFilterBar({
  active,
  onChange,
  counts,
}: {
  active: Urgency;
  onChange: (v: Urgency) => void;
  counts: Record<Urgency, number>;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-4 py-2 rounded-full text-xs font-medium border transition-all ${
            active === o.value ? "filter-btn-active" : "filter-btn"
          }`}
        >
          {o.label}
          <span className="ml-1.5 opacity-70">{counts[o.value]}</span>
        </button>
      ))}
    </div>
  );
}
