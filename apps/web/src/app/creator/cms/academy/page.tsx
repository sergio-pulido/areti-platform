import Link from "next/link";
import {
  deleteAcademyConceptRelationAdminAction,
  deleteAcademyPersonRelationshipAdminAction,
  replaceAcademyPathItemsAdminAction,
  updateAcademyPathCurationAdminAction,
  updateAcademyPersonEditorialAdminAction,
  upsertAcademyConceptRelationAdminAction,
  upsertAcademyPersonRelationshipAdminAction,
} from "@/actions/admin-content";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { requireSession } from "@/lib/auth/session";
import { apiAdminAcademyCuration } from "@/lib/backend-api";

function summarizePathItem(item: {
  entityType: "tradition" | "person" | "work" | "concept";
  entityId: number;
  tradition: { name: string } | null;
  person: { displayName: string } | null;
  work: { title: string } | null;
  concept: { name: string } | null;
}): string {
  if (item.entityType === "tradition") {
    return item.tradition?.name ?? `Tradition #${item.entityId}`;
  }

  if (item.entityType === "person") {
    return item.person?.displayName ?? `Person #${item.entityId}`;
  }

  if (item.entityType === "work") {
    return item.work?.title ?? `Work #${item.entityId}`;
  }

  return item.concept?.name ?? `Concept #${item.entityId}`;
}

export default async function AcademyCmsPage() {
  const session = await requireSession();

  if (session.user.role !== "admin") {
    return (
      <div className="space-y-4">
        <PageHeader
          eyebrow="CMS"
          title="Academy Curation"
          description="Admin role required to edit Academy curation."
        />
        <SurfaceCard title="Access denied" subtitle="Admin role required">
          <p className="text-sm text-night-200">Your current role is {session.user.role}.</p>
        </SurfaceCard>
      </div>
    );
  }

  const curation = await apiAdminAcademyCuration(session.accessToken, 400);
  const paths = [...curation.paths].sort((a, b) => a.progressionOrder - b.progressionOrder);
  const persons = [...curation.persons].sort((a, b) => a.displayName.localeCompare(b.displayName));
  const personRelationships = [...curation.personRelationships].sort((a, b) => a.id - b.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CMS"
        title="Academy Curation"
        description="Edit path ordering, editorial metadata, and Academy relation links from one place."
        actions={
          <Link
            href="/creator/cms"
            className="inline-flex rounded-xl border border-night-700 bg-night-950/70 px-3 py-2 text-xs text-night-100 hover:border-night-600"
          >
            Back to CMS
          </Link>
        }
      />

      <SurfaceCard title="Path Ordering + Metadata" subtitle="Adjust progression and recommendation cues">
        <div className="space-y-3">
          {paths.map((path) => (
            <details key={path.id} className="rounded-xl border border-night-700 bg-night-950/70 p-3" open>
              <summary className="cursor-pointer text-sm font-semibold text-sand-100">
                {path.progressionOrder}. {path.title} ({path.slug})
              </summary>

              <form action={updateAcademyPathCurationAdminAction} className="mt-3 grid gap-2 text-xs">
                <input type="hidden" name="id" value={path.id} />
                <label className="grid gap-1">
                  <span className="text-night-300">Title</span>
                  <input
                    name="title"
                    defaultValue={path.title}
                    className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-night-300">Summary</span>
                  <textarea
                    name="summary"
                    defaultValue={path.summary}
                    rows={2}
                    className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                  />
                </label>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="grid gap-1">
                    <span className="text-night-300">Progression order</span>
                    <input
                      name="progressionOrder"
                      type="number"
                      defaultValue={path.progressionOrder}
                      className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-night-300">Recommendation weight</span>
                    <input
                      name="recommendationWeight"
                      type="number"
                      defaultValue={path.recommendationWeight}
                      className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-night-300">Tone</span>
                    <select
                      name="tone"
                      defaultValue={path.tone}
                      className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                    >
                      <option value="beginner">beginner</option>
                      <option value="intermediate">intermediate</option>
                    </select>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-night-300">Difficulty</span>
                    <select
                      name="difficultyLevel"
                      defaultValue={path.difficultyLevel}
                      className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                    >
                      <option value="beginner">beginner</option>
                      <option value="intermediate">intermediate</option>
                      <option value="advanced">advanced</option>
                    </select>
                  </label>
                </div>
                <label className="grid gap-1">
                  <span className="text-night-300">Recommendation hint</span>
                  <textarea
                    name="recommendationHint"
                    defaultValue={path.recommendationHint}
                    rows={2}
                    className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                  />
                </label>
                <label className="grid gap-1 sm:max-w-[16rem]">
                  <span className="text-night-300">Featured</span>
                  <select
                    name="isFeatured"
                    defaultValue={path.isFeatured ? "true" : "false"}
                    className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                  >
                    <option value="false">false</option>
                    <option value="true">true</option>
                  </select>
                </label>
                <button
                  type="submit"
                  className="w-fit rounded-lg border border-sage-300/40 bg-sage-500/10 px-3 py-1.5 text-xs text-sage-100 hover:bg-sage-500/20"
                >
                  Save path metadata
                </button>
              </form>

              <form action={replaceAcademyPathItemsAdminAction} className="mt-4 grid gap-2 text-xs">
                <input type="hidden" name="id" value={path.id} />
                <label className="grid gap-1">
                  <span className="text-night-300">Path items JSON</span>
                  <textarea
                    name="itemsJson"
                    rows={8}
                    defaultValue={JSON.stringify(
                      (path.items ?? []).map((item) => ({
                        entityType: item.entityType,
                        entityId: item.entityId,
                        rationale: item.rationale,
                        sortOrder: item.sortOrder,
                      })),
                      null,
                      2,
                    )}
                    className="font-mono rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-[11px] text-night-100"
                  />
                </label>
                <p className="text-[11px] text-night-300">
                  Current sequence: {(path.items ?? []).map((item) => summarizePathItem(item)).join(" -> ") || "empty"}
                </p>
                <button
                  type="submit"
                  className="w-fit rounded-lg border border-sky-300/40 bg-sky-500/10 px-3 py-1.5 text-xs text-sky-100 hover:bg-sky-500/20"
                >
                  Replace path items
                </button>
              </form>
            </details>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard title="Thinker Editorial Metadata" subtitle="Credibility/evidence/claim risk maintenance">
        <div className="space-y-3">
          {persons.map((person) => (
            <details key={person.id} className="rounded-xl border border-night-700 bg-night-950/70 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-sand-100">
                {person.displayName} ({person.slug})
              </summary>
              <form action={updateAcademyPersonEditorialAdminAction} className="mt-3 grid gap-2 text-xs">
                <input type="hidden" name="id" value={person.id} />
                <div className="grid gap-2 sm:grid-cols-3">
                  <label className="grid gap-1">
                    <span className="text-night-300">Credibility band</span>
                    <select
                      name="credibilityBand"
                      defaultValue={person.credibilityBand ?? ""}
                      className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                    >
                      <option value="">null</option>
                      <option value="foundational">foundational</option>
                      <option value="major">major</option>
                      <option value="secondary">secondary</option>
                      <option value="popularizer">popularizer</option>
                      <option value="controversial">controversial</option>
                    </select>
                  </label>

                  <label className="grid gap-1">
                    <span className="text-night-300">Evidence profile</span>
                    <input
                      name="evidenceProfile"
                      defaultValue={person.evidenceProfile ?? ""}
                      className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                    />
                  </label>

                  <label className="grid gap-1">
                    <span className="text-night-300">Claim risk</span>
                    <select
                      name="claimRiskLevel"
                      defaultValue={person.claimRiskLevel ?? ""}
                      className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                    >
                      <option value="">null</option>
                      <option value="low">low</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                    </select>
                  </label>
                </div>

                <label className="grid gap-1">
                  <span className="text-night-300">Short bio</span>
                  <textarea
                    name="bioShort"
                    rows={2}
                    defaultValue={person.bioShort ?? ""}
                    className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
                  />
                </label>

                <button
                  type="submit"
                  className="w-fit rounded-lg border border-sage-300/40 bg-sage-500/10 px-3 py-1.5 text-xs text-sage-100 hover:bg-sage-500/20"
                >
                  Save thinker metadata
                </button>
              </form>
            </details>
          ))}
        </div>
      </SurfaceCard>

      <SurfaceCard title="Relationship Maintenance" subtitle="Person and concept relation workflows">
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-sand-100">Upsert person relationship</h3>
            <form action={upsertAcademyPersonRelationshipAdminAction} className="grid gap-2 text-xs">
              <input name="id" type="number" placeholder="optional relationship id" className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100" />
              <input
                name="sourcePersonId"
                type="number"
                required
                list="academy-person-options"
                placeholder="source person id"
                className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
              />
              <input
                name="targetPersonId"
                type="number"
                required
                list="academy-person-options"
                placeholder="target person id"
                className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
              />
              <input
                name="relationshipType"
                required
                defaultValue="influenced_by"
                className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
              />
              <textarea name="notes" rows={2} placeholder="notes (optional)" className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100" />
              <button
                type="submit"
                className="w-fit rounded-lg border border-sage-300/40 bg-sage-500/10 px-3 py-1.5 text-xs text-sage-100 hover:bg-sage-500/20"
              >
                Upsert person relation
              </button>
            </form>

            <h4 className="pt-2 text-xs font-semibold uppercase tracking-[0.14em] text-night-300">Existing person relationships</h4>
            <div className="max-h-[26rem] space-y-2 overflow-auto pr-1">
              {personRelationships.map((relationship) => (
                <article key={relationship.id} className="rounded-xl border border-night-700 bg-night-950/70 px-3 py-2 text-xs text-night-100">
                  <p>
                    #{relationship.id} · {relationship.sourcePersonId}
                    {" -> "}
                    {relationship.targetPersonId} · {relationship.relationshipType}
                  </p>
                  {relationship.notes ? <p className="mt-1 text-night-300">{relationship.notes}</p> : null}
                  <form action={deleteAcademyPersonRelationshipAdminAction} className="mt-2">
                    <input type="hidden" name="id" value={relationship.id} />
                    <button type="submit" className="rounded-lg border border-rose-300/40 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-100 hover:bg-rose-500/20">
                      Delete
                    </button>
                  </form>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-sand-100">Upsert concept relation</h3>
            <form action={upsertAcademyConceptRelationAdminAction} className="grid gap-2 text-xs">
              <input
                name="conceptId"
                type="number"
                required
                list="academy-concept-options"
                placeholder="concept id"
                className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
              />
              <select
                name="entityType"
                defaultValue="tradition"
                className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
              >
                <option value="tradition">tradition</option>
                <option value="person">person</option>
                <option value="work">work</option>
              </select>
              <input
                name="entityId"
                type="number"
                required
                list="academy-entity-options"
                placeholder="entity id"
                className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
              />
              <input
                name="sortOrder"
                type="number"
                defaultValue={0}
                className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
              />
              <button
                type="submit"
                className="w-fit rounded-lg border border-sage-300/40 bg-sage-500/10 px-3 py-1.5 text-xs text-sage-100 hover:bg-sage-500/20"
              >
                Upsert concept relation
              </button>
            </form>

            <h3 className="pt-2 text-sm font-semibold text-sand-100">Delete concept relation</h3>
            <form action={deleteAcademyConceptRelationAdminAction} className="grid gap-2 text-xs">
              <input
                name="conceptId"
                type="number"
                required
                list="academy-concept-options"
                placeholder="concept id"
                className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
              />
              <select
                name="entityType"
                defaultValue="tradition"
                className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
              >
                <option value="tradition">tradition</option>
                <option value="person">person</option>
                <option value="work">work</option>
              </select>
              <input
                name="entityId"
                type="number"
                required
                list="academy-entity-options"
                placeholder="entity id"
                className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-night-100"
              />
              <button
                type="submit"
                className="w-fit rounded-lg border border-rose-300/40 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-100 hover:bg-rose-500/20"
              >
                Delete concept relation
              </button>
            </form>

            <div className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-[11px] text-night-300">
              <p>Concept-tradition links: {curation.conceptTraditionLinks.length}</p>
              <p>Concept-person links: {curation.conceptPersonLinks.length}</p>
              <p>Concept-work links: {curation.conceptWorkLinks.length}</p>
            </div>
          </div>
        </div>

        <datalist id="academy-person-options">
          {curation.persons.map((person) => (
            <option key={person.id} value={person.id} label={`${person.displayName} (${person.slug})`} />
          ))}
        </datalist>

        <datalist id="academy-concept-options">
          {curation.concepts.map((concept) => (
            <option key={concept.id} value={concept.id} label={`${concept.name} (${concept.slug})`} />
          ))}
        </datalist>

        <datalist id="academy-entity-options">
          {curation.traditions.map((tradition) => (
            <option key={`tradition-${tradition.id}`} value={tradition.id} label={`tradition · ${tradition.name}`} />
          ))}
          {curation.persons.map((person) => (
            <option key={`person-${person.id}`} value={person.id} label={`person · ${person.displayName}`} />
          ))}
          {curation.works.map((work) => (
            <option key={`work-${work.id}`} value={work.id} label={`work · ${work.title}`} />
          ))}
        </datalist>
      </SurfaceCard>
    </div>
  );
}
