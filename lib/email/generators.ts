// Shared row -> email generators, ported from the legacy PIP app.
//
// The legacy app (legacy/PIP_V8_AI_Assistant.html) had TWO near-duplicate
// implementations of this logic: one set of "shared" functions
// (genEmailsFromBacklogRows / genEmailsFromMRPRows / genEmailsFromSCRows /
// genEmailsFromPMSRows, ~L3479-3670) meant for reuse, and a second,
// slightly-diverged copy hardcoded inside GenerateEmailsTab
// (genOverdue / genNotConfirmed / genPMSActions, ~L3748-3891).
//
// This module consolidates that into exactly ONE implementation per email
// type. The standalone Email Generator tab (app/emails/page.tsx) and any
// future per-row bulk-select UI in the MC16/Backlog/MRP/SC/PMS tabs
// (built by a parallel workstream) must both call these same functions —
// do not re-implement this logic in a tab component.

import type { BacklogRow, Contact, MrpRow, PmsRow, ScRow } from "@/types";
import { findBestContact } from "@/lib/utils/fuzzyMatch";
import { formatDateHuman, TODAY_STR } from "@/lib/utils/dates";
import { buildEmail, type EmailSection } from "./templates";

const fmtDate = formatDateHuman;

/** The shape returned for every generated supplier email — consumed by EmailCard / InlineEmailPanel. */
export interface GeneratedEmail {
  supplierName: string;
  email: string;
  contactName: string;
  language: string;
  hasContact: boolean;
  subject: string;
  body: string;
  itemCount: number;
}

/** Groups rows by supplier name, returning entries sorted by group size (largest first) — matches legacy ordering. */
function groupBySupplier<T>(rows: T[], supplierNameOf: (row: T) => string): [string, T[]][] {
  const grouped: Record<string, T[]> = {};
  for (const row of rows) {
    const sup = supplierNameOf(row) || "Unknown";
    if (!grouped[sup]) grouped[sup] = [];
    grouped[sup].push(row);
  }
  return Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
}

function toGeneratedEmail(sup: string, contact: Contact | null, subject: string, body: string, itemCount: number): GeneratedEmail {
  return {
    supplierName: sup,
    email: contact?.contactEmail || "",
    contactName: contact?.contactName || "",
    language: contact?.language || "English",
    hasContact: !!contact?.contactEmail,
    subject,
    body,
    itemCount,
  };
}

// ── Overdue Deliveries ──────────────────────────────────────────────────
// Shared by: the Backlog tab's bulk-select flow (via genEmailsFromBacklogRows)
// AND the standalone Email Generator's "Overdue Deliveries" preset, which
// combines MRP + SC rows into the same generic line-item shape below.

export interface OverdueLineItem {
  supplierName: string;
  ref: string;
  itemNumber: string;
  itemDescription: string;
  plannedReceiptDate: string;
  daysLate: number | null;
}

export function genEmailsFromOverdueItems(items: OverdueLineItem[], contacts: Contact[]): GeneratedEmail[] {
  if (!items.length) return [];
  return groupBySupplier(items, (r) => r.supplierName).map(([sup, group]) => {
    const contact = findBestContact(contacts, sup);
    const lateLine = (r: OverdueLineItem) => ((r.daysLate || 0) > 0 ? `${r.daysLate} days late` : "due today");
    const section: EmailSection = {
      subjectEn: `Overdue Delivery Follow-Up — ${sup}`,
      subjectFr: `Relance livraisons en retard — ${sup}`,
      subjectDe: `Ausstehende Lieferungen — ${sup}`,
      subjectIt: `Sollecito consegne in ritardo — ${sup}`,
      subjectEs: `Seguimiento de entregas pendientes — ${sup}`,
      headerEn: "Overdue Deliveries",
      headerFr: "Livraisons en retard",
      headerDe: "Ausstehende Lieferungen",
      headerIt: "Consegne in ritardo",
      headerEs: "Entregas pendientes",
      linesEn: [
        "The following deliveries are overdue. Please provide an updated expected delivery date for each:",
        ...group.map((r) => `  • PO #${r.ref} — ${r.itemDescription || r.itemNumber || "—"}\n    Item: ${r.itemNumber}  |  Planned: ${fmtDate(r.plannedReceiptDate)}  |  ${lateLine(r)}`),
      ],
      linesFr: [
        "Les livraisons suivantes sont en retard. Merci de nous communiquer de nouvelles dates de livraison :",
        ...group.map((r) => `  • PO #${r.ref} — ${r.itemDescription || r.itemNumber || "—"}\n    Article : ${r.itemNumber}  |  Prévu le : ${fmtDate(r.plannedReceiptDate)}  |  ${(r.daysLate || 0) > 0 ? r.daysLate + " jours de retard" : "prévu aujourd'hui"}`),
      ],
      linesDe: [
        "Die folgenden Lieferungen sind überfällig. Bitte teilen Sie uns aktualisierte Liefertermine mit:",
        ...group.map((r) => `  • PO #${r.ref} — ${r.itemDescription || r.itemNumber || "—"}\n    Artikel: ${r.itemNumber}  |  Geplant: ${fmtDate(r.plannedReceiptDate)}  |  ${(r.daysLate || 0) > 0 ? r.daysLate + " Tage Verzug" : "heute fällig"}`),
      ],
      linesIt: [
        "Le seguenti consegne sono in ritardo. Si prega di fornire date di consegna aggiornate:",
        ...group.map((r) => `  • PO #${r.ref} — ${r.itemDescription || r.itemNumber || "—"}\n    Articolo: ${r.itemNumber}  |  Previsto: ${fmtDate(r.plannedReceiptDate)}  |  ${(r.daysLate || 0) > 0 ? r.daysLate + " giorni di ritardo" : "scade oggi"}`),
      ],
      linesEs: [
        "Las siguientes entregas están pendientes. Le rogamos que nos proporcione nuevas fechas de entrega:",
        ...group.map((r) => `  • PO #${r.ref} — ${r.itemDescription || r.itemNumber || "—"}\n    Artículo: ${r.itemNumber}  |  Planificado: ${fmtDate(r.plannedReceiptDate)}  |  ${(r.daysLate || 0) > 0 ? r.daysLate + " días de retraso" : "vence hoy"}`),
      ],
    };
    const { subject, body } = buildEmail(sup, [section], contact);
    return toGeneratedEmail(sup, contact, subject, body, group.length);
  });
}

/** Backlog rows -> "Overdue Deliveries" emails. Thin adapter over genEmailsFromOverdueItems. */
export function genEmailsFromBacklogRows(rows: BacklogRow[], contacts: Contact[]): GeneratedEmail[] {
  const items: OverdueLineItem[] = rows.map((r) => ({
    supplierName: r.supplierName,
    ref: r.purchaseOrder,
    itemNumber: r.itemNumber,
    itemDescription: r.itemDescription,
    plannedReceiptDate: r.plannedReceiptDate,
    daysLate: r.daysLate,
  }));
  return genEmailsFromOverdueItems(items, contacts);
}

// ── Order Confirmation Follow-Up (MRP) ──────────────────────────────────

export function genEmailsFromMRPRows(rows: MrpRow[], contacts: Contact[]): GeneratedEmail[] {
  if (!rows.length) return [];
  return groupBySupplier(rows, (r) => r.supplierName).map(([sup, items]) => {
    const contact = findBestContact(contacts, sup);
    const notConf = items.filter((r) => r.confirmationStatus === "Not Confirmed");
    const pending = items.filter((r) => r.confirmationStatus === "Pending Acceptance");
    const others = items.filter((r) => r.confirmationStatus !== "Not Confirmed" && r.confirmationStatus !== "Pending Acceptance");
    const section: EmailSection = {
      subjectEn: `Order Confirmation Follow-Up — ${sup}`,
      subjectFr: `Suivi confirmations de commande — ${sup}`,
      subjectDe: `Auftragsbestätigung — Rückfrage — ${sup}`,
      subjectIt: `Follow-up conferma ordini — ${sup}`,
      subjectEs: `Seguimiento confirmación de pedidos — ${sup}`,
      headerEn: "Order Confirmation Follow-Up",
      headerFr: "Suivi des confirmations de commande",
      headerDe: "Rückfrage zur Auftragsbestätigung",
      headerIt: "Follow-up conferma ordini",
      headerEs: "Seguimiento de confirmación de pedidos",
      linesEn: [
        ...(notConf.length
          ? [
              `The following orders have not yet been confirmed. Please acknowledge receipt and provide an expected delivery date:`,
              ...notConf.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Item: ${r.itemNumber}  |  Order date: ${fmtDate(r.orderDate)}  |  Planned: ${fmtDate(r.plannedReceiptDate)}`),
            ]
          : []),
        ...(pending.length
          ? [
              `The following orders have a supplier-proposed date pending your acceptance:`,
              ...pending.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Item: ${r.itemNumber}  |  Supplier date: ${fmtDate(r.confDeliveryDateSupplier)}`),
            ]
          : []),
        ...(others.length
          ? [
              `Please provide a status update for the following orders:`,
              ...others.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Item: ${r.itemNumber}  |  Status: ${r.confirmationStatus}  |  Planned: ${fmtDate(r.plannedReceiptDate)}`),
            ]
          : []),
      ],
      linesFr: [
        ...(notConf.length
          ? [
              `Les commandes suivantes ne sont pas encore confirmées. Merci de bien vouloir accuser réception et nous indiquer une date de livraison prévisionnelle :`,
              ...notConf.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Article : ${r.itemNumber}  |  Commandé le : ${fmtDate(r.orderDate)}  |  Prévu le : ${fmtDate(r.plannedReceiptDate)}`),
            ]
          : []),
        ...(pending.length
          ? [
              `Les commandes suivantes ont une date proposée par le fournisseur en attente d'acceptation :`,
              ...pending.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Article : ${r.itemNumber}  |  Date fournisseur : ${fmtDate(r.confDeliveryDateSupplier)}`),
            ]
          : []),
        ...(others.length
          ? [
              `Merci de nous communiquer l'état d'avancement des commandes suivantes :`,
              ...others.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Article : ${r.itemNumber}  |  Statut : ${r.confirmationStatus}  |  Prévu le : ${fmtDate(r.plannedReceiptDate)}`),
            ]
          : []),
      ],
      linesDe: [
        ...(notConf.length
          ? [
              `Die folgenden Bestellungen wurden noch nicht bestätigt. Bitte bestätigen Sie den Erhalt und nennen Sie uns einen voraussichtlichen Liefertermin:`,
              ...notConf.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Artikel: ${r.itemNumber}  |  Bestelldatum: ${fmtDate(r.orderDate)}  |  Geplant: ${fmtDate(r.plannedReceiptDate)}`),
            ]
          : []),
        ...(pending.length
          ? [
              `Die folgenden Bestellungen haben ein vom Lieferanten vorgeschlagenes Datum, das noch akzeptiert werden muss:`,
              ...pending.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Artikel: ${r.itemNumber}  |  Lieferantendatum: ${fmtDate(r.confDeliveryDateSupplier)}`),
            ]
          : []),
        ...(others.length
          ? [
              `Bitte teilen Sie uns den aktuellen Stand der folgenden Bestellungen mit:`,
              ...others.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Artikel: ${r.itemNumber}  |  Status: ${r.confirmationStatus}  |  Geplant: ${fmtDate(r.plannedReceiptDate)}`),
            ]
          : []),
      ],
      linesIt: [
        ...(notConf.length
          ? [
              `I seguenti ordini non sono ancora stati confermati. Si prega di accusare ricevuta e fornire una data di consegna prevista:`,
              ...notConf.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Articolo: ${r.itemNumber}  |  Data ordine: ${fmtDate(r.orderDate)}  |  Previsto: ${fmtDate(r.plannedReceiptDate)}`),
            ]
          : []),
        ...(pending.length
          ? [
              `I seguenti ordini hanno una data proposta dal fornitore in attesa di accettazione:`,
              ...pending.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Articolo: ${r.itemNumber}  |  Data fornitore: ${fmtDate(r.confDeliveryDateSupplier)}`),
            ]
          : []),
        ...(others.length
          ? [
              `Si prega di fornire un aggiornamento sullo stato dei seguenti ordini:`,
              ...others.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Articolo: ${r.itemNumber}  |  Stato: ${r.confirmationStatus}  |  Previsto: ${fmtDate(r.plannedReceiptDate)}`),
            ]
          : []),
      ],
      linesEs: [
        ...(notConf.length
          ? [
              `Los siguientes pedidos no han sido confirmados aún. Le rogamos confirme la recepción e indique una fecha de entrega prevista:`,
              ...notConf.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Artículo: ${r.itemNumber}  |  Pedido: ${fmtDate(r.orderDate)}  |  Planificado: ${fmtDate(r.plannedReceiptDate)}`),
            ]
          : []),
        ...(pending.length
          ? [
              `Los siguientes pedidos tienen una fecha propuesta por el proveedor pendiente de aceptación:`,
              ...pending.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Artículo: ${r.itemNumber}  |  Fecha proveedor: ${fmtDate(r.confDeliveryDateSupplier)}`),
            ]
          : []),
        ...(others.length
          ? [
              `Le rogamos nos proporcione una actualización del estado de los siguientes pedidos:`,
              ...others.map((r) => `  • PO #${r.orderNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Artículo: ${r.itemNumber}  |  Estado: ${r.confirmationStatus}  |  Planificado: ${fmtDate(r.plannedReceiptDate)}`),
            ]
          : []),
      ],
    };
    const { subject, body } = buildEmail(sup, [section], contact);
    return toGeneratedEmail(sup, contact, subject, body, items.length);
  });
}

// ── Order Status Request (SC) ───────────────────────────────────────────

export function genEmailsFromSCRows(rows: ScRow[], contacts: Contact[]): GeneratedEmail[] {
  if (!rows.length) return [];
  return groupBySupplier(rows, (r) => r.supplierName).map(([sup, items]) => {
    const contact = findBestContact(contacts, sup);
    const late = items.filter((r) => r.plannedReceiptDate && r.plannedReceiptDate <= TODAY_STR);
    const upcoming = items.filter((r) => !r.plannedReceiptDate || r.plannedReceiptDate > TODAY_STR);
    const section: EmailSection = {
      subjectEn: `Order Status Request — ${sup}`,
      subjectFr: `Demande de statut de commande — ${sup}`,
      subjectDe: `Anfrage zum Bestellstatus — ${sup}`,
      subjectIt: `Richiesta stato ordine — ${sup}`,
      subjectEs: `Solicitud de estado de pedido — ${sup}`,
      headerEn: "Order Status Follow-Up",
      headerFr: "Suivi du statut des commandes",
      headerDe: "Rückfrage zum Bestellstatus",
      headerIt: "Follow-up sullo stato degli ordini",
      headerEs: "Seguimiento del estado de pedidos",
      linesEn: [
        ...(late.length
          ? [
              `The following scheduled lines are overdue. Please confirm whether the goods have been shipped and provide updated delivery dates:`,
              ...late.map((r) => `  • SC #${r.scheduleNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Item: ${r.itemNumber}  |  Planned: ${fmtDate(r.plannedReceiptDate)}  |  Qty: ${r.scheduleQuantity || "—"}`),
            ]
          : []),
        ...(upcoming.length
          ? [
              `Please also confirm the status of the following upcoming scheduled deliveries:`,
              ...upcoming.map((r) => `  • SC #${r.scheduleNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Item: ${r.itemNumber}  |  Planned: ${fmtDate(r.plannedReceiptDate)}  |  Qty: ${r.scheduleQuantity || "—"}`),
            ]
          : []),
      ],
      linesFr: [
        ...(late.length
          ? [
              `Les lignes planifiées suivantes sont en retard. Merci de confirmer si les marchandises ont été expédiées et de nous communiquer de nouvelles dates de livraison :`,
              ...late.map((r) => `  • SC #${r.scheduleNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Article : ${r.itemNumber}  |  Prévu le : ${fmtDate(r.plannedReceiptDate)}  |  Qté : ${r.scheduleQuantity || "—"}`),
            ]
          : []),
        ...(upcoming.length
          ? [
              `Merci également de confirmer le statut des livraisons planifiées suivantes :`,
              ...upcoming.map((r) => `  • SC #${r.scheduleNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Article : ${r.itemNumber}  |  Prévu le : ${fmtDate(r.plannedReceiptDate)}  |  Qté : ${r.scheduleQuantity || "—"}`),
            ]
          : []),
      ],
      linesDe: [
        ...(late.length
          ? [
              `Die folgenden Planzeilen sind überfällig. Bitte bestätigen Sie, ob die Waren versandt wurden, und nennen Sie uns aktualisierte Liefertermine:`,
              ...late.map((r) => `  • SC #${r.scheduleNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Artikel: ${r.itemNumber}  |  Geplant: ${fmtDate(r.plannedReceiptDate)}  |  Menge: ${r.scheduleQuantity || "—"}`),
            ]
          : []),
        ...(upcoming.length
          ? [
              `Bitte bestätigen Sie auch den Status der folgenden geplanten Lieferungen:`,
              ...upcoming.map((r) => `  • SC #${r.scheduleNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Artikel: ${r.itemNumber}  |  Geplant: ${fmtDate(r.plannedReceiptDate)}  |  Menge: ${r.scheduleQuantity || "—"}`),
            ]
          : []),
      ],
      linesIt: [
        ...(late.length
          ? [
              `Le seguenti righe pianificate sono in ritardo. Confermare se la merce è stata spedita e fornire date di consegna aggiornate:`,
              ...late.map((r) => `  • SC #${r.scheduleNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Articolo: ${r.itemNumber}  |  Previsto: ${fmtDate(r.plannedReceiptDate)}  |  Qtà: ${r.scheduleQuantity || "—"}`),
            ]
          : []),
        ...(upcoming.length
          ? [
              `Confermare inoltre lo stato delle seguenti consegne pianificate:`,
              ...upcoming.map((r) => `  • SC #${r.scheduleNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Articolo: ${r.itemNumber}  |  Previsto: ${fmtDate(r.plannedReceiptDate)}  |  Qtà: ${r.scheduleQuantity || "—"}`),
            ]
          : []),
      ],
      linesEs: [
        ...(late.length
          ? [
              `Las siguientes líneas planificadas están vencidas. Confirme si la mercancía ha sido enviada y proporcione fechas de entrega actualizadas:`,
              ...late.map((r) => `  • SC #${r.scheduleNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Artículo: ${r.itemNumber}  |  Planificado: ${fmtDate(r.plannedReceiptDate)}  |  Cant.: ${r.scheduleQuantity || "—"}`),
            ]
          : []),
        ...(upcoming.length
          ? [
              `Confirme también el estado de las siguientes entregas planificadas:`,
              ...upcoming.map((r) => `  • SC #${r.scheduleNumber} — ${r.itemDescription || r.itemNumber || "—"}\n    Artículo: ${r.itemNumber}  |  Planificado: ${fmtDate(r.plannedReceiptDate)}  |  Cant.: ${r.scheduleQuantity || "—"}`),
            ]
          : []),
      ],
    };
    const { subject, body } = buildEmail(sup, [section], contact);
    return toGeneratedEmail(sup, contact, subject, body, items.length);
  });
}

// ── PMS Actions (Accelerate / Cancel / Delay / Other) ───────────────────

export type PmsSignalBucket = "Accelerate" | "Cancel" | "Delay" | "Other";

/**
 * Keyword-based signal grouping — works regardless of the exact string
 * Infor LN sends. Ported exactly from the legacy `classifySignal` helper.
 */
export function classifySignal(signal?: string | null): PmsSignalBucket {
  const k = (signal || "").toLowerCase();
  if (k.includes("cancel")) return "Cancel";
  if (k.includes("accelerate")) return "Accelerate";
  if (k.includes("prio") || (k.includes("late") && k.includes("rel"))) return "Accelerate"; // Prio Release too Late = treat as urgent
  if (k.startsWith("delay") && !k.includes("rel")) return "Delay";
  return "Other";
}

export function genEmailsFromPMSRows(rows: PmsRow[], contacts: Contact[]): GeneratedEmail[] {
  if (!rows.length) return [];
  return groupBySupplier(rows, (r) => r.supplier)
    .map(([sup, allItems]): GeneratedEmail | null => {
      const contact = findBestContact(contacts, sup);
      const bySignal: Record<PmsSignalBucket, PmsRow[]> = {
        Accelerate: allItems.filter((r) => classifySignal(r.signal) === "Accelerate"),
        Cancel: allItems.filter((r) => classifySignal(r.signal) === "Cancel"),
        Delay: allItems.filter((r) => classifySignal(r.signal) === "Delay"),
        Other: allItems.filter((r) => classifySignal(r.signal) === "Other"),
      };
      const sections: EmailSection[] = [];

      if (bySignal.Accelerate.length) {
        sections.push({
          subjectEn: `PMS Action Required — ${sup}`,
          subjectFr: `Actions PMS requises — ${sup}`,
          subjectDe: `PMS-Maßnahmen erforderlich — ${sup}`,
          subjectIt: `Azioni PMS richieste — ${sup}`,
          subjectEs: `Acciones PMS requeridas — ${sup}`,
          headerEn: "⚡ ACCELERATE — Bring delivery forward",
          headerFr: "⚡ ACCÉLÉRER — Avancer la livraison",
          headerDe: "⚡ BESCHLEUNIGEN — Lieferung vorziehen",
          headerIt: "⚡ ACCELERARE — Anticipare la consegna",
          headerEs: "⚡ ACELERAR — Adelantar la entrega",
          linesEn: ["We need to accelerate the following orders. Please confirm the earliest possible delivery date:", ...bySignal.Accelerate.map((r) => `  • PO ${r.poNumber}  |  Item ${r.itemNumber}  |  Current: ${r.oldDate || "—"}  →  Requested: ${r.newDate || "ASAP"}`)],
          linesFr: ["Nous devons accélérer les commandes suivantes. Merci de confirmer la date la plus proche :", ...bySignal.Accelerate.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Actuel : ${r.oldDate || "—"}  →  Souhaité : ${r.newDate || "ASAP"}`)],
          linesDe: ["Wir müssen folgende Bestellungen beschleunigen. Bitte bestätigen Sie den frühestmöglichen Termin:", ...bySignal.Accelerate.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Aktuell: ${r.oldDate || "—"}  →  Gewünscht: ${r.newDate || "ASAP"}`)],
          linesIt: ["Dobbiamo accelerare i seguenti ordini. Confermare la prima data possibile:", ...bySignal.Accelerate.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Attuale: ${r.oldDate || "—"}  →  Richiesta: ${r.newDate || "ASAP"}`)],
          linesEs: ["Necesitamos acelerar los siguientes pedidos. Confirme la fecha más próxima posible:", ...bySignal.Accelerate.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Actual: ${r.oldDate || "—"}  →  Solicitado: ${r.newDate || "ASAP"}`)],
        });
      }
      if (bySignal.Cancel.length) {
        sections.push({
          subjectEn: `PMS Action Required — ${sup}`,
          subjectFr: `Actions PMS requises — ${sup}`,
          subjectDe: `PMS-Maßnahmen erforderlich — ${sup}`,
          subjectIt: `Azioni PMS richieste — ${sup}`,
          subjectEs: `Acciones PMS requeridas — ${sup}`,
          headerEn: "❌ CANCEL — Order cancellation",
          headerFr: "❌ ANNULER — Annulation de commande",
          headerDe: "❌ STORNIEREN — Bestellstornierung",
          headerIt: "❌ ANNULLARE — Annullamento ordine",
          headerEs: "❌ CANCELAR — Cancelación de pedido",
          linesEn: ["We would like to cancel the following orders. Please confirm and return any unshipped goods:", ...bySignal.Cancel.map((r) => `  • PO ${r.poNumber}  |  Item ${r.itemNumber}  |  Qty: ${r.newQty ?? r.oldQty}`)],
          linesFr: ["Nous souhaitons annuler les commandes suivantes. Merci de confirmer et de retourner les marchandises non expédiées :", ...bySignal.Cancel.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Qté : ${r.newQty ?? r.oldQty}`)],
          linesDe: ["Wir möchten folgende Bestellungen stornieren. Bitte bestätigen und nicht versandte Ware retournieren:", ...bySignal.Cancel.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Menge: ${r.newQty ?? r.oldQty}`)],
          linesIt: ["Desideriamo annullare i seguenti ordini. Confermare e restituire la merce non spedita:", ...bySignal.Cancel.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Qtà: ${r.newQty ?? r.oldQty}`)],
          linesEs: ["Deseamos cancelar los siguientes pedidos. Confirme y devuelva la mercancía no enviada:", ...bySignal.Cancel.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Cant.: ${r.newQty ?? r.oldQty}`)],
        });
      }
      if (bySignal.Delay.length) {
        sections.push({
          subjectEn: `PMS Action Required — ${sup}`,
          subjectFr: `Actions PMS requises — ${sup}`,
          subjectDe: `PMS-Maßnahmen erforderlich — ${sup}`,
          subjectIt: `Azioni PMS richieste — ${sup}`,
          subjectEs: `Acciones PMS requeridas — ${sup}`,
          headerEn: "⏩ DELAY — Push delivery date",
          headerFr: "⏩ REPORTER — Repousser la livraison",
          headerDe: "⏩ VERSCHIEBEN — Liefertermin verschieben",
          headerIt: "⏩ POSTICIPARE — Posticipare la consegna",
          headerEs: "⏩ RETRASAR — Posponer la entrega",
          linesEn: ["We need to delay the following orders. Please confirm the new delivery date:", ...bySignal.Delay.map((r) => `  • PO ${r.poNumber}  |  Item ${r.itemNumber}  |  Old: ${r.oldDate || "—"}  →  New: ${r.newDate || "TBD"}`)],
          linesFr: ["Nous devons reporter les livraisons suivantes. Merci de confirmer la nouvelle date :", ...bySignal.Delay.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Ancienne : ${r.oldDate || "—"}  →  Nouvelle : ${r.newDate || "À définir"}`)],
          linesDe: ["Wir müssen folgende Lieferungen verschieben. Bitte bestätigen Sie das neue Datum:", ...bySignal.Delay.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Alt: ${r.oldDate || "—"}  →  Neu: ${r.newDate || "Offen"}`)],
          linesIt: ["Dobbiamo posticipare le seguenti consegne. Confermare la nuova data:", ...bySignal.Delay.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Vecchia: ${r.oldDate || "—"}  →  Nuova: ${r.newDate || "Da definire"}`)],
          linesEs: ["Necesitamos retrasar las siguientes entregas. Confirme la nueva fecha:", ...bySignal.Delay.map((r) => `  • PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  Antigua: ${r.oldDate || "—"}  →  Nueva: ${r.newDate || "A definir"}`)],
        });
      }
      if (bySignal.Other.length) {
        sections.push({
          subjectEn: `PMS Update — ${sup}`,
          subjectFr: `Mise à jour PMS — ${sup}`,
          subjectDe: `PMS-Update — ${sup}`,
          subjectIt: `Aggiornamento PMS — ${sup}`,
          subjectEs: `Actualización PMS — ${sup}`,
          headerEn: "PMS Signal Update",
          headerFr: "Signal PMS",
          headerDe: "PMS-Signal",
          headerIt: "Segnale PMS",
          headerEs: "Señal PMS",
          linesEn: ["Please note the following PMS signals:", ...bySignal.Other.map((r) => `  • [${r.signal}] PO ${r.poNumber}  |  Item ${r.itemNumber}  |  ${r.oldDate || "—"}  →  ${r.newDate || "—"}`)],
          linesFr: ["Veuillez noter les signaux PMS suivants :", ...bySignal.Other.map((r) => `  • [${r.signal}] PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  ${r.oldDate || "—"}  →  ${r.newDate || "—"}`)],
          linesDe: ["Bitte nehmen Sie folgende PMS-Signale zur Kenntnis:", ...bySignal.Other.map((r) => `  • [${r.signal}] PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  ${r.oldDate || "—"}  →  ${r.newDate || "—"}`)],
          linesIt: ["Si prega di prendere nota dei seguenti segnali PMS:", ...bySignal.Other.map((r) => `  • [${r.signal}] PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  ${r.oldDate || "—"}  →  ${r.newDate || "—"}`)],
          linesEs: ["Por favor, tome nota de las siguientes señales PMS:", ...bySignal.Other.map((r) => `  • [${r.signal}] PO ${r.poNumber}  |  Art. ${r.itemNumber}  |  ${r.oldDate || "—"}  →  ${r.newDate || "—"}`)],
        });
      }

      if (!sections.length) return null;
      const { subject, body } = buildEmail(sup, sections, contact);
      return toGeneratedEmail(sup, contact, subject, body, allItems.length);
    })
    .filter((e): e is GeneratedEmail => e !== null);
}
