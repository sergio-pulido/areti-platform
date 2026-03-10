import Link from "next/link";
import { ClaimRiskBadge, CredibilityBadge, EvidenceBadge } from "@/components/academy/academy-metadata-badges";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import {
  apiAcademyDomainBySlug,
  apiAcademyDomains,
  apiAcademyPersons,
  apiAcademyTraditionBySlug,
  apiAcademyTraditions,
} from "@/lib/backend-api";
import { formatRoleLabel } from "@/lib/academy/knowledge-presentation";

type ThinkersIndexPageProps = {
  searchParams: Promise<{
    domain?: string;
    tradition?: string;
  }>;
};

function filterHref(params: { domain?: string; tradition?: string }): string {
  const search = new URLSearchParams();

  if (params.domain) {
    search.set("domain", params.domain);
  }

  if (params.tradition) {
    search.set("tradition", params.tradition);
  }

  const serialized = search.toString();
  return serialized ? `/academy/thinkers?${serialized}` : "/academy/thinkers";
}

export default async function ThinkersIndexPage({ searchParams }: ThinkersIndexPageProps) {
  const params = await searchParams;

  const [domains, traditions, selectedDomainResult, selectedTraditionResult] = await Promise.all([
    apiAcademyDomains({ limit: 200 }),
    apiAcademyTraditions({ limit: 300 }),
    params.domain ? apiAcademyDomainBySlug(params.domain).catch(() => null) : Promise.resolve(null),
    params.tradition ? apiAcademyTraditionBySlug(params.tradition).catch(() => null) : Promise.resolve(null),
  ]);

  const selectedDomain = selectedDomainResult?.domain ?? null;
  const selectedTradition = selectedTraditionResult?.tradition ?? null;

  const thinkers = await apiAcademyPersons({
    limit: 300,
    traditionId: selectedTradition?.id,
    domainId: selectedTradition ? undefined : selectedDomain?.id,
  });

  const traditionById = new Map(traditions.map((tradition) => [tradition.id, tradition] as const));
  const domainById = new Map(domains.map((domain) => [domain.id, domain] as const));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academy"
        title="Thinkers"
        description="Explore thinkers with explicit editorial labels that distinguish foundational figures from modern popularizers."
      />

      <SurfaceCard title="Filters" subtitle="Narrow by domain or tradition">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Link
              href={filterHref({})}
              className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
            >
              All thinkers
            </Link>
            {domains.map((domain) => (
              <Link
                key={domain.id}
                href={filterHref({ domain: domain.slug })}
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
                href={filterHref({ tradition: tradition.slug })}
                className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
              >
                {tradition.name}
              </Link>
            ))}
          </div>
        </div>
      </SurfaceCard>

      <div className="flex flex-wrap gap-2">
        <Badge variant="muted">{thinkers.length} thinkers</Badge>
        {selectedDomain ? <Badge variant="default">Domain: {selectedDomain.name}</Badge> : null}
        {selectedTradition ? <Badge variant="default">Tradition: {selectedTradition.name}</Badge> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {thinkers.map((thinker) => {
          const tradition = thinker.traditionId !== null ? (traditionById.get(thinker.traditionId) ?? null) : null;
          const domain = tradition ? (domainById.get(tradition.domainId) ?? null) : null;

          return (
            <SurfaceCard key={thinker.slug} title={thinker.displayName} subtitle={thinker.bioShort ?? "No short bio yet."}>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="muted">{formatRoleLabel(thinker.roleType)}</Badge>
                {tradition ? <Badge variant="muted">{tradition.name}</Badge> : null}
                {domain ? <Badge variant="muted">{domain.name}</Badge> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <CredibilityBadge value={thinker.credibilityBand} />
                <EvidenceBadge value={thinker.evidenceProfile} />
                <ClaimRiskBadge value={thinker.claimRiskLevel} />
              </div>
              <Link
                href={`/academy/thinkers/${thinker.slug}`}
                className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
              >
                Open thinker
              </Link>
            </SurfaceCard>
          );
        })}
      </div>

      {thinkers.length === 0 ? (
        <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
          No thinkers available for this filter.
        </p>
      ) : null}
    </div>
  );
}
