import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchCommunityCircles } from "@/lib/content-api";

export default async function CommunityPage() {
  const circles = await fetchCommunityCircles();

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Guided Circles"
        description="Join practical discussions, accountability groups, and shared philosophical experiments."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {circles.map((circle) => (
          <SurfaceCard key={circle.slug} title={circle.name} subtitle={circle.schedule}>
            <p className="text-sm text-night-200">{circle.focus}</p>
            <button
              type="button"
              className="mt-4 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Request invite
            </button>
          </SurfaceCard>
        ))}
        {circles.length === 0 ? (
          <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
            No community circles found in API content.
          </p>
        ) : null}
      </div>
    </div>
  );
}
