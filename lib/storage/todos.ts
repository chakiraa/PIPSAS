import type { TodoItem } from "@/types";
import { TODO_KEY, safeLoad, safeSave } from "./keys";

export function loadTodos(): TodoItem[] {
  return safeLoad<TodoItem[]>(TODO_KEY, []);
}

export function saveTodos(todos: TodoItem[]): void {
  safeSave(TODO_KEY, todos);
}
