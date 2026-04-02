"use client";

import { usePathname } from "next/navigation";

import { PAGE_TITLES } from "@/lib/navigation";

export function TopHeader() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 px-4 py-4 backdrop-blur md:px-8">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">MVP Workspace</p>
      <h2 className="mt-1 text-xl font-semibold text-slate-100">{title}</h2>
    </header>
  );
}
