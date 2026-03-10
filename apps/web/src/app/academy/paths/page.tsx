import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { apiAcademyPaths, apiAcademyPersons } from "@/lib/backend-api";

export default async function AcademyPathsPage() {
  const [paths, persons] = await Promise.all([
    apiAcademyPaths({ includeItems: true, limit: 100 }),
    apiAcademyPersons({ limit: 500 }),
  ]);

  const personById = new Map(persons.map((person) => [person.id, person] as const));

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Academy"
        title="Guided Paths"
        description="Curated starter journeys that connect traditions, thinkers, works, and concepts into practical learning routes."
      />

      <div className="space-y-4">
        {paths.map((path) => {
          const items = path.items ?? [];
          const traditions = items.filter((item) => item.entityType === "tradition" && item.tradition);
          const thinkers = items.filter((item) => item.entityType === "person" && item.person);
          const works = items.filter((item) => item.entityType === "work" && item.work);
          const concepts = items.filter((item) => item.entityType === "concept" && item.concept);

          return (
            <SurfaceCard
              key={path.slug}
              id={path.slug}
              title={path.title}
              subtitle={path.summary}
              className="scroll-mt-28"
            >
              <div className="flex flex-wrap gap-2">
                {path.isFeatured ? <Badge variant="default">Featured</Badge> : null}
                <Badge variant="muted">{path.tone === "beginner" ? "Beginner" : "Intermediate"}</Badge>
                <Badge variant="muted">Difficulty: {path.difficultyLevel}</Badge>
                <Badge variant="muted">Step {path.progressionOrder}</Badge>
                <Badge variant="muted">{traditions.length} traditions</Badge>
                <Badge variant="muted">{thinkers.length} thinkers</Badge>
                <Badge variant="muted">{works.length} works</Badge>
                <Badge variant="muted">{concepts.length} concepts</Badge>
              </div>

              <p className="mt-3 text-sm text-night-200">{path.recommendationHint}</p>

              <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-night-300">Traditions</p>
                  <div className="mt-2 space-y-1.5">
                    {traditions.map((item) => (
                      <Link
                        key={`${path.id}-tradition-${item.tradition?.slug ?? item.id}`}
                        href={`/academy/traditions/${item.tradition?.slug}`}
                        className="block rounded-lg border border-night-700/80 bg-night-950/65 px-2 py-1.5 text-xs text-sand-100 hover:border-night-600"
                      >
                        {item.tradition?.name}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-night-300">Thinkers</p>
                  <div className="mt-2 space-y-1.5">
                    {thinkers.map((item) => (
                      <Link
                        key={`${path.id}-person-${item.person?.slug ?? item.id}`}
                        href={`/academy/thinkers/${item.person?.slug}`}
                        className="block rounded-lg border border-night-700/80 bg-night-950/65 px-2 py-1.5 text-xs text-sand-100 hover:border-night-600"
                      >
                        {item.person?.displayName}
                      </Link>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-night-300">Works</p>
                  <div className="mt-2 space-y-1.5">
                    {works.map((item) => {
                      const author = item.work?.personId !== null && item.work?.personId !== undefined
                        ? (personById.get(item.work.personId) ?? null)
                        : null;

                      return (
                        <Link
                          key={`${path.id}-work-${item.work?.slug ?? item.id}`}
                          href={`/academy/works/${item.work?.slug}`}
                          className="block rounded-lg border border-night-700/80 bg-night-950/65 px-2 py-1.5 text-xs text-sand-100 hover:border-night-600"
                        >
                          {item.work?.title}
                          <span className="ml-1 text-night-300">· {author?.displayName ?? "Unknown"}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-night-300">Concepts</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {concepts.map((item) => (
                      <Link
                        key={`${path.id}-concept-${item.concept?.slug ?? item.id}`}
                        href={`/academy/concepts/${item.concept?.slug}`}
                        className="rounded-full border border-night-700 bg-night-950/70 px-2 py-1 text-xs text-night-100 hover:border-night-600"
                      >
                        {item.concept?.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </SurfaceCard>
          );
        })}
      </div>

      {paths.length === 0 ? (
        <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
          No guided paths available yet.
        </p>
      ) : null}
    </div>
  );
}
