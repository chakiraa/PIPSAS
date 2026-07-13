"use client";

import Link from "next/link";
import type { AISuggestion } from "@/lib/ai/suggestion";
import { Icon } from "@/components/layout/Icon";

export function SuggestionBubble({
  suggestion,
  onOpen,
  onDismiss,
}: {
  suggestion: AISuggestion;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className="fade-in absolute bottom-full right-0 mb-3 rounded-2xl p-4"
      style={{ width: 280, background: "var(--card)", border: "1px solid var(--border2)", boxShadow: "0 16px 40px rgba(0,0,0,0.35)" }}
    >
      <div className="flex items-start gap-2 mb-3">
        <span style={{ color: "var(--blue)" }}>
          <Icon name="robot" className="w-4 h-4" />
        </span>
        <p className="text-xs flex-1" style={{ color: "var(--text)" }}>
          {suggestion.text}
        </p>
        <button type="button" onClick={onDismiss} className="text-xs opacity-50 hover:opacity-100 flex-shrink-0" style={{ color: "var(--muted)" }}>
          ✕
        </button>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 text-xs font-semibold py-1.5 rounded-lg text-white"
          style={{ background: "var(--blue)" }}
        >
          Open assistant
        </button>
        <Link
          href={suggestion.targetHref}
          onClick={onDismiss}
          className="flex-1 text-xs font-medium py-1.5 rounded-lg text-center"
          style={{ border: "1px solid var(--border)", color: "var(--text2)" }}
        >
          Just take me there
        </Link>
      </div>
    </div>
  );
}
