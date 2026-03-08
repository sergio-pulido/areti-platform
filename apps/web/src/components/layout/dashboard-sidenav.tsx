"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CurrentUser } from "@/lib/auth/session";
import { CompanionSidenav } from "@/components/layout/companion-sidenav";
import {
  canAccessCreator,
  getNavSectionById,
  getNavSectionForPathname,
  isNavItemActive,
} from "@/lib/navigation";

type DashboardSidenavProps = {
  user: CurrentUser;
};

export function DashboardSidenav({ user }: DashboardSidenavProps) {
  const pathname = usePathname();
  const detectedSection = getNavSectionForPathname(pathname);
  const activeSection =
    !canAccessCreator(user.role) && detectedSection.id === "creator"
      ? getNavSectionById("personal")
      : detectedSection;

  if (activeSection.id === "companion") {
    return <CompanionSidenav />;
  }

  return (
    <aside className="hidden w-80 shrink-0 border-r border-night-800/70 bg-night-950/90 p-6 lg:flex lg:flex-col lg:gap-8">
      <div>
        <Link href="/dashboard" className="inline-block">
          <p className="text-xs uppercase tracking-[0.35em] text-sage-200/90">Areti</p>
          <h1 className="mt-2 font-title text-3xl leading-tight text-sand-100">
            School of Calm Power
          </h1>
        </Link>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
        <section className="space-y-2">
          <div className="px-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-night-300">{activeSection.label}</p>
            {activeSection.id === "account" ? null : (
              <p className="mt-1 text-xs text-night-400">{activeSection.description}</p>
            )}
          </div>

          {activeSection.id === "account" ? (
            <div className="space-y-1.5">
              {activeSection.items.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(pathname, item);
                const isEnabled = item.enabled !== false;

                if (!isEnabled) {
                  return (
                    <div
                      key={item.href}
                      aria-disabled="true"
                      title="Coming soon"
                      className="group flex cursor-not-allowed items-center gap-3 rounded-xl border border-night-800/70 bg-night-950/60 px-3 py-2 opacity-70"
                    >
                      <span className="rounded-lg bg-night-900 p-1.5 text-night-300">
                        <Icon size={16} />
                      </span>
                      <span className="text-sm font-medium text-night-100">{item.label}</span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 rounded-xl border px-3 py-2 transition ${
                      isActive
                        ? "border-sage-300/80 bg-sage-500/10"
                        : "border-transparent hover:border-night-700 hover:bg-night-900/60"
                    }`}
                  >
                    <span
                      className={`rounded-lg p-1.5 ${
                        isActive ? "bg-sage-400/25 text-sage-100" : "bg-night-900 text-night-200"
                      }`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="text-sm font-medium text-sand-100">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2">
              {activeSection.items.map((item) => {
                const Icon = item.icon;
                const isActive = isNavItemActive(pathname, item);
                const isEnabled = item.enabled !== false;

                if (!isEnabled) {
                  return (
                    <div
                      key={item.href}
                      aria-disabled="true"
                      title="Coming soon"
                      className="group flex cursor-not-allowed items-start gap-3 rounded-2xl border border-night-800/70 bg-night-950/60 px-3 py-3 opacity-70"
                    >
                      <span className="mt-0.5 rounded-lg bg-night-900 p-1.5 text-night-300">
                        <Icon size={16} />
                      </span>
                      <span>
                        <span className="block text-sm font-medium text-night-100">{item.label}</span>
                        <span className="block text-xs text-night-400">{item.description}</span>
                      </span>
                    </div>
                  );
                }

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
            </div>
          )}
        </section>
      </nav>
    </aside>
  );
}
