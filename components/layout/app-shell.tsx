import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 md:flex">
      <Sidebar />

      <div className="flex flex-1 flex-col">
        <TopHeader />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
