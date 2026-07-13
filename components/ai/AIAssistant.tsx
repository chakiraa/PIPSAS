"use client";

import { useEffect, useRef, useState } from "react";
import { useAppData } from "@/lib/state/AppDataContext";
import { useContacts } from "@/lib/state/ContactsContext";
import { AI_HISTORY_KEY, AI_SNOOZE_KEY, safeLoad, safeSave } from "@/lib/storage/keys";
import { buildAIContext, findExactMatches } from "@/lib/ai/context";
import { computeAISuggestion } from "@/lib/ai/suggestion";
import { onOpenAIAssistant } from "@/lib/ai/events";
import { Icon } from "@/components/layout/Icon";
import { ChatPanel } from "./ChatPanel";
import { SuggestionBubble } from "./SuggestionBubble";
import type { AiMessage } from "@/types";

const HISTORY_CAP = 40;
const HUMAN_CONTACT_MESSAGE =
  "No problem — you can reach the PIP team directly at amine.chakir@liebherr.com for anything the assistant can't help with.";

export function AIAssistant() {
  const { state } = useAppData();
  const { contacts } = useContacts();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [suggestion, setSuggestion] = useState<ReturnType<typeof computeAISuggestion>>(null);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Client-only hydration — localStorage isn't available during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(safeLoad<AiMessage[]>(AI_HISTORY_KEY, []));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) safeSave(AI_HISTORY_KEY, messages.slice(-HISTORY_CAP));
  }, [messages, hydrated]);

  useEffect(() => {
    return onOpenAIAssistant((prompt) => {
      setOpen(true);
      setSuggestionDismissed(true);
      if (prompt) sendMessage(prompt);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced proactive-suggestion check whenever the loaded data changes.
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      const next = computeAISuggestion(state);
      if (!next) {
        setSuggestion(null);
        return;
      }
      let seenScore = "";
      try {
        seenScore = localStorage.getItem(AI_SNOOZE_KEY) || "";
      } catch {
        // ignore
      }
      if (next.score === seenScore) {
        setSuggestion(null);
        return;
      }
      setSuggestionDismissed(false);
      setSuggestion(next);
    }, 1400);
    return () => clearTimeout(t);
  }, [state, open]);

  function dismissSuggestion() {
    setSuggestionDismissed(true);
    if (suggestion) {
      try {
        localStorage.setItem(AI_SNOOZE_KEY, suggestion.score);
      } catch {
        // ignore
      }
    }
  }

  async function sendMessage(text: string) {
    if (text === "__HUMAN__") {
      setMessages((m) => [...m, { role: "user", content: "Talk to a human instead" }, { role: "assistant", content: HUMAN_CONTACT_MESSAGE, isLocal: true }]);
      return;
    }

    const userMsg: AiMessage = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setLoading(true);

    const systemContext = [buildAIContext(state, contacts), findExactMatches(state, text)].filter(Boolean).join("\n\n");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemContext,
          messages: history.filter((m) => !m.isLocal).map((m) => ({ role: m.role, content: m.content })),
        }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const detail = await res.text().catch(() => "");
        setMessages((m) => [...m, { role: "assistant", content: detail || "The assistant is unavailable right now.", isError: true }]);
        setLoading(false);
        return;
      }

      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const snapshot = acc;
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { role: "assistant", content: snapshot };
          return next;
        });
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((m) => [...m, { role: "assistant", content: "Something went wrong reaching the assistant. Please try again.", isError: true }]);
      }
    } finally {
      setLoading(false);
    }
  }

  const showBubble = !open && suggestion && !suggestionDismissed;

  return (
    <div className="fixed bottom-6 right-6 z-[9998]">
      <div className="relative">
        {showBubble && suggestion && (
          <SuggestionBubble
            suggestion={suggestion}
            onOpen={() => {
              setOpen(true);
              dismissSuggestion();
              sendMessage(suggestion.prompt);
            }}
            onDismiss={dismissSuggestion}
          />
        )}

        {open && (
          <div
            className="fade-in absolute bottom-full right-0 mb-3 rounded-2xl overflow-hidden flex flex-col"
            style={{ width: 392, height: 600, background: "var(--card)", border: "1px solid var(--border2)", boxShadow: "0 24px 56px rgba(0,0,0,0.5)" }}
          >
            <div className="flex items-center gap-2.5 px-4 py-3.5" style={{ borderBottom: "1px solid var(--border)", background: "var(--grad-signature)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>
                <Icon name="robot" className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">PIP Assistant</div>
                <div className="text-[10px] text-white opacity-80">Gemini · your data never leaves this analysis</div>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white opacity-80 hover:opacity-100">
                ✕
              </button>
            </div>
            <ChatPanel messages={messages} loading={loading} onSend={sendMessage} />
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v);
            if (!open) dismissSuggestion();
          }}
          className="w-14 h-14 rounded-full flex items-center justify-center text-white relative"
          style={{ background: "var(--grad-signature)", boxShadow: "0 8px 24px rgba(79,110,247,0.45)" }}
        >
          <Icon name={open ? "chevron" : "robot"} className="w-6 h-6" />
          {!open && suggestion && !suggestionDismissed && (
            <span
              className="absolute top-0 right-0 w-3 h-3 rounded-full pulse-dot"
              style={{ background: "var(--red)", border: "2px solid var(--card)" }}
            />
          )}
        </button>
      </div>
    </div>
  );
}
