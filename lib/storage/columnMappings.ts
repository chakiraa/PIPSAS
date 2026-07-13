import type { FileKind } from "@/types";
import { COLUMN_MAPPING_KEY, safeLoad, safeSave } from "./keys";
import { normalizeHeader } from "@/lib/utils/fuzzyMatch";

/** Per-file-type memory of confirmed header → field mappings, so correction is one-time. */
export type RememberedMappings = Record<string, Record<string, string>>; // fileKind -> normalizedHeader -> fieldKey

export function loadRememberedMappings(): RememberedMappings {
  return safeLoad<RememberedMappings>(COLUMN_MAPPING_KEY, {});
}

export function getRememberedForFileKind(fileKind: FileKind): Record<string, string> {
  return loadRememberedMappings()[fileKind] ?? {};
}

/** Persists the confirmed header->field associations for a file type (merges with existing memory). */
export function rememberMappings(fileKind: FileKind, headers: string[], mapping: Record<string, number | null>): void {
  const all = loadRememberedMappings();
  const forKind = { ...(all[fileKind] ?? {}) };
  for (const [fieldKey, columnIndex] of Object.entries(mapping)) {
    if (columnIndex == null) continue;
    const header = headers[columnIndex];
    if (!header) continue;
    forKind[normalizeHeader(header)] = fieldKey;
  }
  all[fileKind] = forKind;
  safeSave(COLUMN_MAPPING_KEY, all);
}
