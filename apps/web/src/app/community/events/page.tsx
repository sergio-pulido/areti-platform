import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchCommunityEvents } from "@/lib/content-api";

export default async function CommunityEventsPage() {
  const events = await fetchCommunityEvents();

  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Events"
        description="Attend recurring sessions to stay consistent, reflective, and accountable."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <SurfaceCard key={event.slug} title={event.title} subtitle={event.schedule}>
            <p className="text-sm text-night-200">{event.summary}</p>
            <Link
              href={`/dashboard/journal?title=${encodeURIComponent(`Event Plan: ${event.title}`)}&mood=Focused`}
              className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Save plan
            </Link>
          </SurfaceCard>
        ))}
        {events.length === 0 ? (
          <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
            No events published yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
