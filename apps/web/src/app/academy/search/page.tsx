import Link from "next/link";
import { AcademySearchForm } from "@/components/academy/academy-search-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { searchAcademy } from "@/lib/academy/knowledge-service";

type AcademySearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function AcademySearchPage({ searchParams }: AcademySearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const results = query ? searchAcademy(query, 80) : [];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academy"
        title="Search"
        description="Search across domains, traditions, thinkers, works, and concepts from the Academy knowledge foundation."
      />

      <SurfaceCard title="Search Academy" subtitle="Fast structured search over all knowledge entities">
        <AcademySearchForm defaultQuery={query} />
      </SurfaceCard>

      {query ? (
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted">Query: {query}</Badge>
          <Badge variant="muted">{results.length} results</Badge>
        </div>
      ) : null}

      {query && results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((result) => (
            <SurfaceCard key={`${result.type}-${result.slug}`} title={result.title} subtitle={result.subtitle}>
              <p className="text-sm text-night-200">{result.summary}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {result.tags.map((tag) => (
                  <Badge key={`${result.slug}-${tag}`} variant="muted">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Link
                href={result.href}
                className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
              >
                Open
              </Link>
            </SurfaceCard>
          ))}
        </div>
      ) : null}

      {query && results.length === 0 ? (
        <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
          No Academy entities matched: {query}. Try a thinker name, tradition, concept, or work title.
        </p>
      ) : null}

      {!query ? (
        <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
          Enter a query to search across the Academy library.
        </p>
      ) : null}
    </div>
  );
}
