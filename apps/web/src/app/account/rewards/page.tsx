import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { apiDashboardSummary, apiProgressCompletions } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

type RewardMilestone = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
};

export default async function AccountRewardsPage() {
  const session = await requireSession();
  const [summary, completions] = await Promise.all([
    apiDashboardSummary(session.accessToken),
    apiProgressCompletions(session.accessToken, 500),
  ]);

  const streakDays = summary.progress.streakDays;
  const reflections = summary.entriesCount;
  const lessonsCompleted = summary.progress.lessonsCompleted;
  const practiceCompletionsCount = completions.filter((item) => item.contentKind === "practice").length;
  const distinctCompletions = new Set(
    completions.map((item) => `${item.contentKind}:${item.contentSlug}`),
  ).size;

  const milestones: RewardMilestone[] = [
    {
      id: "first-reflection",
      title: "First Reflection",
      description: "Log your first journal entry.",
      earned: reflections >= 1,
    },
    {
      id: "streak-3",
      title: "3-Day Streak",
      description: "Keep your reflection streak for at least 3 days.",
      earned: streakDays >= 3,
    },
    {
      id: "streak-7",
      title: "7-Day Streak",
      description: "Hold momentum for a full week.",
      earned: streakDays >= 7,
    },
    {
      id: "lesson-1",
      title: "Lesson Starter",
      description: "Complete your first library lesson.",
      earned: lessonsCompleted >= 1,
    },
    {
      id: "lesson-3",
      title: "Scholar",
      description: "Complete 3 library lessons.",
      earned: lessonsCompleted >= 3,
    },
    {
      id: "practice-3",
      title: "Practitioner",
      description: "Complete 3 practices.",
      earned: practiceCompletionsCount >= 3,
    },
    {
      id: "consistency-5",
      title: "Consistency Builder",
      description: "Complete 5 distinct lessons/practices.",
      earned: distinctCompletions >= 5,
    },
  ];

  const earnedCount = milestones.filter((item) => item.earned).length;
  const nextMilestone = milestones.find((item) => !item.earned) ?? null;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Achievements"
        title="Rewards"
        description="Light milestones to make your progress visible without turning practice into a game."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">{earnedCount} badges earned</Badge>
        <Badge variant="muted">{milestones.length - earnedCount} remaining</Badge>
      </div>

      <SurfaceCard
        title="Next milestone"
        subtitle={nextMilestone ? nextMilestone.title : "All current milestones unlocked"}
      >
        <p className="text-sm text-night-200">
          {nextMilestone
            ? nextMilestone.description
            : "You completed every current milestone. Keep practicing and we will expand this track."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard"
            className="inline-flex rounded-xl border border-night-700 bg-night-900/70 px-3 py-2 text-xs text-sand-100 hover:border-night-600"
          >
            Open dashboard
          </Link>
          <Link
            href="/practices"
            className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/15 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
          >
            Continue practices
          </Link>
        </div>
      </SurfaceCard>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {milestones.map((milestone) => (
          <SurfaceCard
            key={milestone.id}
            title={milestone.title}
            subtitle={milestone.earned ? "Unlocked" : "Locked"}
          >
            <p className="text-sm text-night-200">{milestone.description}</p>
            <div className="mt-3">
              {milestone.earned ? <Badge variant="success">Earned</Badge> : <Badge variant="muted">In progress</Badge>}
            </div>
          </SurfaceCard>
        ))}
      </section>
    </div>
  );
}
