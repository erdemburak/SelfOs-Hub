import type { CSSProperties, ReactNode } from "react";

import { WORKSPACE_SIDEBAR_WIDTH } from "@/components/layout/layout-config";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const shellStyle = {
    "--workspace-sidebar-width": WORKSPACE_SIDEBAR_WIDTH,
  } as CSSProperties;

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 md:grid md:grid-cols-[var(--workspace-sidebar-width)_minmax(0,1fr)]"
      style={shellStyle}
    >
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
