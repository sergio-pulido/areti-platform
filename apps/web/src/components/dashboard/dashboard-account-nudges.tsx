import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardAccountNudge } from "@/components/dashboard/home/types";

type DashboardAccountNudgesProps = {
  nudges: DashboardAccountNudge[];
};

export function DashboardAccountNudges({ nudges }: DashboardAccountNudgesProps) {
  if (nudges.length === 0) {
    return null;
  }

  return (
    <section aria-label="Account nudges" className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-sand-100">Account actions</h2>
        <p className="mt-1 text-sm text-night-200">Only shown when something needs attention.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {nudges.map((nudge) => (
          <Card
            key={nudge.id}
            variant="muted"
            className="rounded-[var(--radius-xl)] border-night-700/85 bg-night-950/72 p-4"
          >
            <div className="flex items-start gap-2">
              <ShieldCheck size={14} className="mt-0.5 text-sage-200" />
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-sand-100">{nudge.title}</h3>
                <p className="mt-1 text-sm text-night-200">{nudge.description}</p>
              </div>
            </div>
            <Link
              href={nudge.href}
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-sage-100 hover:text-sage-200"
            >
              {nudge.ctaLabel}
              <ArrowRight size={12} />
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
