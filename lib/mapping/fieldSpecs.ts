import type { FieldSpec, FileKind } from "@/types";

// Header aliases are matched case-insensitively, trimmed, accent/whitespace
// tolerant (see lib/utils/fuzzyMatch.ts#scoreHeaderMatch) — list the common
// EN/FR wordings colleagues' exports actually use, not every permutation.

const MC16_FIELDS: FieldSpec[] = [
  { key: "articleNumber", label: "Article Number", required: true, type: "string", aliases: ["item number", "item", "article number", "numero article", "n article", "code article", "article"] },
  { key: "articleName", label: "Article Name", required: false, type: "string", aliases: ["item description", "description", "article name", "nom article", "designation"] },
  { key: "articleDescription", label: "Article Description", required: false, type: "string", aliases: ["extended description", "long description", "description detaillee", "desc"] },
  { key: "priorityCode", label: "Priority Code", required: true, type: "number", aliases: ["priority code", "code priorite", "mrp priority code", "priority"] },
  { key: "outOfStockDate", label: "Out of Stock Date", required: false, type: "date", aliases: ["out of stock date", "date rupture", "stock out date", "date de rupture de stock", "oos date"] },
];

const PMS_FIELDS: FieldSpec[] = [
  { key: "signal", label: "Signal", required: true, type: "string", aliases: ["signal", "action", "pms signal", "message type"] },
  { key: "supplier", label: "Supplier", required: true, type: "string", aliases: ["supplier", "supplier name", "business partner", "fournisseur", "bp name", "nom fournisseur"] },
  { key: "supplierNum", label: "Supplier Number", required: false, type: "string", aliases: ["supplier number", "supplier code", "bp code", "numero fournisseur", "code fournisseur"] },
  { key: "itemNumber", label: "Item Number", required: true, type: "string", aliases: ["item number", "item", "article number", "numero article"] },
  { key: "itemDescription", label: "Item Description", required: false, type: "string", aliases: ["item description", "description", "designation"] },
  { key: "poNumber", label: "PO Number", required: false, type: "string", aliases: ["po number", "order number", "purchase order", "numero de commande", "commande achat"] },
  { key: "poLine", label: "PO Line", required: false, type: "string", aliases: ["po line", "order line", "ligne de commande", "position"] },
  { key: "oldDate", label: "Old Date", required: false, type: "date", aliases: ["old date", "current date", "ancienne date", "date actuelle"] },
  { key: "newDate", label: "New Date", required: false, type: "date", aliases: ["new date", "requested date", "nouvelle date", "date demandee"] },
  { key: "oldQty", label: "Old Quantity", required: false, type: "number", aliases: ["old quantity", "old qty", "ancienne quantite"] },
  { key: "newQty", label: "New Quantity", required: false, type: "number", aliases: ["new quantity", "new qty", "nouvelle quantite"] },
  { key: "orderStatus", label: "Order Status", required: false, type: "string", aliases: ["order status", "status", "statut de commande", "statut"] },
];

const MRP_FIELDS: FieldSpec[] = [
  { key: "orderNumber", label: "Order Number", required: true, type: "string", aliases: ["order number", "purchase order", "numero de commande", "commande achat", "po number"] },
  { key: "supplierNumber", label: "Supplier Number", required: false, type: "string", aliases: ["supplier number", "supplier code", "numero fournisseur", "code fournisseur", "bp code"] },
  { key: "supplierName", label: "Supplier Name", required: true, type: "string", aliases: ["supplier name", "supplier", "fournisseur", "business partner", "nom fournisseur"] },
  { key: "itemNumber", label: "Item Number", required: true, type: "string", aliases: ["item number", "item", "article number", "numero article", "code article"] },
  { key: "itemDescription", label: "Item Description", required: false, type: "string", aliases: ["item description", "description", "designation"] },
  { key: "confDeliveryDateSupplier", label: "Confirmed Delivery Date (Supplier)", required: false, type: "date", aliases: ["confirmed delivery date supplier", "conf delivery date", "date livraison confirmee", "supplier confirmed date"] },
  { key: "confDateAccepted", label: "Confirmation Accepted", required: false, type: "string", aliases: ["accepted", "confirmation accepted", "accepte", "date accepted"] },
  { key: "confirmedQuantity", label: "Confirmed Quantity", required: false, type: "number", aliases: ["confirmed quantity", "quantite confirmee"] },
  { key: "orderDate", label: "Order Date", required: false, type: "date", aliases: ["order date", "date commande", "date de commande"] },
  { key: "plannedReceiptDate", label: "Planned Receipt Date", required: true, type: "date", aliases: ["current planned receipt date", "planned receipt date", "date reception planifiee", "planned date"] },
  { key: "quantityOrdered", label: "Quantity Ordered", required: true, type: "number", aliases: ["quantity ordered", "order quantity", "quantite commandee", "qty ordered"] },
  { key: "quantityDelivered", label: "Quantity Delivered", required: false, type: "number", aliases: ["quantity delivered", "delivered quantity", "quantite livree", "qty delivered"] },
];

const SC_FIELDS: FieldSpec[] = [
  { key: "scheduleNumber", label: "Schedule Number", required: true, type: "string", aliases: ["schedule number", "numero de planning", "schedule line", "sc number"] },
  { key: "supplierNumber", label: "Supplier Number", required: false, type: "string", aliases: ["supplier number", "supplier code", "numero fournisseur", "code fournisseur"] },
  { key: "supplierName", label: "Supplier Name", required: true, type: "string", aliases: ["supplier name", "supplier", "fournisseur", "business partner"] },
  { key: "itemNumber", label: "Item Number", required: true, type: "string", aliases: ["item number", "item", "article number", "numero article"] },
  { key: "itemDescription", label: "Item Description", required: false, type: "string", aliases: ["item description", "description", "designation"] },
  { key: "plannedReceiptDate", label: "Planned Receipt Date", required: true, type: "date", aliases: ["planned receipt date", "date reception planifiee", "planned date", "reception planifiee"] },
  { key: "status", label: "Status", required: false, type: "string", aliases: ["status", "statut", "etat"] },
  { key: "scheduleQuantity", label: "Schedule Quantity", required: true, type: "number", aliases: ["schedule quantity", "quantite planifiee", "qte planifiee", "planned quantity"] },
  { key: "quantityDelivered", label: "Quantity Delivered", required: false, type: "number", aliases: ["quantity delivered", "delivered quantity", "quantite livree", "qty delivered"] },
];

const BACKLOG_FIELDS: FieldSpec[] = [
  { key: "purchaseOrder", label: "Purchase Order", required: true, type: "string", aliases: ["purchase order", "po number", "numero de commande", "commande achat"] },
  { key: "supplierBP", label: "Business Partner (Number - Name)", required: false, type: "string", aliases: ["business partner", "bp", "supplier", "fournisseur"] },
  { key: "itemNumber", label: "Item Number", required: true, type: "string", aliases: ["item number", "item", "article number", "numero article"] },
  { key: "itemDescription", label: "Item Description", required: false, type: "string", aliases: ["item description", "description", "designation"] },
  { key: "backlogLine", label: "Backlog Line", required: false, type: "number", aliases: ["backlog line", "ligne", "lignes", "line number"] },
  { key: "plannedReceiptDate", label: "Planned Receipt Date", required: false, type: "date", aliases: ["planned receipt date", "date reception planifiee", "planned date"] },
];

export const FIELD_SPECS: Record<Exclude<FileKind, "contacts">, FieldSpec[]> = {
  mc16: MC16_FIELDS,
  pms: PMS_FIELDS,
  mrp: MRP_FIELDS,
  sc: SC_FIELDS,
  backlog: BACKLOG_FIELDS,
};

export const FILE_KIND_LABELS: Record<Exclude<FileKind, "contacts">, string> = {
  mc16: "MC16 Alerts",
  pms: "PSM Dashboard",
  mrp: "MRP Orders",
  sc: "SC Orders",
  backlog: "Backlog",
};
