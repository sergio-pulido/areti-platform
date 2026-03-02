import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchPracticeRoutines } from "@/lib/content-api";

export default async function PracticesPage() {
  const routines = await fetchPracticeRoutines();

  return (
    <div>
      <PageHeader
        eyebrow="Practices"
        title="Your Daily Protocols"
        description="Rituals designed for mental resilience, calm pleasure, and strategic action."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {routines.map((routine) => (
          <SurfaceCard key={routine.slug} title={routine.title} subtitle={routine.cadence}>
            <p className="text-sm text-night-200">{routine.description}</p>
            <Link
              href={`/dashboard/journal?title=${encodeURIComponent(`Practice: ${routine.title}`)}&mood=Focused`}
              className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Start practice
            </Link>
          </SurfaceCard>
        ))}
        {routines.length === 0 ? (
          <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
            No practices found in API content.
          </p>
        ) : null}
      </div>
    </div>
  );
}
