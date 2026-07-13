// Fuzzy string matching helpers used for supplier-contact resolution
// and (extended for the new import feature) Excel header detection.

import type { Contact } from "@/types";

export function normalizeHeader(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[_\-./]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findBestContact(contacts: Contact[], supplierName: string): Contact | null {
  if (!supplierName || !contacts?.length) return null;
  const target = supplierName.trim().toLowerCase();
  if (!target) return null;

  let best: Contact | null = null;
  let bestScore = 0;

  for (const c of contacts) {
    const name = (c.supplierName || "").trim().toLowerCase();
    if (!name) continue;
    let score = 0;
    if (name === target) {
      score = 100;
    } else if (name.includes(target) || target.includes(name)) {
      score = 70;
    } else {
      const targetWords = target.split(/\s+/).filter((w) => w.length > 2);
      const nameWords = name.split(/\s+/).filter((w) => w.length > 2);
      if (targetWords.some((w) => nameWords.includes(w))) score = 40;
    }
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return bestScore > 30 ? best : null;
}

/**
 * Scores how well a raw column header matches a field's known aliases.
 * Returns 0-100. Case-insensitive, whitespace/accent tolerant, tolerates
 * minor wording differences via substring + token overlap.
 */
export function scoreHeaderMatch(rawHeader: string, aliases: string[]): number {
  const header = normalizeHeader(rawHeader);
  if (!header) return 0;

  let best = 0;
  for (const aliasRaw of aliases) {
    const alias = normalizeHeader(aliasRaw);
    if (!alias) continue;
    if (header === alias) return 100;

    let score = 0;
    if (header.includes(alias) || alias.includes(header)) {
      score = 75;
    } else {
      const headerTokens = header.split(" ").filter(Boolean);
      const aliasTokens = alias.split(" ").filter(Boolean);
      const overlap = aliasTokens.filter((t) => headerTokens.includes(t)).length;
      if (overlap > 0) {
        score = Math.round((overlap / aliasTokens.length) * 60);
      } else {
        score = levenshteinSimilarity(header, alias) >= 0.82 ? 55 : 0;
      }
    }
    if (score > best) best = score;
  }
  return best;
}

function levenshteinSimilarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}
