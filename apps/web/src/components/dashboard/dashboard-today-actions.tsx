import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  Bot,
  Compass,
  NotebookPen,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DashboardActionKind, DashboardTodayAction } from "@/components/dashboard/home/types";

type DashboardTodayActionsProps = {
  actions: DashboardTodayAction[];
};

const kindIconMap: Record<DashboardActionKind, LucideIcon> = {
  practice: Compass,
  lesson: BookOpenText,
  reflection: NotebookPen,
  companion: Bot,
  reentry: RotateCcw,
};

export function DashboardTodayActions({ actions }: DashboardTodayActionsProps) {
  return (
    <section aria-label="Today for you" className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-sand-100">Today for you</h2>
        <p className="mt-1 text-sm text-night-200">Useful shortcuts for this session.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => {
          const Icon = kindIconMap[action.kind];

          return (
            <Card
              key={action.id}
              variant="default"
              className="rounded-[var(--radius-xl)] border-night-700/80 bg-night-900/72 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-lg border border-night-700/80 bg-night-950/80 p-2 text-night-100">
                  <Icon size={15} />
                </span>
                {action.meta ? (
                  <span className="text-[11px] uppercase tracking-[0.18em] text-night-300">
                    {action.meta}
                  </span>
                ) : null}
              </div>

              <h3 className="mt-4 text-base font-semibold text-sand-100">{action.title}</h3>
              <p className="mt-1 text-sm text-night-200">{action.description}</p>

              <Link
                href={action.cta.href}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-night-600 bg-night-950/65 px-3 py-1.5 text-xs font-medium text-sand-100 hover:border-sage-300/60"
              >
                {action.cta.label}
                <ArrowUpRight size={13} />
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
