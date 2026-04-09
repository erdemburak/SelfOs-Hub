"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-slate-800/80 bg-slate-950 md:w-[var(--workspace-sidebar-width)] md:shrink-0 md:border-r">
      <div className="flex h-full flex-col gap-6 p-4 md:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">SelfOS Hub</p>
          <h1 className="mt-2 text-lg font-semibold text-slate-100">Personal Productivity</h1>
        </div>

        <nav className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "min-w-fit rounded-xl border px-3 py-2 transition-colors md:min-w-0",
                  isActive
                    ? "border-teal-500/40 bg-teal-500/10 text-teal-200"
                    : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:text-slate-100",
                ].join(" ")}
              >
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-slate-500">{item.description}</p>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
