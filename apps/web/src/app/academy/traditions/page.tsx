import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import {
  getAllDomains,
  getAllTraditions,
  getDomainBySlug,
  getDomainForTradition,
  getPersonsByTradition,
  getTraditionsByDomain,
  getWorksByTradition,
} from "@/lib/academy/knowledge-service";

type TraditionIndexPageProps = {
  searchParams: Promise<{
    domain?: string;
  }>;
};

function createDomainHref(domainSlug: string | null): string {
  if (!domainSlug) {
    return "/academy/traditions";
  }

  return `/academy/traditions?domain=${domainSlug}`;
}

export default async function TraditionIndexPage({ searchParams }: TraditionIndexPageProps) {
  const params = await searchParams;
  const selectedDomain = params.domain ? getDomainBySlug(params.domain) : null;
  const domains = getAllDomains();
  const traditions = selectedDomain
    ? getTraditionsByDomain(selectedDomain.id)
    : getAllTraditions();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academy"
        title="Traditions"
        description="Browse foundational philosophical, spiritual, psychological, and modern practice traditions by domain."
      />

      <SurfaceCard title="Filter by domain" subtitle="Keep epistemic categories clear while exploring">
        <div className="flex flex-wrap gap-2">
          <Link
            href={createDomainHref(null)}
            className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
          >
            All domains
          </Link>
          {domains.map((domain) => (
            <Link
              key={domain.id}
              href={createDomainHref(domain.slug)}
              className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
            >
              {domain.name}
            </Link>
          ))}
        </div>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {traditions.map((tradition) => {
          const domain = getDomainForTradition(tradition);
          const thinkerCount = getPersonsByTradition(tradition.id).length;
          const workCount = getWorksByTradition(tradition.id).length;

          return (
            <SurfaceCard key={tradition.slug} title={tradition.name} subtitle={tradition.originRegion ?? "Region unknown"}>
              <p className="text-sm text-night-200">{tradition.descriptionShort ?? "No summary yet."}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="muted">{domain?.name ?? "Unknown domain"}</Badge>
                <Badge variant="muted">{thinkerCount} thinkers</Badge>
                <Badge variant="muted">{workCount} works</Badge>
              </div>
              <Link
                href={`/academy/traditions/${tradition.slug}`}
                className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
              >
                Open tradition
              </Link>
            </SurfaceCard>
          );
        })}
      </div>

      {traditions.length === 0 ? (
        <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
          No traditions available for this filter.
        </p>
      ) : null}
    </div>
  );
}
