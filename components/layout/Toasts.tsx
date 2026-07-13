"use client";

import { useToast } from "@/lib/state/ToastContext";

const VARIANT_STYLE: Record<string, { border: string; color: string }> = {
  success: { border: "var(--green)", color: "var(--green)" },
  error: { border: "var(--red)", color: "var(--red)" },
  info: { border: "var(--blue)", color: "var(--blue)" },
};

export function Toasts() {
  const { toasts, dismissToast } = useToast();
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const style = VARIANT_STYLE[t.variant] ?? VARIANT_STYLE.info;
        return (
          <div
            key={t.id}
            className="fade-in card rounded-lg px-4 py-3 text-sm flex items-start gap-2 shadow-lg"
            style={{ borderLeft: `3px solid ${style.border}` }}
          >
            <span className="flex-1" style={{ color: "var(--text)" }}>
              {t.message}
            </span>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="text-xs opacity-60 hover:opacity-100"
              style={{ color: "var(--muted)" }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
