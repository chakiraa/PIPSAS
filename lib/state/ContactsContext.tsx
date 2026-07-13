"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Contact } from "@/types";
import { loadContacts, saveContacts } from "@/lib/storage/contacts";

interface ContactsContextValue {
  contacts: Contact[];
  setContacts: (next: Contact[] | ((prev: Contact[]) => Contact[])) => void;
}

const ContactsContext = createContext<ContactsContextValue | null>(null);

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContactsState] = useState<Contact[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setContactsState(loadContacts());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveContacts(contacts);
  }, [contacts, hydrated]);

  return (
    <ContactsContext.Provider value={{ contacts, setContacts: setContactsState }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts(): ContactsContextValue {
  const ctx = useContext(ContactsContext);
  if (!ctx) throw new Error("useContacts must be used within ContactsProvider");
  return ctx;
}
