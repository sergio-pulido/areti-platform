import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchCommunityChallenges } from "@/lib/content-api";

export default async function CommunityChallengesPage() {
  const challenges = await fetchCommunityChallenges();

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
              href={`/dashboard/chat?prompt=${encodeURIComponent(`I want to join the ${challenge.title} challenge. Help me create a realistic plan and accountability message.`)}`}
              className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Join challenge
            </Link>
          </SurfaceCard>
        ))}
        {challenges.length === 0 ? (
          <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
            No active challenges yet. Create one in Creator CMS.
          </p>
        ) : null}
      </div>
    </div>
  );
}
