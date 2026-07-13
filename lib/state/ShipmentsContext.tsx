"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Shipment, ShipmentStore } from "@/types";
import { loadShipments, saveShipments } from "@/lib/storage/shipments";

interface ShipmentsContextValue {
  shipments: ShipmentStore;
  setShipment: (key: string, shipment: Shipment) => void;
  removeShipment: (key: string) => void;
}

const ShipmentsContext = createContext<ShipmentsContextValue | null>(null);

export function ShipmentsProvider({ children }: { children: React.ReactNode }) {
  const [shipments, setShipments] = useState<ShipmentStore>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setShipments(loadShipments());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveShipments(shipments);
  }, [shipments, hydrated]);

  const setShipment = (key: string, shipment: Shipment) => {
    setShipments((prev) => ({ ...prev, [key]: shipment }));
  };

  const removeShipment = (key: string) => {
    setShipments((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <ShipmentsContext.Provider value={{ shipments, setShipment, removeShipment }}>
      {children}
    </ShipmentsContext.Provider>
  );
}

export function useShipmentsContext(): ShipmentsContextValue {
  const ctx = useContext(ShipmentsContext);
  if (!ctx) throw new Error("useShipmentsContext must be used within ShipmentsProvider");
  return ctx;
}
