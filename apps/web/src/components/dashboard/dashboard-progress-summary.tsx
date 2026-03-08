import { Card } from "@/components/ui/card";
import type { DashboardProgressSummary as DashboardProgressSummaryType } from "@/components/dashboard/home/types";

type DashboardProgressSummaryProps = {
  summary: DashboardProgressSummaryType;
};

export function DashboardProgressSummary({ summary }: DashboardProgressSummaryProps) {
  const items = [
    {
      label: "Current streak",
      value: `${summary.streakDays} day${summary.streakDays === 1 ? "" : "s"}`,
    },
    {
      label: "Reflections this week",
      value: `${summary.reflectionsThisWeek}`,
    },
    {
      label: "Practices this week",
      value: `${summary.practicesThisWeek}`,
    },
    {
      label: "Lesson progress",
      value: `${summary.lessonProgressPercent}%`,
    },
  ];

  return (
    <section aria-label="Progress summary" className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-sand-100">Progress at a glance</h2>
        <p className="mt-1 text-sm text-night-200">Light signals to keep momentum visible.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Card
            key={item.label}
            variant="muted"
            className="rounded-[var(--radius-xl)] border-night-700/85 p-4"
          >
            <p className="text-[11px] uppercase tracking-[0.16em] text-night-300">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-sand-100">{item.value}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
