"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { SOLVED_KEY, TOGGLE_DATE_KEY } from "@/lib/storage/keys";
import { TODAY_STR } from "@/lib/utils/dates";

interface SolvedContextValue {
  solved: Set<string>;
  toggleSolved: (key: string) => void;
}

const SolvedContext = createContext<SolvedContextValue | null>(null);

function loadSolved(): Set<string> {
  try {
    const savedDate = localStorage.getItem(TOGGLE_DATE_KEY);
    if (savedDate !== TODAY_STR) return new Set(); // new day — reset all toggles
    const arr = JSON.parse(localStorage.getItem(SOLVED_KEY) || "[]");
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveSolved(s: Set<string>) {
  try {
    localStorage.setItem(SOLVED_KEY, JSON.stringify([...s]));
    localStorage.setItem(TOGGLE_DATE_KEY, TODAY_STR);
  } catch {
    // ignore
  }
}

export function SolvedProvider({ children }: { children: React.ReactNode }) {
  const [solved, setSolved] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Client-only hydration — see AppDataContext for why this can't be lazy useState init.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSolved(loadSolved());
  }, []);

  const toggleSolved = (key: string) => {
    setSolved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      saveSolved(next);
      return next;
    });
  };

  return <SolvedContext.Provider value={{ solved, toggleSolved }}>{children}</SolvedContext.Provider>;
}

export function useSolved(): SolvedContextValue {
  const ctx = useContext(SolvedContext);
  if (!ctx) throw new Error("useSolved must be used within SolvedProvider");
  return ctx;
}
