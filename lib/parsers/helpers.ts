export function cell(row: unknown[] | undefined, idx: number): string {
  return row && row[idx] !== undefined && row[idx] !== null ? String(row[idx]).trim() : "";
}

export interface ParsedFile<T> {
  module: "mc16" | "pms" | "backlog" | "mrp" | "sc";
  data: T[];
  count: number;
}
