import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { LibraryArticleCard } from "@/components/dashboard/library-article-card";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { apiProgressCompletions } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";
import { fetchLibraryLessons } from "@/lib/content-api";

type LibraryPageProps = {
  searchParams: Promise<{ q?: string; path?: string }>;
};

type LibraryPathKey = "starter" | "applied" | "mastery";

function normalizeLibraryPath(value: string | undefined): LibraryPathKey | null {
  if (value === "starter" || value === "applied" || value === "mastery") {
    return value;
  }

  return null;
}

function matchesLibraryPath(path: LibraryPathKey | null, level: string): boolean {
  if (!path) {
    return true;
  }

  if (path === "starter") {
    return level === "Beginner";
  }

  if (path === "applied") {
    return level === "Intermediate";
  }

  return level === "Advanced";
}

function buildLibraryPathHref(path: LibraryPathKey | "all", q?: string): string {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (path !== "all") {
    params.set("path", path);
  }
  const qs = params.toString();
  return qs ? `/library?${qs}` : "/library";
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const session = await requireSession();
  const params = await searchParams;
  const activePath = normalizeLibraryPath(params.path?.trim());
  const [filteredLessons, completions] = await Promise.all([
    fetchLibraryLessons(params.q?.trim()),
    apiProgressCompletions(session.accessToken, 500),
  ]);
  const visibleLessons = filteredLessons.filter((lesson) => matchesLibraryPath(activePath, lesson.level));
  const isAdmin = session.user.role === "ADMIN";
  const lessonCompletions = completions.filter((item) => item.contentKind === "lesson");
  const completedLessonSlugs = new Set(lessonCompletions.map((item) => item.contentSlug));

  const levelOrder: Record<string, number> = {
    Beginner: 1,
    Intermediate: 2,
    Advanced: 3,
  };
  const orderedLessons = [...visibleLessons].sort(
    (a, b) => (levelOrder[a.level] ?? 99) - (levelOrder[b.level] ?? 99) || a.minutes - b.minutes,
  );
  const recommendedNextLesson = orderedLessons.find((item) => !completedLessonSlugs.has(item.slug)) ?? null;
  const completedLessonsCount = orderedLessons.filter((item) => completedLessonSlugs.has(item.slug)).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Library"
        title="Philosophy Knowledge Hub"
        description="Search and study concise lessons mixing Stoicism, Epicureanism, and complementary schools."
        actions={
          isAdmin ? (
            <Link
              href="/library/new"
              className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              New article
            </Link>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="muted">{filteredLessons.length} lessons</Badge>
        <Badge variant="muted">{visibleLessons.length} visible</Badge>
        <Badge variant="default">{completedLessonsCount} completed</Badge>
        {params.q ? <Badge variant="default">Query: {params.q}</Badge> : null}
        {activePath ? <Badge variant="success">Path: {activePath}</Badge> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildLibraryPathHref("all", params.q?.trim())}
          className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
        >
          Full path
        </Link>
        <Link
          href={buildLibraryPathHref("starter", params.q?.trim())}
          className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
        >
          Starter (Beginner)
        </Link>
        <Link
          href={buildLibraryPathHref("applied", params.q?.trim())}
          className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
        >
          Applied (Intermediate)
        </Link>
        <Link
          href={buildLibraryPathHref("mastery", params.q?.trim())}
          className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
        >
          Mastery (Advanced)
        </Link>
      </div>

      <SurfaceCard
        title="Learning path"
        subtitle={
          recommendedNextLesson
            ? `Recommended next: ${recommendedNextLesson.title}`
            : "All lessons in this list are completed"
        }
      >
        <p className="text-sm text-night-200">
          Move from Beginner to Advanced. Complete one lesson, apply one action in real life, then continue.
        </p>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-3" aria-label="Library articles">
        {visibleLessons.map((lesson) => (
          <LibraryArticleCard
            key={lesson.slug}
            lesson={lesson}
            completed={completedLessonSlugs.has(lesson.slug)}
            recommended={recommendedNextLesson?.slug === lesson.slug}
          />
        ))}
      </div>

      {visibleLessons.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
          {params.q
            ? `No results found for "${params.q}".`
            : "No library lessons found in API content."}
        </p>
      ) : null}
    </div>
  );
}
