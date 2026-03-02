"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CurrentUser } from "@/lib/auth/session";
import { dashboardNavItems } from "@/lib/navigation";

type DashboardSidenavProps = {
  user: CurrentUser;
};

export function DashboardSidenav({ user }: DashboardSidenavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-80 shrink-0 border-r border-night-800/70 bg-night-950/90 p-6 lg:flex lg:flex-col lg:gap-8">
      <div>
        <Link href="/dashboard" className="inline-block">
          <p className="text-xs uppercase tracking-[0.35em] text-sage-200/90">Ataraxia</p>
          <h1 className="mt-2 font-title text-3xl leading-tight text-sand-100">
            School of Calm Power
          </h1>
        </Link>
      </div>

      <nav className="flex-1 space-y-2">
        {dashboardNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-start gap-3 rounded-2xl border px-3 py-3 transition ${
                isActive
                  ? "border-sage-300/80 bg-sage-500/10"
                  : "border-transparent hover:border-night-700 hover:bg-night-900/60"
              }`}
            >
              <span
                className={`mt-0.5 rounded-lg p-1.5 ${
                  isActive ? "bg-sage-400/25 text-sage-100" : "bg-night-900 text-night-200"
                }`}
              >
                <Icon size={16} />
              </span>
              <span>
                <span className="block text-sm font-medium text-sand-100">{item.label}</span>
                <span className="block text-xs text-night-300">{item.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-night-700/70 bg-night-900/70 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-night-300">Member</p>
        <p className="mt-1 text-sm font-semibold text-sand-100">{user.name}</p>
        <p className="text-xs text-night-300">{user.email}</p>
      </div>
    </aside>
  );
}
