import type { ShipmentStore } from "@/types";
import { SHIPMENT_KEY, safeLoad, safeSave } from "./keys";

export function loadShipments(): ShipmentStore {
  return safeLoad<ShipmentStore>(SHIPMENT_KEY, {});
}

export function saveShipments(store: ShipmentStore): void {
  safeSave(SHIPMENT_KEY, store);
}
