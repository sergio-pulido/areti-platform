import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { getAcademyPaths, getPersonForWork } from "@/lib/academy/knowledge-service";

export default function AcademyPathsPage() {
  const paths = getAcademyPaths();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academy"
        title="Guided Paths"
        description="Curated starter journeys that connect traditions, thinkers, works, and concepts into practical learning routes."
      />

      <div className="space-y-4">
        {paths.map((path) => (
          <SurfaceCard
            key={path.slug}
            id={path.slug}
            title={path.title}
            subtitle={path.summary}
            className="scroll-mt-28"
          >
            <div className="flex flex-wrap gap-2">
              <Badge variant="muted">{path.tone === "beginner" ? "Beginner" : "Intermediate"}</Badge>
              <Badge variant="muted">{path.traditions.length} traditions</Badge>
              <Badge variant="muted">{path.persons.length} thinkers</Badge>
              <Badge variant="muted">{path.works.length} works</Badge>
              <Badge variant="muted">{path.concepts.length} concepts</Badge>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-night-300">Traditions</p>
                <div className="mt-2 space-y-1.5">
                  {path.traditions.map((tradition) => (
                    <Link
                      key={tradition.slug}
                      href={`/academy/traditions/${tradition.slug}`}
                      className="block rounded-lg border border-night-700/80 bg-night-950/65 px-2 py-1.5 text-xs text-sand-100 hover:border-night-600"
                    >
                      {tradition.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-night-300">Thinkers</p>
                <div className="mt-2 space-y-1.5">
                  {path.persons.map((person) => (
                    <Link
                      key={person.slug}
                      href={`/academy/thinkers/${person.slug}`}
                      className="block rounded-lg border border-night-700/80 bg-night-950/65 px-2 py-1.5 text-xs text-sand-100 hover:border-night-600"
                    >
                      {person.displayName}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-night-300">Works</p>
                <div className="mt-2 space-y-1.5">
                  {path.works.map((work) => (
                    <Link
                      key={work.slug}
                      href={`/academy/works/${work.slug}`}
                      className="block rounded-lg border border-night-700/80 bg-night-950/65 px-2 py-1.5 text-xs text-sand-100 hover:border-night-600"
                    >
                      {work.title}
                      <span className="ml-1 text-night-300">· {getPersonForWork(work)?.displayName ?? "Unknown"}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-night-300">Concepts</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {path.concepts.map((concept) => (
                    <Link
                      key={concept.slug}
                      href={`/academy/concepts/${concept.slug}`}
                      className="rounded-full border border-night-700 bg-night-950/70 px-2 py-1 text-xs text-night-100 hover:border-night-600"
                    >
                      {concept.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </SurfaceCard>
        ))}
      </div>

      {paths.length === 0 ? (
        <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
          No guided paths available yet.
        </p>
      ) : null}
    </div>
  );
}
