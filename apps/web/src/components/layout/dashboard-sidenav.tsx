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

  const accountGroups =
    activeSection.id === "account"
      ? activeSection.items.reduce<Array<{ name: string; items: typeof activeSection.items }>>((groups, item) => {
          const groupName = item.group ?? "Account";
          const existing = groups.find((group) => group.name === groupName);

          if (existing) {
            existing.items.push(item);
            return groups;
          }

          groups.push({ name: groupName, items: [item] });
          return groups;
        }, [])
      : [];

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

      <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
        <section className="space-y-2">
          <div className="px-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-night-300">{activeSection.label}</p>
            <p className="mt-1 text-xs text-night-400">{activeSection.description}</p>
          </div>

          {activeSection.id === "account" ? (
            <div className="space-y-4">
              {accountGroups.map((group) => (
                <div key={group.name} className="space-y-2">
                  <p className="px-2 text-[10px] uppercase tracking-[0.22em] text-night-400">{group.name}</p>
                  <div className="space-y-2">
                    {group.items.map((item) => {
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
                              <span className="block text-sm font-medium text-night-100">
                                {item.label}
                                <span className="ml-2 text-[10px] uppercase tracking-[0.15em] text-night-300">
                                  Coming soon
                                </span>
                              </span>
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
                </div>
              ))}
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
