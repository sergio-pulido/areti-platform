import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { DashboardActionKind, DashboardRecommendedAction } from "@/components/dashboard/home/types";

type DashboardHeroNextStepProps = {
  userFirstName: string;
  action: DashboardRecommendedAction;
};

const kindLabelMap: Record<DashboardActionKind, string> = {
  practice: "Practice",
  lesson: "Lesson",
  reflection: "Reflection",
  companion: "Companion",
  reentry: "Re-entry",
};

export function DashboardHeroNextStep({ userFirstName, action }: DashboardHeroNextStepProps) {
  return (
    <Card
      variant="elevated"
      className="rounded-[var(--radius-2xl)] border-sage-300/25 bg-gradient-to-br from-sage-500/18 via-night-900/90 to-night-900/96 p-6 md:p-7"
    >
      <p className="text-xs uppercase tracking-[0.24em] text-sage-100/90">
        Your next step, {userFirstName}
      </p>
      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-night-200">{action.heading}</p>
      <h2 className="mt-2 text-2xl font-semibold leading-tight text-sand-100 md:text-[1.85rem]">
        {action.title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-night-100">{action.reason}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="success">{kindLabelMap[action.kind]}</Badge>
        <span className="inline-flex items-center gap-1 rounded-full border border-night-700/80 bg-night-950/65 px-2.5 py-1 text-[11px] text-night-200">
          <Clock3 size={12} />
          {action.duration}
        </span>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link
          href={action.primaryCta.href}
          className="inline-flex items-center gap-2 rounded-xl border border-sand-100 bg-sand-100 px-4 py-2.5 text-sm font-semibold text-night-950 hover:bg-sand-50"
        >
          {action.primaryCta.label}
          <ArrowRight size={14} />
        </Link>
        {action.secondaryCta ? (
          <Link
            href={action.secondaryCta.href}
            className="inline-flex items-center rounded-xl border border-night-600 bg-night-900/65 px-4 py-2.5 text-sm text-sand-100 hover:border-night-500"
          >
            {action.secondaryCta.label}
          </Link>
        ) : null}
      </div>
    </Card>
  );
}
