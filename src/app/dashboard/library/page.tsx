import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

type LibraryPageProps = {
  searchParams: Promise<{ q?: string }>;
};

const lessons = [
  {
    title: "Dichotomy of Control in High-Pressure Work",
    tradition: "Stoicism",
    level: "Intermediate",
    minutes: 12,
  },
  {
    title: "Pleasure Without Excess: The Epicurean Filter",
    tradition: "Epicureanism",
    level: "Beginner",
    minutes: 8,
  },
  {
    title: "Wu Wei for Product Leaders",
    tradition: "Taoism",
    level: "Advanced",
    minutes: 11,
  },
  {
    title: "Non-Attachment and Emotional Recovery",
    tradition: "Buddhism",
    level: "Intermediate",
    minutes: 10,
  },
  {
    title: "Meaningful Friendship as Strategic Resilience",
    tradition: "Epicureanism",
    level: "Beginner",
    minutes: 7,
  },
];

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";

  const filteredLessons = query
    ? lessons.filter((lesson) =>
        `${lesson.title} ${lesson.tradition}`.toLowerCase().includes(query),
      )
    : lessons;

  return (
    <div>
      <PageHeader
        eyebrow="Library"
        title="Philosophy Knowledge Hub"
        description="Search and study concise lessons mixing Stoicism, Epicureanism, and complementary schools."
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {filteredLessons.map((lesson) => (
          <SurfaceCard key={lesson.title} title={lesson.title} subtitle={lesson.tradition}>
            <div className="mt-3 flex items-center justify-between text-xs text-night-300">
              <span>{lesson.level}</span>
              <span>{lesson.minutes} min read</span>
            </div>
          </SurfaceCard>
        ))}
      </div>

      {filteredLessons.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
          No results found for &quot;{params.q}&quot;.
        </p>
      ) : null}
    </div>
  );
}
