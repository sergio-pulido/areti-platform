import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchCommunityExperts } from "@/lib/content-api";

export default async function CommunityExpertsPage() {
  const experts = await fetchCommunityExperts();

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Experts"
        description="Connect with mentors and specialists for guided philosophical practice."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {experts.map((expert) => (
          <SurfaceCard key={expert.slug} title={expert.name}>
            <p className="text-sm text-night-200">{expert.focus}</p>
            <Link
              href={`/dashboard/chat?prompt=${encodeURIComponent(`Help me write a concise request for guidance to ${expert.name} about: ${expert.focus}`)}`}
              className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Request guidance
            </Link>
          </SurfaceCard>
        ))}
        {experts.length === 0 ? (
          <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
            No experts available right now.
          </p>
        ) : null}
      </div>
    </div>
  );
}
