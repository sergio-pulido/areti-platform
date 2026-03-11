"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CurrentUser } from "@/lib/auth/session";
import { CompanionSidenav } from "@/components/layout/companion-sidenav";
import { SectionNavItems } from "@/components/layout/section-nav-items";
import {
  getActiveNavSectionForRole,
} from "@/lib/navigation";

type DashboardSidenavProps = {
  user: CurrentUser;
};

export function DashboardSidenav({ user }: DashboardSidenavProps) {
  const pathname = usePathname();
  const activeSection = getActiveNavSectionForRole(pathname, user.role);

  if (activeSection.id === "companion") {
    return <CompanionSidenav />;
  }

  return (
    <aside className="hidden w-80 shrink-0 border-r border-night-700/70 bg-night-950/90 p-6 lg:flex lg:flex-col lg:gap-9">
      {activeSection.id === "account" ? null : (
        <div>
          <Link href="/dashboard" className="inline-block">
            <p className="text-xs uppercase tracking-[0.35em] text-sage-200/90">Areti</p>
            <h1 className="mt-2 font-title text-3xl leading-tight text-sand-100">
              School of Calm Power
            </h1>
          </Link>
        </div>
      )}

      <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
        <section className="space-y-3">
          <div className="px-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-night-200">{activeSection.label}</p>
            {activeSection.id === "account" ? null : (
              <p className="mt-1 text-xs text-night-300">{activeSection.description}</p>
            )}
          </div>

          <SectionNavItems
            items={activeSection.desktopItems}
            pathname={pathname}
            variant={activeSection.id === "account" ? "account" : "default"}
          />
        </section>
      </nav>
    </aside>
  );
}
