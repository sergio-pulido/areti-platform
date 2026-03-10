import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AcademySearchForm } from "@/components/academy/academy-search-form";
import { CredibilityBadge } from "@/components/academy/academy-metadata-badges";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import {
  getAcademyPaths,
  getAcademyStats,
  getAllDomains,
  getFeaturedConcepts,
  getFeaturedThinkers,
  getFeaturedTraditions,
  getTraditionsByDomain,
} from "@/lib/academy/knowledge-service";

export default function AcademyHomePage() {
  const stats = getAcademyStats();
  const domains = getAllDomains();
  const featuredTraditions = getFeaturedTraditions(8);
  const featuredThinkers = getFeaturedThinkers(8);
  const featuredConcepts = getFeaturedConcepts(8);
  const starterPaths = getAcademyPaths();

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
            <p className="mt-1 text-xl font-semibold text-sand-100">{stats.domainCount}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night-300">Traditions</p>
            <p className="mt-1 text-xl font-semibold text-sand-100">{stats.traditionCount}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night-300">Thinkers</p>
            <p className="mt-1 text-xl font-semibold text-sand-100">{stats.thinkerCount}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night-300">Works</p>
            <p className="mt-1 text-xl font-semibold text-sand-100">{stats.workCount}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night-300">Concepts</p>
            <p className="mt-1 text-xl font-semibold text-sand-100">{stats.conceptCount}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-night-300">Thinker links</p>
            <p className="mt-1 text-xl font-semibold text-sand-100">{stats.relationshipCount}</p>
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
              const traditionCount = getTraditionsByDomain(domain.id).length;

              return (
                <Link
                  key={domain.id}
                  href={`/academy/traditions?domain=${domain.slug}`}
                  className="group flex items-start justify-between rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-3 transition hover:border-night-600 hover:bg-night-900/80"
                >
                  <span>
                    <span className="block text-sm font-semibold text-sand-100">{domain.name}</span>
                    <span className="mt-1 block text-xs text-night-300">{domain.descriptionShort}</span>
                  </span>
                  <Badge variant="muted">{traditionCount} traditions</Badge>
                </Link>
              );
            })}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Starter paths" subtitle="Curated journeys that turn static knowledge into guided learning">
          <div className="space-y-3">
            {starterPaths.map((path) => (
              <Link
                key={path.slug}
                href={`/academy/paths#${path.slug}`}
                className="group block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-3 transition hover:border-night-600 hover:bg-night-900/80"
              >
                <p className="text-sm font-semibold text-sand-100">{path.title}</p>
                <p className="mt-1 text-xs text-night-300">{path.summary}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="muted">{path.traditions.length} traditions</Badge>
                  <Badge variant="muted">{path.persons.length} thinkers</Badge>
                  <Badge variant="muted">{path.works.length} works</Badge>
                </div>
              </Link>
            ))}
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
                <p className="mt-1 text-xs text-night-300">{concept.description}</p>
              </Link>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
