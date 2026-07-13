"use client";

import { useRef, useState } from "react";
import { useTodos } from "@/lib/state/TodosContext";
import type { TodoItem } from "@/types";
import { Icon } from "@/components/layout/Icon";

const TODO_PRIORITIES: { value: TodoItem["priority"]; label: string; color: string }[] = [
  { value: "high", label: "High", color: "#ef4444" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "low", label: "Low", color: "#10b981" },
];

type Filter = "all" | "pending" | "done";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export default function TodoPage() {
  const { todos, setTodos } = useTodos();
  const [input, setInput] = useState("");
  const [priority, setPriority] = useState<TodoItem["priority"]>("medium");
  const [filter, setFilter] = useState<Filter>("all");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTask() {
    const text = input.trim();
    if (!text) return;
    setTodos((t) => [{ id: newId(), text, priority, done: false, createdAt: new Date().toISOString() }, ...t]);
    setInput("");
    inputRef.current?.focus();
  }

  function toggleDone(id: string) {
    setTodos((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  }

  function deleteTask(id: string) {
    setTodos((t) => t.filter((x) => x.id !== id));
  }

  function clearDone() {
    setTodos((t) => t.filter((x) => !x.done));
  }

  const displayed = todos.filter((t) => (filter === "all" ? true : filter === "done" ? t.done : !t.done));
  const doneCount = todos.filter((t) => t.done).length;
  const pct = todos.length ? Math.round((doneCount / todos.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 fade-in" style={{ maxWidth: 780 }}>
      <div>
        <h1 className="text-xl font-display font-extrabold" style={{ color: "var(--text)" }}>
          Daily To-Do
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          Personal task list — stored only in this browser
        </p>
      </div>

      {todos.length > 0 && (
        <div className="card rounded-xl" style={{ padding: "16px 20px" }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold" style={{ color: "var(--text)" }}>
              Today&apos;s Progress
            </span>
            <span
              className="text-xs font-bold font-mono"
              style={{ color: pct === 100 ? "#10b981" : "var(--blue)" }}
            >
              {doneCount}/{todos.length} — {pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border2)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "var(--blue)" }}
            />
          </div>
        </div>
      )}

      <div className="card rounded-xl" style={{ padding: 20 }}>
        <div className="text-[11px] font-bold tracking-widest uppercase mb-3" style={{ color: "var(--muted)" }}>
          Add Task
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="What needs to be done today?"
            className="flex-1 rounded-lg text-sm outline-none"
            style={{ minWidth: 180, padding: "9px 14px", border: "1px solid var(--border)", background: "var(--card2)", color: "var(--text)" }}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TodoItem["priority"])}
            className="rounded-lg text-xs font-semibold"
            style={{ padding: "9px 10px", border: "1px solid var(--border)", background: "var(--card2)", color: "var(--text)" }}
          >
            {TODO_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label} Priority
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addTask}
            className="rounded-lg text-xs font-bold flex items-center gap-1.5"
            style={{ padding: "9px 18px", background: "var(--blue)", color: "#fff" }}
          >
            <Icon name="plus" className="w-3 h-3" />
            Add
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {(
            [
              ["all", "All"],
              ["pending", "Pending"],
              ["done", "Done"],
            ] as [Filter, string][]
          ).map(([v, l]) => (
            <button
              key={v}
              type="button"
              onClick={() => setFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${filter === v ? "filter-btn-active" : "filter-btn"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="text-xs" style={{ color: "var(--muted)" }}>
          {displayed.length} task{displayed.length !== 1 ? "s" : ""}
        </span>
        {doneCount > 0 && (
          <button
            type="button"
            onClick={clearDone}
            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-semibold filter-btn"
          >
            Clear completed ({doneCount})
          </button>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="card rounded-xl text-center" style={{ padding: "36px 24px" }}>
          <div className="text-2xl mb-2.5">✅</div>
          <div className="text-sm" style={{ color: "var(--muted)" }}>
            {todos.length === 0 ? "No tasks yet — add one above." : "All tasks completed!"}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {displayed.map((task) => {
            const pri = TODO_PRIORITIES.find((p) => p.value === task.priority) || TODO_PRIORITIES[1];
            return (
              <div
                key={task.id}
                className="card rounded-xl fade-in flex items-center gap-3"
                style={{
                  padding: "14px 16px",
                  opacity: task.done ? 0.55 : 1,
                  borderLeft: `3px solid ${task.done ? "var(--border)" : pri.color}`,
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleDone(task.id)}
                  className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center"
                  style={{
                    border: `2px solid ${task.done ? "#10b981" : pri.color}`,
                    background: task.done ? "#10b981" : "transparent",
                  }}
                >
                  {task.done && (
                    <svg width="11" height="11" fill="none" stroke="#fff" strokeWidth="3" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <div
                  className="flex-1 text-sm font-medium"
                  style={{ color: "var(--text)", textDecoration: task.done ? "line-through" : "none" }}
                >
                  {task.text}
                </div>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ background: `${pri.color}18`, color: pri.color, letterSpacing: "0.07em" }}
                >
                  {pri.label}
                </span>
                <span className="text-[10px] flex-shrink-0" style={{ color: "var(--muted)" }}>
                  {new Date(task.createdAt).toLocaleDateString("fr-CH", { day: "2-digit", month: "2-digit" })}
                </span>
                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="flex-shrink-0 rounded p-1 hover:opacity-70 transition-opacity"
                  style={{ color: "var(--muted)" }}
                >
                  <Icon name="trash" className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
