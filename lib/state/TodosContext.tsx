"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { TodoItem } from "@/types";
import { loadTodos, saveTodos } from "@/lib/storage/todos";

interface TodosContextValue {
  todos: TodoItem[];
  setTodos: (next: TodoItem[] | ((prev: TodoItem[]) => TodoItem[])) => void;
}

const TodosContext = createContext<TodosContextValue | null>(null);

export function TodosProvider({ children }: { children: React.ReactNode }) {
  const [todos, setTodosState] = useState<TodoItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setTodosState(loadTodos());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveTodos(todos);
  }, [todos, hydrated]);

  return <TodosContext.Provider value={{ todos, setTodos: setTodosState }}>{children}</TodosContext.Provider>;
}

export function useTodos(): TodosContextValue {
  const ctx = useContext(TodosContext);
  if (!ctx) throw new Error("useTodos must be used within TodosProvider");
  return ctx;
}
