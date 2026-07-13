"use client";

import { AppDataProvider } from "./AppDataContext";
import { ContactsProvider } from "./ContactsContext";
import { ShipmentsProvider } from "./ShipmentsContext";
import { TodosProvider } from "./TodosContext";
import { ProfileProvider } from "./ProfileContext";
import { ThemeProvider } from "./ThemeContext";
import { ToastProvider } from "./ToastContext";
import { SolvedProvider } from "./SolvedContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppDataProvider>
          <ContactsProvider>
            <ShipmentsProvider>
              <TodosProvider>
                <ProfileProvider>
                  <SolvedProvider>{children}</SolvedProvider>
                </ProfileProvider>
              </TodosProvider>
            </ShipmentsProvider>
          </ContactsProvider>
        </AppDataProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
