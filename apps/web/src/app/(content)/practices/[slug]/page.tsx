import Link from "next/link";
import { notFound } from "next/navigation";
import { markContentCompleteAction } from "@/actions/content-progress";
import { PageHeader } from "@/components/dashboard/page-header";
import { PlainTextContent } from "@/components/dashboard/plain-text-content";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchPracticeRoutineBySlug } from "@/lib/content-api";

type PracticeDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    completed?: string;
  }>;
};

export default async function PracticeDetailPage({ params, searchParams }: PracticeDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const routine = await fetchPracticeRoutineBySlug(slug);

  if (!routine) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Practice"
        title={routine.title}
        description="Start the routine first, then log your reflection in Journal when you finish."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <SurfaceCard title="Protocol" subtitle={routine.cadence}>
          <p className="text-sm text-night-200">{routine.description}</p>
          <PlainTextContent value={routine.protocol} className="mt-4 space-y-4 text-sm text-night-200" />
        </SurfaceCard>

        <SurfaceCard title="After Practice" subtitle="Keep your momentum visible">
          <p className="text-sm text-night-200">
            When the practice ends, save a short reflection to track consistency and emotional tone.
          </p>
          {query.completed === "1" ? (
            <p className="mt-3 rounded-xl border border-sage-300/35 bg-sage-500/10 px-3 py-2 text-xs text-sage-100">
              Practice marked complete.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={markContentCompleteAction}>
              <input type="hidden" name="contentKind" value="practice" />
              <input type="hidden" name="contentSlug" value={routine.slug} />
              <input type="hidden" name="returnTo" value={`/practices/${routine.slug}`} />
              <button
                type="submit"
                className="inline-flex rounded-xl border border-night-700 bg-night-950/70 px-3 py-2 text-xs text-night-100 hover:bg-night-900/90"
              >
                Mark practice complete
              </button>
            </form>
            <Link
              href={`/journal?title=${encodeURIComponent(`Practice: ${routine.title}`)}&mood=Focused`}
              className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Log reflection
            </Link>
            <Link
              href="/practices"
              className="inline-flex rounded-xl border border-night-700 bg-night-950/70 px-3 py-2 text-xs text-night-100 hover:bg-night-900/90"
            >
              Back to practices
            </Link>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
