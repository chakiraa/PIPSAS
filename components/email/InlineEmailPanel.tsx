"use client";

import type { GeneratedEmail } from "@/lib/email/generators";
import { EmailCard } from "./EmailCard";

/**
 * Shared results panel: a summary line (count generated / count with email
 * on file / total lines) plus one EmailCard per generated email and a
 * "Clear" button. Used by the standalone Email Generator tab and by any
 * future per-row bulk-select flow in the MC16/Backlog/MRP/SC/PMS tabs.
 */
export function InlineEmailPanel({ emails, onClear }: { emails: GeneratedEmail[]; onClear: () => void }) {
  if (!emails || !emails.length) return null;

  const withContact = emails.filter((e) => e.hasContact).length;
  const totalLines = emails.reduce((s, e) => s + (e.itemCount || 0), 0);

  return (
    <div className="flex flex-col gap-3 fade-in">
      <div className="flex items-center gap-3 px-1 flex-wrap">
        <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
          ✉ {emails.length} email{emails.length !== 1 ? "s" : ""} generated
          <span className="ml-2 font-normal" style={{ color: "var(--muted)" }}>
            &middot; {withContact} with email on file &middot; {totalLines} lines total
          </span>
        </span>
        <button
          type="button"
          onClick={onClear}
          className="ml-auto text-xs px-2 py-1 rounded hover:opacity-70 transition-opacity"
          style={{ color: "var(--muted)" }}
        >
          ✕ Clear
        </button>
      </div>
      {emails.map((email, i) => (
        <EmailCard key={i} email={email} />
      ))}
    </div>
  );
}
