import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkAuthorityBadge } from "@/components/academy/academy-metadata-badges";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import {
  getPersonForWork,
  getRelatedConceptsForWork,
  getRelatedWorks,
  getTraditionForWork,
  getWorkBySlug,
} from "@/lib/academy/knowledge-service";

type WorkDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { slug } = await params;
  const work = getWorkBySlug(slug);

  if (!work) {
    notFound();
  }

  const author = getPersonForWork(work);
  const tradition = getTraditionForWork(work);
  const relatedConcepts = getRelatedConceptsForWork(work.id);
  const relatedWorks = getRelatedWorks(work, 6);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academy · Work"
        title={work.title}
        description={work.summaryShort ?? "No summary available for this work yet."}
      />

      <SurfaceCard title="Work profile" subtitle="Editorial and bibliographic context">
        <div className="flex flex-wrap gap-2">
          {author ? <Badge variant="muted">Author: {author.displayName}</Badge> : null}
          {tradition ? <Badge variant="muted">Tradition: {tradition.name}</Badge> : null}
          {work.workType ? <Badge variant="muted">Type: {work.workType}</Badge> : null}
          {work.publicationYear !== null ? <Badge variant="muted">Year: {work.publicationYear}</Badge> : null}
        </div>
        <div className="mt-3">
          <WorkAuthorityBadge isPrimaryText={work.isPrimaryText} />
        </div>
      </SurfaceCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Related concepts" subtitle="Conceptual anchors linked to this work">
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

        <SurfaceCard title="Related works" subtitle="Connected by author or tradition">
          <div className="space-y-2">
            {relatedWorks.map((candidate) => (
              <Link
                key={candidate.slug}
                href={`/academy/works/${candidate.slug}`}
                className="block rounded-xl border border-night-700/80 bg-night-950/65 px-3 py-2 text-sm text-sand-100 hover:border-night-600 hover:bg-night-900/80"
              >
                {candidate.title}
              </Link>
            ))}
            {relatedWorks.length === 0 ? <p className="text-sm text-night-300">No related works linked yet.</p> : null}
          </div>
        </SurfaceCard>
      </div>

      {author ? (
        <SurfaceCard title="Related thinker" subtitle="Jump to thinker context and influence graph">
          <Link
            href={`/academy/thinkers/${author.slug}`}
            className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
          >
            Open thinker profile
          </Link>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
