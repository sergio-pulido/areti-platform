import Link from "next/link";
import { notFound } from "next/navigation";
import { CredibilityBadge, WorkAuthorityBadge } from "@/components/academy/academy-metadata-badges";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { apiAcademyConceptBySlug, apiAcademyPersons } from "@/lib/backend-api";

type ConceptDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ConceptDetailPage({ params }: ConceptDetailPageProps) {
  const { slug } = await params;
  const detail = await apiAcademyConceptBySlug(slug).catch(() => null);

  if (!detail) {
    notFound();
  }

  const { concept, links } = detail;

  if (!links) {
    notFound();
  }

  const people = await apiAcademyPersons({ limit: 500 });
  const peopleById = new Map(people.map((person) => [person.id, person] as const));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academy · Concept"
        title={concept.name}
        description={concept.description ?? "No description available yet."}
      />

      <SurfaceCard title="Concept profile" subtitle="Cross-linked context in the Academy graph">
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted">Family: {concept.conceptFamily ?? "General"}</Badge>
          <Badge variant="muted">{links.traditions.length} traditions</Badge>
          <Badge variant="muted">{links.persons.length} thinkers</Badge>
          <Badge variant="muted">{links.works.length} works</Badge>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-3">
        <SurfaceCard title="Related traditions" subtitle="Traditions where this concept is emphasized">
          <div className="space-y-2">
            {links.traditions.map((tradition) => (
              <Link
                key={tradition.slug}
                href={`/academy/traditions/${tradition.slug}`}
                className="block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-2 text-sm text-sand-100 hover:border-night-600 hover:bg-night-900/80"
              >
                {tradition.name}
              </Link>
            ))}
            {links.traditions.length === 0 ? <p className="text-sm text-night-300">No related traditions linked yet.</p> : null}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Related thinkers" subtitle="Thinkers most associated with this concept">
          <div className="space-y-2">
            {links.persons.map((person) => (
              <Link
                key={person.slug}
                href={`/academy/thinkers/${person.slug}`}
                className="block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-2 hover:border-night-600 hover:bg-night-900/80"
              >
                <p className="text-sm font-medium text-sand-100">{person.displayName}</p>
                <div className="mt-1">
                  <CredibilityBadge value={person.credibilityBand} />
                </div>
              </Link>
            ))}
            {links.persons.length === 0 ? <p className="text-sm text-night-300">No related thinkers linked yet.</p> : null}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Related works" subtitle="Texts where this concept is central">
          <div className="space-y-2">
            {links.works.map((work) => {
              const author = work.personId !== null ? (peopleById.get(work.personId) ?? null) : null;

              return (
                <Link
                  key={work.slug}
                  href={`/academy/works/${work.slug}`}
                  className="block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-3 hover:border-night-600 hover:bg-night-900/80"
                >
                  <p className="text-sm font-medium text-sand-100">{work.title}</p>
                  <p className="mt-1 text-xs text-night-300">{author?.displayName ?? "Unknown author"}</p>
                  <div className="mt-2">
                    <WorkAuthorityBadge isPrimaryText={work.isPrimaryText} />
                  </div>
                </Link>
              );
            })}
            {links.works.length === 0 ? <p className="text-sm text-night-300">No related works linked yet.</p> : null}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
