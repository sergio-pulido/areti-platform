import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchLibraryLessons } from "@/lib/content-api";

export default async function CreatorReadingsPage() {
  const lessons = await fetchLibraryLessons();

  return (
    <div>
      <PageHeader
        eyebrow="Creator"
        title="Readings Studio"
        description="Create concise readings and learning tracks for different learner profiles."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {lessons.map((lesson) => (
          <SurfaceCard key={lesson.slug} title={lesson.title} subtitle={lesson.tradition}>
            <p className="text-sm text-night-200">{lesson.summary}</p>
            <Link
              href="/creator/cms"
              className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Create in CMS
            </Link>
          </SurfaceCard>
        ))}
        {lessons.length === 0 ? (
          <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
            No readings available yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
