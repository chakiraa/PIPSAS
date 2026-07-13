"use client";

import { useState } from "react";
import type { ModuleKey } from "@/types";
import { useAppData } from "@/lib/state/AppDataContext";
import { Icon } from "@/components/layout/Icon";

export function CommentPanel({
  module,
  rowKey,
  value,
}: {
  module: ModuleKey;
  rowKey: string;
  value: string;
}) {
  const { updateComment } = useAppData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function commit() {
    if (draft !== value) updateComment(module, rowKey, draft);
    setEditing(false);
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        rows={2}
        className="w-full text-xs px-2 py-1.5 rounded-md outline-none resize-none"
        style={{ background: "var(--card2)", border: "1px solid var(--blue)", color: "var(--text)" }}
      />
    );
  }

  return (
    <div
      className="comment-wrap group flex items-start gap-1.5 cursor-text min-h-[1.75rem]"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      <span
        className="text-xs flex-1"
        style={{
          color: value ? "var(--text2)" : "var(--muted)",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {value || "Add a comment…"}
      </span>
      <Icon name="pencil" className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
