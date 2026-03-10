import Link from "next/link";
import { WorkAuthorityBadge } from "@/components/academy/academy-metadata-badges";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import {
  apiAcademyDomainBySlug,
  apiAcademyDomains,
  apiAcademyPersons,
  apiAcademyTraditionBySlug,
  apiAcademyTraditions,
  apiAcademyWorks,
} from "@/lib/backend-api";

type WorksIndexPageProps = {
  searchParams: Promise<{
    domain?: string;
    tradition?: string;
  }>;
};

function buildFilterHref(filters: { domain?: string; tradition?: string }): string {
  const params = new URLSearchParams();

  if (filters.domain) {
    params.set("domain", filters.domain);
  }

  if (filters.tradition) {
    params.set("tradition", filters.tradition);
  }

  const serialized = params.toString();
  return serialized ? `/academy/works?${serialized}` : "/academy/works";
}

export default async function WorksIndexPage({ searchParams }: WorksIndexPageProps) {
  const params = await searchParams;

  const [domains, traditions, worksAll, persons, selectedDomainResult, selectedTraditionResult] = await Promise.all([
    apiAcademyDomains({ limit: 200 }),
    apiAcademyTraditions({ limit: 300 }),
    apiAcademyWorks({ limit: 800 }),
    apiAcademyPersons({ limit: 500 }),
    params.domain ? apiAcademyDomainBySlug(params.domain).catch(() => null) : Promise.resolve(null),
    params.tradition ? apiAcademyTraditionBySlug(params.tradition).catch(() => null) : Promise.resolve(null),
  ]);

  const selectedDomain = selectedDomainResult?.domain ?? null;
  const selectedTradition = selectedTraditionResult?.tradition ?? null;

  const traditionIdsForDomain = new Set(
    selectedDomain
      ? traditions.filter((tradition) => tradition.domainId === selectedDomain.id).map((tradition) => tradition.id)
      : [],
  );

  const works = worksAll.filter((work) => {
    if (selectedTradition) {
      return work.traditionId === selectedTradition.id;
    }

    if (selectedDomain) {
      return work.traditionId !== null && traditionIdsForDomain.has(work.traditionId);
    }

    return true;
  });

  const traditionById = new Map(traditions.map((tradition) => [tradition.id, tradition] as const));
  const domainById = new Map(domains.map((domain) => [domain.id, domain] as const));
  const personById = new Map(persons.map((person) => [person.id, person] as const));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academy"
        title="Works"
        description="Primary texts and secondary works linked to traditions and thinkers with explicit authority labels."
      />

      <SurfaceCard title="Filters" subtitle="Narrow works by domain or tradition">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Link
              href={buildFilterHref({})}
              className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
            >
              All works
            </Link>
            {domains.map((domain) => (
              <Link
                key={domain.id}
                href={buildFilterHref({ domain: domain.slug })}
                className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
              >
                {domain.name}
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {traditions.map((tradition) => (
              <Link
                key={tradition.id}
                href={buildFilterHref({ tradition: tradition.slug })}
                className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
              >
                {tradition.name}
              </Link>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <div className="flex flex-wrap gap-2">
        <Badge variant="muted">{works.length} works</Badge>
        {selectedDomain ? <Badge variant="default">Domain: {selectedDomain.name}</Badge> : null}
        {selectedTradition ? <Badge variant="default">Tradition: {selectedTradition.name}</Badge> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {works.map((work) => {
          const author = work.personId !== null ? (personById.get(work.personId) ?? null) : null;
          const tradition = work.traditionId !== null ? (traditionById.get(work.traditionId) ?? null) : null;
          const domain = tradition ? (domainById.get(tradition.domainId) ?? null) : null;

          return (
            <SurfaceCard key={work.slug} title={work.title} subtitle={author?.displayName ?? "Unknown author"}>
              <div className="flex flex-wrap gap-1.5">
                {tradition ? <Badge variant="muted">{tradition.name}</Badge> : null}
                {domain ? <Badge variant="muted">{domain.name}</Badge> : null}
                {work.workType ? <Badge variant="muted">{work.workType}</Badge> : null}
                {work.publicationYear !== null ? <Badge variant="muted">{work.publicationYear}</Badge> : null}
              </div>
              <div className="mt-3">
                <WorkAuthorityBadge isPrimaryText={work.isPrimaryText} />
              </div>
              <p className="mt-3 text-sm text-night-200">{work.summaryShort ?? "No summary available."}</p>
              <Link
                href={`/academy/works/${work.slug}`}
                className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
              >
                Open work
              </Link>
            </SurfaceCard>
          );
        })}
      </div>

      {works.length === 0 ? (
        <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
          No works available for this filter.
        </p>
      ) : null}
    </div>
  );
}
