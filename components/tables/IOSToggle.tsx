"use client";

export function IOSToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="ios-toggle" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="ios-track">
        <span className="ios-thumb" />
      </span>
    </label>
  );
}
