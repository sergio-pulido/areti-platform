import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { apiRewardsProgress } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

export default async function AccountRewardsPage() {
  const session = await requireSession();
  const rewards = await apiRewardsProgress(session.accessToken);
  const nextMilestone = rewards.nextMilestone;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Achievements"
        title="Rewards"
        description="Light milestones to make your progress visible without turning practice into a game."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="default">{rewards.earnedCount} badges earned</Badge>
        <Badge variant="muted">{rewards.totalCount - rewards.earnedCount} remaining</Badge>
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
        {rewards.milestones.map((milestone) => (
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
