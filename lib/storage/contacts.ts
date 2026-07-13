import type { Contact } from "@/types";
import { CONTACTS_KEY, safeLoad, safeSave } from "./keys";

export function loadContacts(): Contact[] {
  return safeLoad<Contact[]>(CONTACTS_KEY, []);
}

export function saveContacts(contacts: Contact[]): void {
  safeSave(CONTACTS_KEY, contacts);
}
