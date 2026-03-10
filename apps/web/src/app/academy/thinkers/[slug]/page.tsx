import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ClaimRiskBadge,
  CredibilityBadge,
  EvidenceBadge,
  WorkAuthorityBadge,
} from "@/components/academy/academy-metadata-badges";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import {
  apiAcademyDomains,
  apiAcademyPersonBySlug,
  apiAcademyPersons,
  apiAcademyTraditions,
} from "@/lib/backend-api";
import { formatLifespan, formatRelationshipType, formatRoleLabel } from "@/lib/academy/knowledge-presentation";

type ThinkerDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ThinkerDetailPage({ params }: ThinkerDetailPageProps) {
  const { slug } = await params;
  const detail = await apiAcademyPersonBySlug(slug).catch(() => null);

  if (!detail) {
    notFound();
  }

  const [traditions, domains, allPersons] = await Promise.all([
    apiAcademyTraditions({ limit: 300 }),
    apiAcademyDomains({ limit: 200 }),
    apiAcademyPersons({ limit: 500 }),
  ]);

  const thinker = detail.person;
  const tradition = thinker.traditionId !== null ? traditions.find((item) => item.id === thinker.traditionId) ?? null : null;
  const domain = tradition ? domains.find((item) => item.id === tradition.domainId) ?? null : null;

  const peopleById = new Map(allPersons.map((person) => [person.id, person] as const));

  const outgoingRelationships = detail.relationships
    .filter((relationship) => relationship.sourcePersonId === thinker.id)
    .map((relationship) => ({
      ...relationship,
      targetPerson: peopleById.get(relationship.targetPersonId) ?? null,
    }));

  const incomingRelationships = detail.relationships
    .filter((relationship) => relationship.targetPersonId === thinker.id)
    .map((relationship) => ({
      ...relationship,
      sourcePerson: peopleById.get(relationship.sourcePersonId) ?? null,
    }));

  const relatedThinkers = [...new Set(
    detail.relationships.flatMap((relationship) => {
      if (relationship.sourcePersonId === thinker.id) {
        return [relationship.targetPersonId];
      }
      if (relationship.targetPersonId === thinker.id) {
        return [relationship.sourcePersonId];
      }
      return [];
    }),
  )]
    .map((id) => peopleById.get(id) ?? null)
    .filter((person): person is NonNullable<typeof person> => person !== null)
    .slice(0, 16);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academy · Thinker"
        title={thinker.displayName}
        description={thinker.bioShort ?? "No short bio available for this thinker yet."}
      />

      <SurfaceCard title="Thinker profile" subtitle="Historical and editorial context">
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted">{formatRoleLabel(thinker.roleType)}</Badge>
          <Badge variant="muted">{formatLifespan(thinker)}</Badge>
          {thinker.countryOrRegion ? <Badge variant="muted">{thinker.countryOrRegion}</Badge> : null}
          {tradition ? <Badge variant="muted">{tradition.name}</Badge> : null}
          {domain ? <Badge variant="muted">{domain.name}</Badge> : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <CredibilityBadge value={thinker.credibilityBand} />
          <EvidenceBadge value={thinker.evidenceProfile} />
          <ClaimRiskBadge value={thinker.claimRiskLevel} />
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Works" subtitle="Texts and books tied to this thinker">
          <div className="space-y-2">
            {detail.works.map((work) => (
              <Link
                key={work.slug}
                href={`/academy/works/${work.slug}`}
                className="block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-3 hover:border-night-600 hover:bg-night-900/80"
              >
                <p className="text-sm font-medium text-sand-100">{work.title}</p>
                <p className="mt-1 text-xs text-night-300">{work.summaryShort ?? "No summary available."}</p>
                <div className="mt-2">
                  <WorkAuthorityBadge isPrimaryText={work.isPrimaryText} />
                </div>
              </Link>
            ))}
            {detail.works.length === 0 ? <p className="text-sm text-night-300">No works linked yet.</p> : null}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Related concepts" subtitle="Concepts connected in the Academy knowledge map">
          <div className="flex flex-wrap gap-2">
            {detail.concepts.map((concept) => (
              <Link
                key={concept.slug}
                href={`/academy/concepts/${concept.slug}`}
                className="rounded-full border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
              >
                {concept.name}
              </Link>
            ))}
            {detail.concepts.length === 0 ? <p className="text-sm text-night-300">No concepts linked yet.</p> : null}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Influence and relationships" subtitle="Recorded relationship edges in the current graph">
          <div className="space-y-2">
            {outgoingRelationships.map((relationship) => (
              <div
                key={`outgoing-${relationship.id}`}
                className="rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-3"
              >
                <p className="text-sm font-medium text-sand-100">
                  {formatRelationshipType(relationship.relationshipType)}
                  {relationship.targetPerson ? ` · ${relationship.targetPerson.displayName}` : ""}
                </p>
                {relationship.notes ? <p className="mt-1 text-xs text-night-300">{relationship.notes}</p> : null}
              </div>
            ))}
            {incomingRelationships.map((relationship) => (
              <div
                key={`incoming-${relationship.id}`}
                className="rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-3"
              >
                <p className="text-sm font-medium text-sand-100">
                  Referenced by
                  {relationship.sourcePerson ? ` · ${relationship.sourcePerson.displayName}` : ""}
                </p>
                {relationship.notes ? <p className="mt-1 text-xs text-night-300">{relationship.notes}</p> : null}
              </div>
            ))}
            {outgoingRelationships.length === 0 && incomingRelationships.length === 0 ? (
              <p className="text-sm text-night-300">No relationship records for this thinker yet.</p>
            ) : null}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Related thinkers" subtitle="Adjacent thinkers from direct relationship data">
          <div className="space-y-2">
            {relatedThinkers.map((person) => (
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
            {relatedThinkers.length === 0 ? <p className="text-sm text-night-300">No related thinkers linked yet.</p> : null}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
