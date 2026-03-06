import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchPracticeRoutineBySlug } from "@/lib/content-api";

type PracticeDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PracticeDetailPage({ params }: PracticeDetailPageProps) {
  const { slug } = await params;
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
          <ol className="mt-4 space-y-2 text-sm text-night-200">
            <li>1. Sit down, slow your breath, and set one intention for this practice.</li>
            <li>2. Run the exercise in full without switching tasks.</li>
            <li>3. Capture one insight and one next action before moving on.</li>
          </ol>
        </SurfaceCard>

        <SurfaceCard title="After Practice" subtitle="Keep your momentum visible">
          <p className="text-sm text-night-200">
            When the practice ends, save a short reflection to track consistency and emotional tone.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/dashboard/journal?title=${encodeURIComponent(`Practice: ${routine.title}`)}&mood=Focused`}
              className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Log reflection
            </Link>
            <Link
              href="/dashboard/practices"
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
