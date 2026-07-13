"use client";

import { useContacts } from "@/lib/state/ContactsContext";
import { ContactsTable } from "@/components/contacts/ContactsTable";

export default function ContactsPage() {
  const { contacts, setContacts } = useContacts();

  return (
    <div className="flex flex-col gap-6 fade-in">
      <div>
        <h1 className="text-xl font-display font-extrabold" style={{ color: "var(--text)" }}>
          Supplier Directory
        </h1>
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          Contacts used to auto-fill emails, names and languages across the app
        </p>
      </div>
      <ContactsTable contacts={contacts} setContacts={setContacts} />
    </div>
  );
}
