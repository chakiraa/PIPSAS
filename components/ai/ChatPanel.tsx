"use client";

import { useEffect, useRef, useState } from "react";
import type { AiMessage } from "@/types";
import { Icon } from "@/components/layout/Icon";

const QUICK_PROMPTS = [
  { label: "📋 Summarize today's priorities", prompt: "Summarize today's priorities across all modules." },
  { label: "✉️ Draft a follow-up for the top overdue supplier", prompt: "Draft a follow-up email for the supplier with the most overdue orders." },
  { label: "❓ Explain the PSM Dashboard actions", prompt: "Explain what the current PSM Dashboard actions mean and what I should do." },
  { label: "👤 Talk to a human instead", prompt: "__HUMAN__" },
];

export function ChatPanel({
  messages,
  loading,
  onSend,
}: {
  messages: AiMessage[];
  loading: boolean;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  function submit() {
    const text = draft.trim();
    if (!text || loading) return;
    setDraft("");
    onSend(text);
  }

  return (
    <div className="flex flex-col h-full">
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>
              Ask about late orders, MRP alerts, or supplier issues — or try:
            </p>
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => onSend(q.prompt)}
                className="text-left text-xs px-3 py-2 rounded-lg transition-colors"
                style={{ background: "var(--card2)", border: "1px solid var(--border)", color: "var(--text2)" }}
              >
                {q.label}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap"
                style={
                  m.role === "user"
                    ? { background: "var(--blue)", color: "#fff" }
                    : m.isError
                      ? { background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)" }
                      : { background: "var(--card2)", border: "1px solid var(--border)", color: "var(--text)" }
                }
              >
                {m.content || (loading && i === messages.length - 1 ? <TypingDots /> : "")}
              </div>
            </div>
          ))
        )}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-3.5 py-2.5" style={{ background: "var(--card2)", border: "1px solid var(--border)" }}>
              <TypingDots />
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-3 flex items-end gap-2" style={{ borderTop: "1px solid var(--border)" }}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask about your procurement data…"
          rows={1}
          className="flex-1 resize-none rounded-xl px-3 py-2.5 text-[13px] outline-none"
          style={{ background: "var(--card2)", border: "1px solid var(--border)", color: "var(--text)", maxHeight: 96 }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim() || loading}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white"
          style={{ background: draft.trim() && !loading ? "var(--blue)" : "var(--border2)" }}
        >
          <Icon name="send" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 items-center h-4">
      <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: "var(--muted)" }} />
      <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: "var(--muted)", animationDelay: "0.15s" }} />
      <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: "var(--muted)", animationDelay: "0.3s" }} />
    </span>
  );
}
