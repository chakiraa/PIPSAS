// All localStorage keys, ported 1:1 from the legacy app so existing
// user data (if any) keeps working across the migration.

export const STORAGE_KEY = "pipv1_v1";
export const CONTACTS_KEY = "pipv2_contacts_v1";
export const SOLVED_KEY = "pipv1_backlog_solved_v1";
export const TOGGLE_DATE_KEY = "pipv1_toggle_date_v1";
export const PROFILE_KEY = "pipv1_profile_name";
export const SHIPMENT_KEY = "pipv1_shipments_v1";
export const COMMENT_KEY_V2 = "pipv1_comments_v2";
export const AI_HISTORY_KEY = "pipv1_ai_history_v1";
export const TODO_KEY = "pipv1_todo_v1";
export const THEME_KEY = "pipv1_theme";

// New: per-file-type confirmed column mappings (new column-mapping feature).
export const COLUMN_MAPPING_KEY = "pipv1_column_mappings_v1";

export function safeLoad<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeSave(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or private mode — silently ignore, matching legacy behavior
  }
}
