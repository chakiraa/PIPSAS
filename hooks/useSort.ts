"use client";

import { useMemo, useState } from "react";

export type SortDir = "asc" | "desc";

export function useSort<T extends Record<string, unknown>>(defaultField: keyof T, defaultDir: SortDir = "asc") {
  const [field, setField] = useState<keyof T>(defaultField);
  const [dir, setDir] = useState<SortDir>(defaultDir);

  const toggle = (f: keyof T) => {
    if (f === field) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setField(f);
      setDir("asc");
    }
  };

  const sort = useMemo(() => {
    return (rows: T[]): T[] => {
      const copy = [...rows];
      copy.sort((a, b) => {
        const av = a[field];
        const bv = b[field];
        let cmp: number;
        if (typeof av === "number" && typeof bv === "number") {
          cmp = av - bv;
        } else {
          cmp = String(av ?? "").localeCompare(String(bv ?? ""));
        }
        return dir === "asc" ? cmp : -cmp;
      });
      return copy;
    };
  }, [field, dir]);

  return { field, dir, toggle, sort };
}
