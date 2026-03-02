import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchLibraryLessons } from "@/lib/content-api";

type LibraryPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const filteredLessons = await fetchLibraryLessons(params.q?.trim());

  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="Philosophy Knowledge Hub"
        description="Search and study concise lessons mixing Stoicism, Epicureanism, and complementary schools."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {filteredLessons.map((lesson) => (
          <SurfaceCard key={lesson.slug} title={lesson.title} subtitle={lesson.tradition}>
            <div className="mt-3 flex items-center justify-between text-xs text-night-300">
              <span>{lesson.level}</span>
              <span>{lesson.minutes} min read</span>
            </div>
            <p className="mt-3 text-sm text-night-200">{lesson.summary}</p>
          </SurfaceCard>
        ))}
      </div>

      {filteredLessons.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
          {params.q
            ? `No results found for "${params.q}".`
            : "No library lessons found in API content."}
        </p>
      ) : null}
    </div>
  );
}
