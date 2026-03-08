import Link from "next/link";
import { notFound } from "next/navigation";
import { markContentCompleteAction } from "@/actions/content-progress";
import { PageHeader } from "@/components/dashboard/page-header";
import { PlainTextContent } from "@/components/dashboard/plain-text-content";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchLibraryLessonBySlug } from "@/lib/content-api";

type LibraryDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    completed?: string;
  }>;
};

export default async function LibraryDetailPage({ params, searchParams }: LibraryDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const lesson = await fetchLibraryLessonBySlug(slug);

  if (!lesson) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title={lesson.title}
        description={`${lesson.tradition} · ${lesson.level} · ${lesson.minutes} min read`}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
        <SurfaceCard title="Article" subtitle={lesson.summary}>
          <PlainTextContent value={lesson.content} />
        </SurfaceCard>

        <SurfaceCard title="Action Prompt" subtitle="Apply this in the next 24 hours">
          <p className="text-sm text-night-200">
            Identify one concrete moment today where this lesson can guide your behavior. Keep the
            action small and specific.
          </p>
          {query.completed === "1" ? (
            <p className="mt-3 rounded-xl border border-sage-300/35 bg-sage-500/10 px-3 py-2 text-xs text-sage-100">
              Lesson marked complete.
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <form action={markContentCompleteAction}>
              <input type="hidden" name="contentKind" value="lesson" />
              <input type="hidden" name="contentSlug" value={lesson.slug} />
              <input type="hidden" name="returnTo" value={`/library/${lesson.slug}`} />
              <button
                type="submit"
                className="inline-flex rounded-xl border border-night-700 bg-night-950/70 px-3 py-2 text-xs text-night-100 hover:bg-night-900/90"
              >
                Mark lesson complete
              </button>
            </form>
            <Link
              href={`/journal?title=${encodeURIComponent(`Lesson: ${lesson.title}`)}&mood=Reflective`}
              className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Log reflection
            </Link>
            <Link
              href="/library"
              className="inline-flex rounded-xl border border-night-700 bg-night-950/70 px-3 py-2 text-xs text-night-100 hover:bg-night-900/90"
            >
              Back to library
            </Link>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
