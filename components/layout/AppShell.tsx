"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Toasts } from "./Toasts";
import { AIAssistant } from "@/components/ai/AIAssistant";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[216px]">
        <Topbar onHamburger={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 max-w-[1680px] w-full">{children}</main>
      </div>
      <Toasts />
      <AIAssistant />
    </div>
  );
}
