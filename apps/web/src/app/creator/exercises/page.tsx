import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchPracticeRoutines } from "@/lib/content-api";

export default async function CreatorExercisesPage() {
  const routines = await fetchPracticeRoutines();

  return (
    <div>
      <PageHeader
        eyebrow="Creator"
        title="Exercises Studio"
        description="Design practical exercises that community members can run daily or weekly."
      />

      <SurfaceCard title="Exercise pipelines" subtitle="Draft, review, publish">
        <ul className="space-y-2 text-sm text-night-200">
          {routines.map((routine) => (
            <li
              key={routine.slug}
              className="rounded-xl border border-night-700 bg-night-950/70 px-3 py-2"
            >
              <p className="font-medium text-sand-100">{routine.title}</p>
              <p className="text-xs text-night-300">{routine.cadence}</p>
            </li>
          ))}
          {routines.length === 0 ? (
            <li className="rounded-xl border border-night-700 bg-night-950/70 px-3 py-2 text-night-300">
              No exercises published yet.
            </li>
          ) : null}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/creator/cms"
            className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
          >
            Open CMS
          </Link>
          <Link
            href="/practices"
            className="inline-flex rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-xs text-sand-100 hover:border-night-600"
          >
            Preview member experience
          </Link>
        </div>
      </SurfaceCard>
    </div>
  );
}
