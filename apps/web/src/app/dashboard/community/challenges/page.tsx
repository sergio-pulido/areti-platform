import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

const challenges = [
  {
    slug: "morning-clarity",
    title: "Morning Clarity Sprint",
    duration: "7 days",
    summary: "Start each day with one intentional practice and one clear priority.",
  },
  {
    slug: "friction-to-focus",
    title: "Friction to Focus",
    duration: "14 days",
    summary: "Identify recurring distractions and convert them into focused rituals.",
  },
  {
    slug: "calm-under-pressure",
    title: "Calm Under Pressure",
    duration: "10 days",
    summary: "Train emotional steadiness in meetings, deadlines, and conflict moments.",
  },
];

export default function CommunityChallengesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Challenges"
        description="Join structured community challenges to build consistency and accountability."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {challenges.map((challenge) => (
          <SurfaceCard key={challenge.slug} title={challenge.title} subtitle={challenge.duration}>
            <p className="text-sm text-night-200">{challenge.summary}</p>
            <Link
              href={`/community?challenge=${challenge.slug}`}
              className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Join challenge
            </Link>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
