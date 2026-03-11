"use client";

import Link from "next/link";
import { isNavItemActive, type NavItem } from "@/lib/navigation";

type SectionNavItemsProps = {
  items: NavItem[];
  pathname: string;
  variant?: "default" | "account";
  onNavigate?: () => void;
};

export function SectionNavItems({
  items,
  pathname,
  variant = "default",
  onNavigate,
}: SectionNavItemsProps) {
  if (variant === "account") {
    return (
      <div className="space-y-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isNavItemActive(pathname, item);
          const isEnabled = item.enabled !== false;

          if (!isEnabled) {
            return (
              <div
                key={item.id}
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
              key={item.id}
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`group flex items-center gap-3 rounded-xl border px-3 py-2 transition ${
                isActive
                  ? "border-sage-300/90 bg-sage-500/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "border-transparent hover:border-night-600 hover:bg-night-900/60"
              }`}
            >
              <span
                className={`rounded-lg p-1.5 ${
                  isActive ? "bg-sage-400/30 text-sage-100" : "bg-night-900 text-night-100"
                }`}
              >
                <Icon size={16} />
              </span>
              <span className="text-sm font-medium text-sand-100">{item.label}</span>
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = isNavItemActive(pathname, item);
        const isEnabled = item.enabled !== false;

        if (!isEnabled) {
          return (
            <div
              key={item.id}
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
            key={item.id}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={`group flex items-start gap-3 rounded-2xl border px-3 py-3 transition ${
              isActive
                ? "border-sage-300/90 bg-sage-500/14 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                : "border-transparent hover:border-night-600 hover:bg-night-900/60"
            }`}
          >
            <span
              className={`mt-0.5 rounded-lg p-1.5 ${
                isActive ? "bg-sage-400/30 text-sage-100" : "bg-night-900 text-night-100"
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
  );
}
