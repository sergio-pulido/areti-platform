import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { LibraryArticleCard } from "@/components/dashboard/library-article-card";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth/session";
import { fetchLibraryLessons } from "@/lib/content-api";

type LibraryPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const session = await requireSession();
  const params = await searchParams;
  const filteredLessons = await fetchLibraryLessons(params.q?.trim());
  const isAdmin = session.user.role === "ADMIN";

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
        {params.q ? <Badge variant="default">Query: {params.q}</Badge> : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-3" aria-label="Library articles">
        {filteredLessons.map((lesson) => (
          <LibraryArticleCard key={lesson.slug} lesson={lesson} />
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
