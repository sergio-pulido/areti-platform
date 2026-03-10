import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AcademySearchForm } from "@/components/academy/academy-search-form";
import { CredibilityBadge } from "@/components/academy/academy-metadata-badges";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import {
  apiAcademyConceptLinks,
  apiAcademyConcepts,
  apiAcademyDomains,
  apiAcademyOverview,
  apiAcademyPaths,
  apiAcademyPersons,
  apiAcademyTraditions,
  apiAcademyWorks,
  type ApiAcademyPerson,
  type ApiAcademyTradition,
} from "@/lib/backend-api";

function rankTradition(
  tradition: ApiAcademyTradition,
  thinkerCountByTradition: Map<number, number>,
  workCountByTradition: Map<number, number>,
): number {
  const peopleCount = thinkerCountByTradition.get(tradition.id) ?? 0;
  const worksCount = workCountByTradition.get(tradition.id) ?? 0;
  return peopleCount * 2 + worksCount;
}

function personCredibilityRank(person: ApiAcademyPerson): number {
  switch (person.credibilityBand) {
    case "foundational":
      return 1;
    case "major":
      return 2;
    case "secondary":
      return 3;
    case "popularizer":
      return 4;
    case "controversial":
      return 5;
    default:
      return 99;
  }
}

function rankPerson(person: ApiAcademyPerson, worksCountByPerson: Map<number, number>): number {
  const worksCount = worksCountByPerson.get(person.id) ?? 0;
  return personCredibilityRank(person) * 10 - worksCount;
}

export default async function AcademyHomePage() {
  const [overviewPayload, domains, traditions, persons, works, concepts, starterPaths] = await Promise.all([
    apiAcademyOverview(),
    apiAcademyDomains({ limit: 200 }),
    apiAcademyTraditions({ limit: 240 }),
    apiAcademyPersons({ limit: 300 }),
    apiAcademyWorks({ limit: 400 }),
    apiAcademyConcepts({ limit: 32 }),
    apiAcademyPaths({ includeItems: true, limit: 24 }),
  ]);

  const traditionCountByDomain = new Map<number, number>();
  for (const tradition of traditions) {
    traditionCountByDomain.set(
      tradition.domainId,
      (traditionCountByDomain.get(tradition.domainId) ?? 0) + 1,
    );
  }

  const thinkerCountByTradition = new Map<number, number>();
  for (const person of persons) {
    if (person.traditionId !== null) {
      thinkerCountByTradition.set(
        person.traditionId,
        (thinkerCountByTradition.get(person.traditionId) ?? 0) + 1,
      );
    }
  }

  const worksCountByTradition = new Map<number, number>();
  const worksCountByPerson = new Map<number, number>();
  for (const work of works) {
    if (work.traditionId !== null) {
      worksCountByTradition.set(work.traditionId, (worksCountByTradition.get(work.traditionId) ?? 0) + 1);
    }
    if (work.personId !== null) {
      worksCountByPerson.set(work.personId, (worksCountByPerson.get(work.personId) ?? 0) + 1);
    }
  }

  const featuredTraditions = [...traditions]
    .sort(
      (a, b) =>
        rankTradition(b, thinkerCountByTradition, worksCountByTradition) -
          rankTradition(a, thinkerCountByTradition, worksCountByTradition) || a.name.localeCompare(b.name),
    )
    .slice(0, 8);

  const featuredThinkers = [...persons]
    .sort((a, b) => rankPerson(a, worksCountByPerson) - rankPerson(b, worksCountByPerson) || a.displayName.localeCompare(b.displayName))
    .slice(0, 8);

  const conceptWeightBySlug = new Map<string, number>();
  await Promise.all(
    concepts.map(async (concept) => {
      try {
        const links = await apiAcademyConceptLinks(concept.slug);
        conceptWeightBySlug.set(concept.slug, links.persons.length + links.works.length + links.traditions.length);
      } catch {
        conceptWeightBySlug.set(concept.slug, 0);
      }
    }),
  );

  const featuredConcepts = [...concepts]
    .sort(
      (a, b) =>
        (conceptWeightBySlug.get(b.slug) ?? 0) - (conceptWeightBySlug.get(a.slug) ?? 0) ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 8);

  const starterPathsSorted = [...starterPaths]
    .sort(
      (a, b) =>
        Number(b.isFeatured) - Number(a.isFeatured) ||
        a.progressionOrder - b.progressionOrder ||
        b.recommendationWeight - a.recommendationWeight,
    )
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academy"
        title="A Structured Library for Philosophy and Psychology"
        description="Academy is the editorial knowledge layer of Areti: traditions, thinkers, works, and concepts organized for calm study and future intelligent guidance."
      />

      <SurfaceCard
        title="Knowledge at a glance"
        subtitle="Structured foundations now available for product exploration, search, and future agent capabilities"
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night-300">Domains</p>
            <p className="mt-1 text-xl font-semibold text-sand-100">{overviewPayload.overview.domainCount}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night-300">Traditions</p>
            <p className="mt-1 text-xl font-semibold text-sand-100">{overviewPayload.overview.traditionCount}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night-300">Thinkers</p>
            <p className="mt-1 text-xl font-semibold text-sand-100">{overviewPayload.overview.personCount}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night-300">Works</p>
            <p className="mt-1 text-xl font-semibold text-sand-100">{overviewPayload.overview.workCount}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night-300">Concepts</p>
            <p className="mt-1 text-xl font-semibold text-sand-100">{overviewPayload.overview.conceptCount}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night-300">Thinker links</p>
            <p className="mt-1 text-xl font-semibold text-sand-100">{overviewPayload.overview.relationshipCount}</p>
          </div>
        </div>
      </SurfaceCard>

      <SurfaceCard title="Search the Academy" subtitle="Find traditions, thinkers, works, and concepts quickly">
        <AcademySearchForm />
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Browse by domain" subtitle="Each domain keeps a distinct epistemic profile and editorial intent">
          <div className="space-y-3">
            {domains.map((domain) => {
              const traditionCount = traditionCountByDomain.get(domain.id) ?? 0;

              return (
                <Link
                  key={domain.id}
                  href={`/academy/traditions?domain=${domain.slug}`}
                  className="group flex items-start justify-between rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-3 transition hover:border-night-600 hover:bg-night-900/80"
                >
                  <span>
                    <span className="block text-sm font-semibold text-sand-100">{domain.name}</span>
                    <span className="mt-1 block text-xs text-night-300">{domain.descriptionShort ?? "No summary yet."}</span>
                  </span>
                  <Badge variant="muted">{traditionCount} traditions</Badge>
                </Link>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Starter paths" subtitle="Curated journeys that turn static knowledge into guided learning">
          <div className="space-y-3">
            {starterPathsSorted.map((path) => {
              const items = path.items ?? [];
              const traditionCount = items.filter((item) => item.entityType === "tradition").length;
              const thinkerCount = items.filter((item) => item.entityType === "person").length;
              const workCount = items.filter((item) => item.entityType === "work").length;

              return (
                <Link
                  key={path.slug}
                  href={`/academy/paths#${path.slug}`}
                  className="group block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-3 transition hover:border-night-600 hover:bg-night-900/80"
                >
                  <p className="text-sm font-semibold text-sand-100">{path.title}</p>
                  <p className="mt-1 text-xs text-night-300">{path.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="muted">{traditionCount} traditions</Badge>
                    <Badge variant="muted">{thinkerCount} thinkers</Badge>
                    <Badge variant="muted">{workCount} works</Badge>
                  </div>
                </Link>
              );
            })}
          </div>
          <Link
            href="/academy/paths"
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
          >
            Open all paths
            <ArrowRight size={14} />
          </Link>
        </SurfaceCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SurfaceCard title="Featured traditions" subtitle="Foundational schools and major currents">
          <div className="space-y-2">
            {featuredTraditions.map((tradition) => (
              <Link
                key={tradition.slug}
                href={`/academy/traditions/${tradition.slug}`}
                className="block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-2 text-sm text-sand-100 hover:border-night-600 hover:bg-night-900/80"
              >
                {tradition.name}
              </Link>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Featured thinkers" subtitle="Distinction between foundational figures and modern popularizers is explicit">
          <div className="space-y-2">
            {featuredThinkers.map((person) => (
              <Link
                key={person.slug}
                href={`/academy/thinkers/${person.slug}`}
                className="block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-2 hover:border-night-600 hover:bg-night-900/80"
              >
                <p className="text-sm font-medium text-sand-100">{person.displayName}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <CredibilityBadge value={person.credibilityBand} />
                </div>
              </Link>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Popular concepts" subtitle="Cross-domain ideas with linked thinkers and works">
          <div className="space-y-2">
            {featuredConcepts.map((concept) => (
              <Link
                key={concept.slug}
                href={`/academy/concepts/${concept.slug}`}
                className="block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-2 text-sm text-sand-100 hover:border-night-600 hover:bg-night-900/80"
              >
                <p className="font-medium">{concept.name}</p>
                <p className="mt-1 text-xs text-night-300">{concept.description ?? "No description yet."}</p>
              </Link>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
