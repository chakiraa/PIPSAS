import type { ColumnMapping, FieldSpec } from "@/types";
import { normalizeHeader, scoreHeaderMatch } from "@/lib/utils/fuzzyMatch";

export interface DetectionResult {
  mapping: ColumnMapping;
  confidences: Record<string, number>;
  matchedByMemory: Set<string>;
}

const AUTO_MATCH_THRESHOLD = 40;

/**
 * Detects which raw column each field should read from, by header NAME
 * (never by position). Remembered per-file-type mappings (from a prior,
 * user-confirmed import) are applied first with full confidence; anything
 * left is resolved via fuzzy header/alias matching, greedily assigning the
 * highest-confidence (field, column) pairs first so no column is claimed
 * by two fields.
 */
export function detectColumnMapping(
  headers: string[],
  fields: FieldSpec[],
  remembered: Record<string, string>,
): DetectionResult {
  const mapping: ColumnMapping = {};
  const confidences: Record<string, number> = {};
  const matchedByMemory = new Set<string>();
  const usedColumns = new Set<number>();

  for (const f of fields) {
    mapping[f.key] = null;
    confidences[f.key] = 0;
  }

  const normalizedHeaders = headers.map(normalizeHeader);
  const fieldByKey = new Map(fields.map((f) => [f.key, f]));

  // 1. Apply remembered mappings first (exact normalized-header match).
  normalizedHeaders.forEach((h, colIdx) => {
    if (!h || usedColumns.has(colIdx)) return;
    const fieldKey = remembered[h];
    if (!fieldKey || !fieldByKey.has(fieldKey) || mapping[fieldKey] != null) return;
    mapping[fieldKey] = colIdx;
    confidences[fieldKey] = 100;
    usedColumns.add(colIdx);
    matchedByMemory.add(fieldKey);
  });

  // 2. Fuzzy-match everything still unresolved, greedily assigning the
  // highest-scoring (field, column) pairs first.
  const remainingFields = fields.filter((f) => mapping[f.key] == null);
  const candidates: { fieldKey: string; colIdx: number; score: number }[] = [];
  for (const f of remainingFields) {
    normalizedHeaders.forEach((h, colIdx) => {
      if (!h || usedColumns.has(colIdx)) return;
      const score = scoreHeaderMatch(h, f.aliases);
      if (score > 0) candidates.push({ fieldKey: f.key, colIdx, score });
    });
  }
  candidates.sort((a, b) => b.score - a.score);

  const assignedFields = new Set<string>();
  for (const c of candidates) {
    if (assignedFields.has(c.fieldKey) || usedColumns.has(c.colIdx)) continue;
    if (c.score < AUTO_MATCH_THRESHOLD) continue;
    mapping[c.fieldKey] = c.colIdx;
    confidences[c.fieldKey] = c.score;
    usedColumns.add(c.colIdx);
    assignedFields.add(c.fieldKey);
  }

  return { mapping, confidences, matchedByMemory };
}

/** True when every required field is resolved via memory — safe to skip the review screen. */
export function allRequiredResolvedByMemory(fields: FieldSpec[], matchedByMemory: Set<string>): boolean {
  return fields.filter((f) => f.required).every((f) => matchedByMemory.has(f.key));
}
