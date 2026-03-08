import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardContinueItem } from "@/components/dashboard/home/types";

type DashboardContinueSectionProps = {
  items: DashboardContinueItem[];
};

export function DashboardContinueSection({ items }: DashboardContinueSectionProps) {
  return (
    <section aria-label="Continue your path" className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-sand-100">Continue your path</h2>
        <p className="mt-1 text-sm text-night-200">Pick up where you left off.</p>
      </div>
      <Card variant="default" className="rounded-[var(--radius-2xl)] border-night-700/80 p-2 md:p-3">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-4 rounded-xl border border-transparent px-3 py-3 hover:border-night-700 hover:bg-night-950/70"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-sand-100">{item.title}</span>
                  <span className="mt-1 block truncate text-xs text-night-200">{item.context}</span>
                  <span className="mt-1 block text-[11px] uppercase tracking-[0.16em] text-night-300">
                    {item.meta}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-sage-100">
                  {item.ctaLabel}
                  <ArrowRight size={12} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
