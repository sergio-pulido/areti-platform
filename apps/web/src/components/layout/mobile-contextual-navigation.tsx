"use client";

import { usePathname } from "next/navigation";
import { SectionNavItems } from "@/components/layout/section-nav-items";
import { getActiveNavSectionForRole, type UserRole } from "@/lib/navigation";

type MobileContextualNavigationProps = {
  role: UserRole;
  onNavigate?: () => void;
};

export function MobileContextualNavigation({ role, onNavigate }: MobileContextualNavigationProps) {
  const pathname = usePathname();
  const activeSection = getActiveNavSectionForRole(pathname, role);

  return (
    <nav aria-label="Mobile contextual navigation" className="space-y-4">
      <section className="space-y-2">
        <p className="px-1 text-[11px] uppercase tracking-[0.24em] text-night-300">{activeSection.label}</p>
        <p className="px-1 text-sm text-night-200">{activeSection.description}</p>
      </section>

      <section aria-label={`${activeSection.label} navigation`}>
        <SectionNavItems
          items={activeSection.desktopItems}
          pathname={pathname}
          variant={activeSection.id === "account" ? "account" : "default"}
          onNavigate={onNavigate}
        />
      </section>
    </nav>
  );
}
