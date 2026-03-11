import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { PracticeProtocolCard } from "@/components/dashboard/practice-protocol-card";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { Badge } from "@/components/ui/badge";
import { apiProgressCompletions } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";
import { fetchPracticeRoutines } from "@/lib/content-api";

type PracticesPageProps = {
  searchParams: Promise<{ path?: string }>;
};

type PracticePathKey = "daily" | "focus" | "evening";

function normalizePracticePath(value: string | undefined): PracticePathKey | null {
  if (value === "daily" || value === "focus" || value === "evening") {
    return value;
  }

  return null;
}

function matchesPracticePath(path: PracticePathKey | null, routine: { slug: string; cadence: string; title: string }): boolean {
  if (!path) {
    return true;
  }

  const normalizedTitle = routine.title.toLowerCase();
  const normalizedSlug = routine.slug.toLowerCase();
  const normalizedCadence = routine.cadence.toLowerCase();

  if (path === "daily") {
    return normalizedCadence.includes("daily");
  }

  if (path === "focus") {
    return normalizedCadence.includes("20 min") || normalizedCadence.includes("15 min");
  }

  return normalizedTitle.includes("evening") || normalizedSlug.includes("evening");
}

function buildPracticePathHref(path: PracticePathKey | "all"): string {
  if (path === "all") {
    return "/practices";
  }

  return `/practices?path=${path}`;
}

export default async function PracticesPage({ searchParams }: PracticesPageProps) {
  const session = await requireSession();
  const params = await searchParams;
  const activePath = normalizePracticePath(params.path?.trim());
  const [routines, completions] = await Promise.all([
    fetchPracticeRoutines(),
    apiProgressCompletions(session.accessToken, 500),
  ]);
  const visibleRoutines = routines.filter((routine) => matchesPracticePath(activePath, routine));
  const isAdmin = session.user.role === "admin";
  const practiceCompletions = completions.filter((item) => item.contentKind === "practice");
  const completedPracticeSlugs = new Set(practiceCompletions.map((item) => item.contentSlug));
  const recommendedNextPractice =
    visibleRoutines.find((routine) => !completedPracticeSlugs.has(routine.slug)) ?? null;
  const completedPracticesCount = visibleRoutines.filter((routine) => completedPracticeSlugs.has(routine.slug)).length;

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Practices"
        title="Your Daily Protocols"
        description="Rituals designed for mental resilience, calm pleasure, and strategic action."
        actions={
          isAdmin ? (
            <Link
              href="/practices/new"
              className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              New protocol
            </Link>
          ) : null
        }
      />

      <div className="flex items-center gap-2">
        <Badge variant="muted">{routines.length} protocols</Badge>
        <Badge variant="muted">{visibleRoutines.length} visible</Badge>
        <Badge variant="default">{completedPracticesCount} completed</Badge>
        {activePath ? <Badge variant="success">Path: {activePath}</Badge> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={buildPracticePathHref("all")}
          className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
        >
          Full protocol set
        </Link>
        <Link
          href={buildPracticePathHref("daily")}
          className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
        >
          Daily reset
        </Link>
        <Link
          href={buildPracticePathHref("focus")}
          className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
        >
          Focus block
        </Link>
        <Link
          href={buildPracticePathHref("evening")}
          className="rounded-lg border border-night-700 bg-night-950/70 px-3 py-1.5 text-xs text-night-100 hover:border-night-600"
        >
          Evening close
        </Link>
      </div>

      <SurfaceCard
        title="Practice path"
        subtitle={
          recommendedNextPractice
            ? `Recommended next: ${recommendedNextPractice.title}`
            : "All protocols in this list are completed"
        }
      >
        <p className="text-sm text-night-200">
          Build consistency by repeating short practices across the week, then log one reflection after each run.
        </p>
      </SurfaceCard>

      <div className="grid gap-4 md:grid-cols-2" aria-label="Practice protocols">
        {visibleRoutines.map((routine) => (
          <PracticeProtocolCard
            key={routine.slug}
            routine={routine}
            completed={completedPracticeSlugs.has(routine.slug)}
            recommended={recommendedNextPractice?.slug === routine.slug}
          />
        ))}
        {visibleRoutines.length === 0 ? (
          <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
            No practices found in API content.
          </p>
        ) : null}
      </div>
    </div>
  );
}
