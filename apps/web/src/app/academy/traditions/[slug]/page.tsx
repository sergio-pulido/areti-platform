import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import {
  getChildTraditions,
  getDomainForTradition,
  getParentTradition,
  getPersonForWork,
  getPersonsByTradition,
  getRelatedConceptsForTradition,
  getRelatedTraditions,
  getTraditionBySlug,
  getWorksByTradition,
} from "@/lib/academy/knowledge-service";
import { CredibilityBadge, WorkAuthorityBadge } from "@/components/academy/academy-metadata-badges";

type TraditionDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function TraditionDetailPage({ params }: TraditionDetailPageProps) {
  const { slug } = await params;
  const tradition = getTraditionBySlug(slug);

  if (!tradition) {
    notFound();
  }

  const domain = getDomainForTradition(tradition);
  const parentTradition = getParentTradition(tradition);
  const childTraditions = getChildTraditions(tradition.id);
  const majorThinkers = getPersonsByTradition(tradition.id);
  const notableWorks = getWorksByTradition(tradition.id);
  const relatedConcepts = getRelatedConceptsForTradition(tradition.id);
  const relatedTraditions = getRelatedTraditions(tradition).filter((item) => item.id !== tradition.id);
  const linkedTraditions = [...new Map([...childTraditions, ...relatedTraditions].map((item) => [item.id, item])).values()];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academy · Tradition"
        title={tradition.name}
        description={tradition.descriptionShort ?? "No summary available for this tradition yet."}
      />

      <SurfaceCard title="Tradition profile" subtitle="Core metadata and lineage context">
        <div className="flex flex-wrap gap-2">
          <Badge variant="muted">{domain?.name ?? "Unknown domain"}</Badge>
          {tradition.originRegion ? <Badge variant="muted">Origin: {tradition.originRegion}</Badge> : null}
          {parentTradition ? <Badge variant="muted">Parent: {parentTradition.name}</Badge> : null}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-night-300">Thinkers</p>
            <p className="mt-1 text-lg font-semibold text-sand-100">{majorThinkers.length}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-night-300">Works</p>
            <p className="mt-1 text-lg font-semibold text-sand-100">{notableWorks.length}</p>
          </div>
          <div className="rounded-xl border border-night-700/80 bg-night-950/65 p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-night-300">Concepts</p>
            <p className="mt-1 text-lg font-semibold text-sand-100">{relatedConcepts.length}</p>
          </div>
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Major thinkers" subtitle="Foundational and major figures in this tradition">
          <div className="space-y-2">
            {majorThinkers.map((thinker) => (
              <Link
                key={thinker.slug}
                href={`/academy/thinkers/${thinker.slug}`}
                className="block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-3 hover:border-night-600 hover:bg-night-900/80"
              >
                <p className="text-sm font-medium text-sand-100">{thinker.displayName}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <CredibilityBadge value={thinker.credibilityBand} />
                </div>
              </Link>
            ))}
            {majorThinkers.length === 0 ? (
              <p className="text-sm text-night-300">No thinkers linked yet.</p>
            ) : null}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Notable works" subtitle="Texts and works associated with this tradition">
          <div className="space-y-2">
            {notableWorks.map((work) => {
              const author = getPersonForWork(work);

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
            {notableWorks.length === 0 ? (
              <p className="text-sm text-night-300">No works linked yet.</p>
            ) : null}
          </div>
        </SurfaceCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Related concepts" subtitle="Conceptual anchors frequently linked to this tradition">
          <div className="flex flex-wrap gap-2">
            {relatedConcepts.map((concept) => (
              <Link
                key={concept.slug}
                href={`/academy/concepts/${concept.slug}`}
                className="rounded-full border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
              >
                {concept.name}
              </Link>
            ))}
            {relatedConcepts.length === 0 ? (
              <p className="text-sm text-night-300">No concepts linked yet.</p>
            ) : null}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Related traditions" subtitle="Lineage and neighboring traditions in the same domain">
          <div className="space-y-2">
            {linkedTraditions.map((item) => (
              <Link
                key={item.slug}
                href={`/academy/traditions/${item.slug}`}
                className="block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-2 text-sm text-sand-100 hover:border-night-600 hover:bg-night-900/80"
              >
                {item.name}
              </Link>
            ))}
            {linkedTraditions.length === 0 ? (
              <p className="text-sm text-night-300">No related traditions linked yet.</p>
            ) : null}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
