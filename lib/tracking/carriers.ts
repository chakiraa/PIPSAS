// Carrier portal directory, ported 1:1 from the legacy PIP app's
// `CARRIERS` array (legacy/PIP_V8_AI_Assistant.html ~L4614-4660).

export interface Carrier {
  id: string;
  name: string;
  description: string;
  url: string;
  flag: string;
  color: string;
  hint: string;
}

export const CARRIERS: Carrier[] = [
  {
    id: "fried-sped",
    name: "Fried-Sped",
    description: "FS-AST — Auftragsliste",
    url: "https://status.fried-sped.de/Sites/OrderList.aspx",
    flag: "🇩🇪",
    color: "#3b82f6",
    hint: "Open the Fried-Sped order list portal (FS-AST) to check shipment statuses.",
  },
  {
    id: "leman",
    name: "LEMAN",
    description: "yourLEMAN — Overview",
    url: "https://yourleman.com/Overview",
    flag: "🌐",
    color: "#10b981",
    hint: "Access the yourLEMAN portal for Nauta / LEMAN shipment tracking.",
  },
  {
    id: "tnt",
    name: "TNT",
    description: "Sendung verfolgen — TNT Germany",
    url: "https://www.tnt.com/express/de_de/site/shipping-tools/tracking.html",
    flag: "🟠",
    color: "#f97316",
    hint: "Track TNT express shipments via the TNT Germany shipping tools page.",
  },
  {
    id: "ups",
    name: "UPS",
    description: "Tracking — UPS Switzerland",
    url: "https://www.ups.com/track?loc=en_CH&requester=ST/",
    flag: "🟤",
    color: "#a16207",
    hint: "Track UPS parcels via the UPS Switzerland tracking portal.",
  },
  {
    id: "man",
    name: "MAN",
    description: "MAN Service Portal",
    url: "https://public.man.eu/portal/asp/en/",
    flag: "🔵",
    color: "#6366f1",
    hint: "Access the MAN Service Portal for MAN-related shipment and service tracking.",
  },
];
