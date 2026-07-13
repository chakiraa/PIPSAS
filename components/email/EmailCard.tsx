"use client";

import { useState } from "react";
import type { GeneratedEmail } from "@/lib/email/generators";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

const LANG_FLAG: Record<string, string> = {
  en: "🇬🇧",
  english: "🇬🇧",
  fr: "🇫🇷",
  french: "🇫🇷",
  de: "🇩🇪",
  german: "🇩🇪",
  it: "🇮🇹",
  italian: "🇮🇹",
  es: "🇪🇸",
  spanish: "🇪🇸",
  pt: "🇵🇹",
  portuguese: "🇵🇹",
};

function EmailCardInner({ email }: { email: GeneratedEmail }) {
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);

  const mailtoLink = email.email ? `mailto:${email.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}` : null;
  const langFlag = LANG_FLAG[(email.language || "").toLowerCase()] || "🌐";

  function handleCopy() {
    const text = `Subject: ${subject}\n\n${body}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function fallbackCopy(text: string) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }

  return (
    <div className="card rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-5 py-3.5 flex-wrap gap-3"
        style={{ borderBottom: expanded ? "1px solid var(--border)" : "none", background: "var(--card2)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-black flex-shrink-0"
            style={{ background: email.hasContact ? "var(--green)" : "var(--muted)" }}
          >
            {(email.supplierName || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--text)" }}>
              {email.supplierName}
            </div>
            <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: "var(--muted)" }}>
              {email.email ? (
                <span style={{ color: "var(--green)" }}>{email.email}</span>
              ) : (
                <span className="italic opacity-60">(no email on file)</span>
              )}
              {email.contactName && <span>&middot; {email.contactName}</span>}
              <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={{ background: "var(--card)", color: "var(--text2)" }}>
                {langFlag} {email.language}
              </span>
              <span className="px-1.5 py-0.5 rounded text-xs" style={{ background: "var(--card)", color: "var(--muted)" }}>
                {email.itemCount ?? 0} line{(email.itemCount ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-xs px-2 py-1 rounded transition-opacity hover:opacity-70"
            style={{ color: "var(--muted)" }}
          >
            {expanded ? "▲" : "▼"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 text-xs border rounded-lg hover:opacity-80 transition-all font-medium"
            style={{
              background: copied ? "var(--green)" : "var(--card)",
              borderColor: copied ? "var(--green)" : "var(--border)",
              color: copied ? "#fff" : "var(--text)",
            }}
          >
            {copied ? "✓ Copied!" : "Copy"}
          </button>
          {mailtoLink && (
            <a
              href={mailtoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 text-xs rounded-lg font-medium hover:opacity-80 transition-opacity flex items-center gap-1"
              style={{ background: "var(--blue)", color: "#fff" }}
            >
              ✉ Open in Mail
            </a>
          )}
        </div>
      </div>
      {expanded && (
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold flex-shrink-0 w-14" style={{ color: "var(--muted)" }}>
              Subject:
            </span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{ background: "var(--card2)", color: "var(--text)", borderColor: "var(--border)" }}
              className="flex-1 text-xs border rounded-lg px-3 py-1.5 focus:outline-none"
            />
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={13}
            style={{ background: "var(--card2)", color: "var(--text)", borderColor: "var(--border)", fontFamily: "var(--font-mono)", fontSize: "12px", lineHeight: "1.65" }}
            className="w-full border rounded-lg p-3 resize-y focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

export function EmailCard({ email }: { email: GeneratedEmail }) {
  return (
    <ErrorBoundary>
      <EmailCardInner email={email} />
    </ErrorBoundary>
  );
}
