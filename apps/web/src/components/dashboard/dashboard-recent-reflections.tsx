import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DashboardReflectionItem } from "@/components/dashboard/home/types";

type DashboardRecentReflectionsProps = {
  items: DashboardReflectionItem[];
};

const stateClassMap: Record<string, string> = {
  Grounded: "border-sage-300/40 bg-sage-500/10 text-sage-100",
  Clear: "border-night-600 bg-night-950/70 text-night-100",
  Restless: "border-amber-300/30 bg-amber-500/10 text-amber-100",
  Overwhelmed: "border-rose-300/30 bg-rose-500/10 text-rose-100",
};

export function DashboardRecentReflections({ items }: DashboardRecentReflectionsProps) {
  return (
    <section aria-label="Recent reflections">
      <Card variant="default" className="rounded-[var(--radius-2xl)] border-night-700/80">
        <h2 className="text-lg font-semibold text-sand-100">Recent reflections</h2>
        <p className="mt-1 text-sm text-night-200">Revisit what has been shaping your attention.</p>

        {items.length === 0 ? (
          <p className="mt-4 rounded-xl border border-night-700/80 bg-night-950/70 p-4 text-sm text-night-200">
            No reflections yet. Start with one short entry to build continuity.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <article className="rounded-xl border border-night-700/80 bg-night-950/72 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="muted">{item.theme}</Badge>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${stateClassMap[item.state] ?? "border-night-700/80 bg-night-950/80 text-night-200"}`}
                    >
                      {item.state}
                    </span>
                    <span className="ml-auto text-[11px] uppercase tracking-[0.14em] text-night-300">
                      {item.dateLabel}
                    </span>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-sand-100">{item.title}</h3>
                  <p className="mt-1 text-sm text-night-200">{item.summary}</p>
                  <Link
                    href={item.href}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-sage-100 hover:text-sage-200"
                  >
                    {item.ctaLabel}
                    <ArrowUpRight size={12} />
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
