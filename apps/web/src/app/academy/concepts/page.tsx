import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { apiAcademyConceptLinks, apiAcademyConcepts } from "@/lib/backend-api";

export default async function ConceptIndexPage() {
  const concepts = await apiAcademyConcepts({ limit: 200 });

  const linksBySlug = new Map<
    string,
    {
      traditions: number;
      persons: number;
      works: number;
    }
  >();

  await Promise.all(
    concepts.map(async (concept) => {
      try {
        const links = await apiAcademyConceptLinks(concept.slug);
        linksBySlug.set(concept.slug, {
          traditions: links.traditions.length,
          persons: links.persons.length,
          works: links.works.length,
        });
      } catch {
        linksBySlug.set(concept.slug, {
          traditions: 0,
          persons: 0,
          works: 0,
        });
      }
    }),
  );

  const grouped = new Map<string, typeof concepts>();
  for (const concept of concepts) {
    const family = concept.conceptFamily ?? "general";
    const bucket = grouped.get(family) ?? [];
    bucket.push(concept);
    grouped.set(family, bucket);
  }

  const groupedConcepts = [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academy"
        title="Concepts"
        description="Core ideas linked across traditions, thinkers, and works for structured exploration."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        {groupedConcepts.map(([family, items]) => (
          <SurfaceCard
            key={family}
            title={family.charAt(0).toUpperCase() + family.slice(1)}
            subtitle={`${items.length} concepts`}
          >
            <div className="flex flex-wrap gap-2">
              {items.map((concept) => {
                const linkCounts = linksBySlug.get(concept.slug) ?? {
                  traditions: 0,
                  persons: 0,
                  works: 0,
                };

                return (
                  <Link
                    key={concept.slug}
                    href={`/academy/concepts/${concept.slug}`}
                    className="rounded-xl border border-night-700 bg-night-950/70 px-3 py-2 text-xs text-night-100 hover:border-night-600"
                  >
                    <span className="font-medium text-sand-100">{concept.name}</span>
                    <span className="mt-1 block text-[11px] text-night-300">
                      {linkCounts.traditions} traditions · {linkCounts.persons} thinkers · {linkCounts.works} works
                    </span>
                  </Link>
                );
              })}
            </div>
          </SurfaceCard>
        ))}
      </div>

      {groupedConcepts.length === 0 ? (
        <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
          No concepts available yet.
        </p>
      ) : null}

      <SurfaceCard title="Quick exploration" subtitle="Jump straight into related entities">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/academy/traditions"
            className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
          >
            Traditions
          </Link>
          <Link
            href="/academy/thinkers"
            className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
          >
            Thinkers
          </Link>
          <Link
            href="/academy/works"
            className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
          >
            Works
          </Link>
          <Badge variant="muted">Structured and editorially curated</Badge>
        </div>
      </SurfaceCard>
    </div>
  );
}
