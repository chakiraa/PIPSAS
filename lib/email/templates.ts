// Shared 5-language email templating system, ported 1:1 from the legacy
// PIP app's `buildEmail` function (legacy/PIP_V8_AI_Assistant.html ~L3428-3478).
//
// Every tab that generates supplier emails (the standalone Email Generator
// tab, and future per-row bulk-select flows in MC16/Backlog/MRP/SC/PMS)
// must build an `EmailSection[]` and pass it through `buildEmail()` so the
// language handling, greeting, and company signature stay identical
// everywhere. Do not duplicate this logic elsewhere.

import type { Contact } from "@/types";

export type SupportedLanguage = "en" | "fr" | "de" | "it" | "es";

/** One logical block of an email (e.g. "Overdue Deliveries"), localized into all 5 languages. */
export interface EmailSection {
  subjectEn: string;
  subjectFr: string;
  subjectDe: string;
  subjectIt: string;
  subjectEs: string;
  headerEn: string;
  headerFr: string;
  headerDe: string;
  headerIt: string;
  headerEs: string;
  linesEn: string[];
  linesFr: string[];
  linesDe: string[];
  linesIt: string[];
  linesEs: string[];
}

export interface BuiltEmail {
  subject: string;
  body: string;
}

/**
 * Resolves a raw contact `language` string (which may be a code like "fr" or
 * a free-text label like "French" / "français") to one of the 5 supported
 * languages. Defaults to English. Ported exactly from the legacy `buildEmail`
 * if/else chain — do not change the tolerated spellings without checking
 * legacy behavior first.
 */
export function detectLanguage(rawLanguage?: string | null): SupportedLanguage {
  const lang = (rawLanguage || "en").trim().toLowerCase();
  if (lang === "fr" || lang === "french" || lang === "français" || lang === "francais") return "fr";
  if (lang === "de" || lang === "german" || lang === "deutsch") return "de";
  if (lang === "it" || lang === "italian" || lang === "italiano") return "it";
  if (lang === "es" || lang === "spanish" || lang === "español" || lang === "espanol") return "es";
  return "en";
}

function formatBlocks(
  sections: EmailSection[],
  getHeader: (s: EmailSection) => string,
  getLines: (s: EmailSection) => string[],
): string {
  return sections
    .map((s) => {
      const header = getHeader(s);
      const lines = getLines(s);
      const underline = "─".repeat(header.length);
      return `${header}\n${underline}\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

/**
 * Builds the final subject + body for a supplier email from one or more
 * localized sections, given the resolved contact (if any). Mirrors the
 * legacy `buildEmail(supplierName, sections, contact)` exactly, including
 * the Liebherr Machines Bulle SA signature blocks per language.
 */
export function buildEmail(supplierName: string, sections: EmailSection[], contact?: Contact | null): BuiltEmail {
  const rawLang = (contact?.language || "en").trim();
  const lang = detectLanguage(rawLang);
  const greeting = contact?.contactName || supplierName;

  if (lang === "fr") {
    const b = formatBlocks(sections, (s) => s.headerFr, (s) => s.linesFr);
    return {
      subject: sections[0]?.subjectFr || `Message — ${supplierName}`,
      body: `Bonjour ${greeting},\n\nNous espérons que vous allez bien.\n\n${b}\n\nNous restons à votre disposition pour toute question.\n\nCordialement,\n\nLiebherr Machines Bulle SA\nService Achats`,
    };
  }

  if (lang === "de") {
    const name = contact?.contactName;
    const salutation = name ? `Sehr geehrte/r ${name},` : "Sehr geehrte Damen und Herren,";
    const b = formatBlocks(sections, (s) => s.headerDe, (s) => s.linesDe);
    return {
      subject: sections[0]?.subjectDe || `Anfrage — ${supplierName}`,
      body: `${salutation}\n\n${b}\n\nFür Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen,\n\nLiebherr Machines Bulle SA\nEinkauf`,
    };
  }

  if (lang === "it") {
    const b = formatBlocks(sections, (s) => s.headerIt, (s) => s.linesIt);
    return {
      subject: sections[0]?.subjectIt || `Comunicazione — ${supplierName}`,
      body: `Gentile ${greeting},\n\nSperiamo che questa email la trovi in buona salute.\n\n${b}\n\nResiamo a vostra disposizione per qualsiasi domanda.\n\nCordiali saluti,\n\nLiebherr Machines Bulle SA\nUfficio Acquisti`,
    };
  }

  if (lang === "es") {
    const b = formatBlocks(sections, (s) => s.headerEs || s.headerEn, (s) => s.linesEs || s.linesEn);
    return {
      subject: sections[0]?.subjectEs || `Comunicación — ${supplierName}`,
      body: `Estimado/a ${greeting},\n\nEsperamos que se encuentre bien.\n\n${b}\n\nQuedamos a su disposición para cualquier consulta.\n\nAtentamente,\n\nLiebherr Machines Bulle SA\nDepartamento de Compras`,
    };
  }

  // English (default)
  const b = formatBlocks(sections, (s) => s.headerEn, (s) => s.linesEn);
  return {
    subject: sections[0]?.subjectEn || `Message — ${supplierName}`,
    body: `Dear ${greeting},\n\nI hope this email finds you well.\n\n${b}\n\nPlease do not hesitate to contact us should you have any questions.\n\nBest regards,\n\nLiebherr Machines Bulle SA\nProcurement Department`,
  };
}
