import Link from "next/link";
import {
  createChallengeAdminAction,
  createCommunityAdminAction,
  createEventAdminAction,
  createExpertAdminAction,
  createHighlightAdminAction,
  createLessonAdminAction,
  createPillarAdminAction,
  createPracticeAdminAction,
  createResourceAdminAction,
  createVideoAdminAction,
  deleteChallengeAdminAction,
  deleteCommunityAdminAction,
  deleteEventAdminAction,
  deleteExpertAdminAction,
  deleteHighlightAdminAction,
  deleteLessonAdminAction,
  deletePillarAdminAction,
  deletePracticeAdminAction,
  deleteResourceAdminAction,
  deleteVideoAdminAction,
  setChallengeStatusAdminAction,
  setCommunityStatusAdminAction,
  setEventStatusAdminAction,
  setExpertStatusAdminAction,
  setHighlightStatusAdminAction,
  setLessonStatusAdminAction,
  setPillarStatusAdminAction,
  setPracticeStatusAdminAction,
  setResourceStatusAdminAction,
  setVideoStatusAdminAction,
  updateChallengeAdminAction,
  updateCommunityAdminAction,
  updateEventAdminAction,
  updateExpertAdminAction,
  updateHighlightAdminAction,
  updateLessonAdminAction,
  updatePillarAdminAction,
  updatePracticeAdminAction,
  updateResourceAdminAction,
  updateVideoAdminAction,
  unlockNotificationDigestLockAdminAction,
} from "@/actions/admin-content";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  LessonFormFields,
  PracticeFormFields,
} from "@/components/dashboard/content-form-fields";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import {
  apiAdminAudit,
  apiAdminPreviewAnalytics,
  apiAdminSystemJobSummary,
  apiAdminSystemJobRuns,
  apiAdminContent,
  type ContentStatus,
} from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

type CmsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type JobRunStatusFilter = "all" | "running" | "success" | "error" | "skipped";
type JobRunDaysFilter = "all" | "1" | "7" | "30" | "90";
type FailureWindowFilter = "30" | "60" | "120" | "240";
type StaleLockFilter = "15" | "30" | "60" | "120";

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

function normalizeStatusFilter(value: string): JobRunStatusFilter {
  if (value === "running" || value === "success" || value === "error" || value === "skipped") {
    return value;
  }

  return "all";
}

function normalizeDaysFilter(value: string): JobRunDaysFilter {
  if (value === "1" || value === "7" || value === "30" || value === "90") {
    return value;
  }

  return "all";
}

function normalizeFailureWindow(value: string): FailureWindowFilter {
  if (value === "30" || value === "60" || value === "120" || value === "240") {
    return value;
  }

  return "120";
}

function normalizeStaleLock(value: string): StaleLockFilter {
  if (value === "15" || value === "30" || value === "60" || value === "120") {
    return value;
  }

  return "30";
}

function buildCmsOpsHref(filters: {
  status: JobRunStatusFilter;
  days: JobRunDaysFilter;
  failureWindow: FailureWindowFilter;
  staleLock: StaleLockFilter;
}): string {
  const params = new URLSearchParams();
  if (filters.status !== "all") {
    params.set("runStatus", filters.status);
  }
  if (filters.days !== "all") {
    params.set("runDays", filters.days);
  }
  if (filters.failureWindow !== "120") {
    params.set("failureWindow", filters.failureWindow);
  }
  if (filters.staleLock !== "30") {
    params.set("staleLock", filters.staleLock);
  }
  const qs = params.toString();
  return qs ? `/creator/cms?${qs}` : "/creator/cms";
}

function statusClasses(status: ContentStatus): string {
  return status === "PUBLISHED"
    ? "border-sage-300/40 bg-sage-500/15 text-sage-100"
    : "border-night-600 bg-night-900 text-night-200";
}

function StatusSelect() {
  return (
    <select
      name="status"
      defaultValue="DRAFT"
      className="rounded-lg border border-night-700 bg-night-950 px-2 py-1.5 text-xs text-sand-100"
    >
      <option value="DRAFT">DRAFT</option>
      <option value="PUBLISHED">PUBLISHED</option>
    </select>
  );
}

export default async function CmsPage({ searchParams }: CmsPageProps) {
  const session = await requireSession();
  const user = session.user;
  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const runStatus = normalizeStatusFilter(first(params.runStatus));
  const runDays = normalizeDaysFilter(first(params.runDays));
  const failureWindow = normalizeFailureWindow(first(params.failureWindow));
  const staleLock = normalizeStaleLock(first(params.staleLock));

  if (user.role !== "ADMIN") {
    return (
      <div>
        <PageHeader
          eyebrow="CMS"
          title="Admin Content Studio"
          description="Only admin users can manage content publishing and CRUD actions."
        />
        <SurfaceCard title="Access denied" subtitle="Admin role required">
          <p className="text-sm text-night-200">
            Your current role is <strong>{user.role}</strong>. Create the first account in a fresh
            database to bootstrap an ADMIN user.
          </p>
        </SurfaceCard>
      </div>
    );
  }

  const token = session.accessToken;
  const [content, auditLogs, previewAnalytics, systemJobSummary, systemJobRuns] = await Promise.all([
    apiAdminContent(token),
    apiAdminAudit(token, 14),
    apiAdminPreviewAnalytics(token, 30),
    apiAdminSystemJobSummary(token, {
      jobName: "notification_digest",
      failureWindowMinutes: Number(failureWindow),
      staleLockMinutes: Number(staleLock),
    }),
    apiAdminSystemJobRuns(token, {
      limit: 20,
      jobName: "notification_digest",
      status: runStatus === "all" ? undefined : runStatus,
      days: runDays === "all" ? undefined : Number(runDays),
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CMS"
        title="Admin Content Studio"
        description="Create, publish, unpublish, and delete all public content blocks from one page."
      />

      <section className="grid gap-4 xl:grid-cols-3">
        <SurfaceCard title="Recent Admin Audit Logs" subtitle="Latest privileged actions">
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <p className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-sm text-night-200">
                No privileged actions recorded yet.
              </p>
            ) : (
              auditLogs.map((item) => (
                <article
                  key={item.id}
                  className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-sand-100">{item.action}</p>
                    <span className="rounded-full border border-night-600 px-2 py-0.5 text-[10px] text-night-200">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-night-200">
                    {item.entityType}
                    {item.entityId ? ` · ${item.entityId}` : ""}
                  </p>
                </article>
              ))
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Preview Conversion (30d)" subtitle="Guest preview to signup funnel">
          <div className="grid gap-2 sm:grid-cols-2">
            <article className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-xs">
              <p className="text-night-300">Preview sessions</p>
              <p className="mt-1 text-lg font-semibold text-sand-100">
                {previewAnalytics.totals.sessionsPreviewed}
              </p>
            </article>
            <article className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-xs">
              <p className="text-night-300">Reached signup</p>
              <p className="mt-1 text-lg font-semibold text-sand-100">
                {previewAnalytics.totals.sessionsReachedSignup}
              </p>
            </article>
            <article className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-xs">
              <p className="text-night-300">Conversion rate</p>
              <p className="mt-1 text-lg font-semibold text-sand-100">
                {(previewAnalytics.totals.signupConversionRate * 100).toFixed(1)}%
              </p>
            </article>
            <article className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-xs">
              <p className="text-night-300">Tracked events</p>
              <p className="mt-1 text-lg font-semibold text-sand-100">
                {previewAnalytics.totals.events}
              </p>
            </article>
          </div>
          <p className="mt-3 text-xs text-night-300">
            page views: {previewAnalytics.countsByType.preview_page_view ?? 0} · signup clicks:{" "}
            {previewAnalytics.countsByType.preview_signup_click ?? 0} · signup views:{" "}
            {previewAnalytics.countsByType.preview_signup_view ?? 0}
          </p>
        </SurfaceCard>

        <SurfaceCard title="System Job Runs" subtitle="Recent scheduler execution telemetry">
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <article className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-xs">
              <p className="text-night-300">Health</p>
              <p
                className={`mt-1 text-base font-semibold ${
                  systemJobSummary.healthy ? "text-sage-100" : "text-amber-100"
                }`}
              >
                {systemJobSummary.healthy ? "Healthy" : "Attention needed"}
              </p>
            </article>
            <article className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-xs">
              <p className="text-night-300">Latest run age</p>
              <p className="mt-1 text-base font-semibold text-sand-100">
                {systemJobSummary.latestRunAgeMinutes === null
                  ? "n/a"
                  : `${systemJobSummary.latestRunAgeMinutes} min`}
              </p>
            </article>
            <article className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-xs">
              <p className="text-night-300">Runs (24h)</p>
              <p className="mt-1 text-base font-semibold text-sand-100">
                {systemJobSummary.runsLast24h}
              </p>
            </article>
            <article className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-xs">
              <p className="text-night-300">7d success rate</p>
              <p className="mt-1 text-base font-semibold text-sand-100">
                {(systemJobSummary.successRate7d * 100).toFixed(1)}%
              </p>
            </article>
            <article className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-xs">
              <p className="text-night-300">Last error</p>
              <p className="mt-1 text-base font-semibold text-sand-100">
                {systemJobSummary.latestErrorAt
                  ? new Date(systemJobSummary.latestErrorAt).toLocaleString()
                  : "none"}
              </p>
            </article>
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-night-300">Failure window</span>
            <Link href={buildCmsOpsHref({ status: runStatus, days: runDays, failureWindow: "30", staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              30m
            </Link>
            <Link href={buildCmsOpsHref({ status: runStatus, days: runDays, failureWindow: "60", staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              60m
            </Link>
            <Link href={buildCmsOpsHref({ status: runStatus, days: runDays, failureWindow: "120", staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              120m
            </Link>
            <Link href={buildCmsOpsHref({ status: runStatus, days: runDays, failureWindow: "240", staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              240m
            </Link>
            <span className="ml-2 text-night-300">Stale lock</span>
            <Link href={buildCmsOpsHref({ status: runStatus, days: runDays, failureWindow, staleLock: "15" })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              15m
            </Link>
            <Link href={buildCmsOpsHref({ status: runStatus, days: runDays, failureWindow, staleLock: "30" })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              30m
            </Link>
            <Link href={buildCmsOpsHref({ status: runStatus, days: runDays, failureWindow, staleLock: "60" })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              60m
            </Link>
            <Link href={buildCmsOpsHref({ status: runStatus, days: runDays, failureWindow, staleLock: "120" })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              120m
            </Link>
          </div>
          {systemJobSummary.lock.exists ? (
            <p className="mb-3 rounded-xl border border-night-700 bg-night-950/70 px-3 py-2 text-xs text-night-200">
              lock age: {systemJobSummary.lock.ageMinutes ?? "unknown"} min
              {systemJobSummary.lock.staleDetected ? " (stale)" : ""}
            </p>
          ) : null}
          {systemJobSummary.lock.staleDetected ? (
            <form action={unlockNotificationDigestLockAdminAction} className="mb-3">
              <input type="hidden" name="minAgeMinutes" value={staleLock} />
              <button
                type="submit"
                className="rounded border border-amber-300/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-100 hover:bg-amber-500/20"
              >
                Unlock stale digest lock
              </button>
            </form>
          ) : null}
          {systemJobSummary.latestErrorMessage ? (
            <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
              {systemJobSummary.latestErrorMessage}
            </p>
          ) : null}
          <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
            <span className="text-night-300">Status</span>
            <Link href={buildCmsOpsHref({ status: "all", days: runDays, failureWindow, staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              All
            </Link>
            <Link href={buildCmsOpsHref({ status: "running", days: runDays, failureWindow, staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              Running
            </Link>
            <Link href={buildCmsOpsHref({ status: "success", days: runDays, failureWindow, staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              Success
            </Link>
            <Link href={buildCmsOpsHref({ status: "error", days: runDays, failureWindow, staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              Error
            </Link>
            <Link href={buildCmsOpsHref({ status: "skipped", days: runDays, failureWindow, staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              Skipped
            </Link>
            <span className="ml-2 text-night-300">Window</span>
            <Link href={buildCmsOpsHref({ status: runStatus, days: "all", failureWindow, staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              All time
            </Link>
            <Link href={buildCmsOpsHref({ status: runStatus, days: "1", failureWindow, staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              24h
            </Link>
            <Link href={buildCmsOpsHref({ status: runStatus, days: "7", failureWindow, staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              7d
            </Link>
            <Link href={buildCmsOpsHref({ status: runStatus, days: "30", failureWindow, staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              30d
            </Link>
            <Link href={buildCmsOpsHref({ status: runStatus, days: "90", failureWindow, staleLock })} className="rounded border border-night-700 px-2 py-1 text-night-200 hover:border-night-500">
              90d
            </Link>
          </div>
          <div className="space-y-2">
            {systemJobRuns.length === 0 ? (
              <p className="rounded-xl border border-night-700 bg-night-950/70 p-3 text-sm text-night-200">
                No recorded job runs yet.
              </p>
            ) : (
              systemJobRuns.map((run) => (
                <article
                  key={run.id}
                  className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold text-sand-100">{run.jobName}</p>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] ${
                        run.status === "success"
                          ? "border-sage-300/40 bg-sage-500/15 text-sage-100"
                          : run.status === "error"
                          ? "border-amber-300/40 bg-amber-500/15 text-amber-100"
                          : "border-night-600 bg-night-900 text-night-200"
                      }`}
                    >
                      {run.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-night-300">
                    {new Date(run.startedAt).toLocaleString()}
                    {run.finishedAt ? ` -> ${new Date(run.finishedAt).toLocaleTimeString()}` : ""}
                  </p>
                  <p className="mt-1 text-night-200">
                    scanned {run.usersScanned} · digest {run.usersWithDigestEnabled} · created{" "}
                    {run.notificationsCreated} · dedupe {run.duplicatesSkipped}
                  </p>
                  {run.errorMessage ? (
                    <p className="mt-1 text-amber-200">error: {run.errorMessage}</p>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Add Lesson" subtitle="Library content">
          <form action={createLessonAdminAction} className="grid gap-2 text-sm">
            <LessonFormFields />
            <button type="submit" className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950">
              Create lesson
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Add Practice" subtitle="Practice protocol">
          <form action={createPracticeAdminAction} className="grid gap-2 text-sm">
            <PracticeFormFields />
            <button type="submit" className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950">
              Create practice
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Add Community Circle" subtitle="Community panel">
          <form action={createCommunityAdminAction} className="grid gap-2 text-sm">
            <input name="slug" required placeholder="slug" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <input name="name" required placeholder="name" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <textarea name="focus" required placeholder="focus" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" rows={3} />
            <input name="schedule" required placeholder="schedule" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <StatusSelect />
            <button type="submit" className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950">
              Create circle
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Add Challenge" subtitle="Community challenge">
          <form action={createChallengeAdminAction} className="grid gap-2 text-sm">
            <input name="slug" required placeholder="slug" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <input name="title" required placeholder="title" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <input name="duration" required placeholder="duration" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <textarea name="summary" required placeholder="summary" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" rows={3} />
            <StatusSelect />
            <button type="submit" className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950">
              Create challenge
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Add Resource" subtitle="Community resource">
          <form action={createResourceAdminAction} className="grid gap-2 text-sm">
            <input name="slug" required placeholder="slug" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <input name="title" required placeholder="title" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <textarea name="description" required placeholder="description" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" rows={3} />
            <input name="href" required placeholder="href" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <input name="cta" required placeholder="cta" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <StatusSelect />
            <button type="submit" className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950">
              Create resource
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Add Expert" subtitle="Community mentor">
          <form action={createExpertAdminAction} className="grid gap-2 text-sm">
            <input name="slug" required placeholder="slug" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <input name="name" required placeholder="name" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <textarea name="focus" required placeholder="focus" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" rows={3} />
            <StatusSelect />
            <button type="submit" className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950">
              Create expert
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Add Event" subtitle="Community calendar">
          <form action={createEventAdminAction} className="grid gap-2 text-sm">
            <input name="slug" required placeholder="slug" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <input name="title" required placeholder="title" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <input name="schedule" required placeholder="schedule" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <textarea name="summary" required placeholder="summary" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" rows={3} />
            <StatusSelect />
            <button type="submit" className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950">
              Create event
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Add Video" subtitle="Creator media">
          <form action={createVideoAdminAction} className="grid gap-2 text-sm">
            <input name="slug" required placeholder="slug" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <input name="title" required placeholder="title" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <input name="format" required placeholder="format" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <textarea name="summary" required placeholder="summary" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" rows={3} />
            <input name="videoUrl" required placeholder="videoUrl" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <StatusSelect />
            <button type="submit" className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950">
              Create video
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Add Pillar" subtitle="Landing page pillar">
          <form action={createPillarAdminAction} className="grid gap-2 text-sm">
            <input name="slug" required placeholder="slug" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <input name="title" required placeholder="title" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <textarea name="description" required placeholder="description" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" rows={3} />
            <StatusSelect />
            <button type="submit" className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950">
              Create pillar
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Add Highlight" subtitle="Landing page highlight">
          <form action={createHighlightAdminAction} className="grid gap-2 text-sm">
            <input name="slug" required placeholder="slug" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" />
            <textarea name="description" required placeholder="description" className="rounded-lg border border-night-700 bg-night-950 px-3 py-2" rows={3} />
            <StatusSelect />
            <button type="submit" className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950">
              Create highlight
            </button>
          </form>
        </SurfaceCard>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Lessons" subtitle="Publish or archive via status">
          <div className="space-y-3">
            {content.lessons.map((item) => (
              <article key={`lesson-${item.id}`} className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand-100">{item.title}</p>
                    <p className="text-night-200">{item.tradition} · {item.level} · {item.minutes} min</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <form action={setLessonStatusAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value={item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <button type="submit" className="rounded-md border border-night-600 px-2 py-1 text-xs">
                      {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deleteLessonAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="rounded-md border border-rose-300/40 px-2 py-1 text-xs text-rose-100">
                      Delete
                    </button>
                  </form>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-night-200">Edit</summary>
                  <form action={updateLessonAdminAction} className="mt-2 grid gap-1.5 text-xs">
                    <input type="hidden" name="id" value={item.id} />
                    <input name="slug" defaultValue={item.slug} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="title" defaultValue={item.title} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="tradition" defaultValue={item.tradition} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="level" defaultValue={item.level} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="minutes" type="number" min={1} defaultValue={item.minutes} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="summary" defaultValue={item.summary} rows={2} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="content" defaultValue={item.content} rows={6} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <select name="status" defaultValue={item.status} className="rounded-md border border-night-700 bg-night-900 px-2 py-1">
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                    <button type="submit" className="rounded-md border border-sage-300/40 bg-sage-500/10 px-2 py-1 text-sage-100">
                      Save lesson
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Practices" subtitle="Manage practices">
          <div className="space-y-3">
            {content.practices.map((item) => (
              <article key={`practice-${item.id}`} className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand-100">{item.title}</p>
                    <p className="text-night-200">{item.cadence}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <form action={setPracticeStatusAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value={item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <button type="submit" className="rounded-md border border-night-600 px-2 py-1 text-xs">
                      {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deletePracticeAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="rounded-md border border-rose-300/40 px-2 py-1 text-xs text-rose-100">
                      Delete
                    </button>
                  </form>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-night-200">Edit</summary>
                  <form action={updatePracticeAdminAction} className="mt-2 grid gap-1.5 text-xs">
                    <input type="hidden" name="id" value={item.id} />
                    <input name="slug" defaultValue={item.slug} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="title" defaultValue={item.title} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="description" defaultValue={item.description} rows={2} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="cadence" defaultValue={item.cadence} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="protocol" defaultValue={item.protocol} rows={6} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <select name="status" defaultValue={item.status} className="rounded-md border border-night-700 bg-night-900 px-2 py-1">
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                    <button type="submit" className="rounded-md border border-sage-300/40 bg-sage-500/10 px-2 py-1 text-sage-100">
                      Save practice
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Community" subtitle="Manage circles">
          <div className="space-y-3">
            {content.community.map((item) => (
              <article key={`community-${item.id}`} className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand-100">{item.name}</p>
                    <p className="text-night-200">{item.schedule}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <form action={setCommunityStatusAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value={item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <button type="submit" className="rounded-md border border-night-600 px-2 py-1 text-xs">
                      {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deleteCommunityAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="rounded-md border border-rose-300/40 px-2 py-1 text-xs text-rose-100">
                      Delete
                    </button>
                  </form>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-night-200">Edit</summary>
                  <form action={updateCommunityAdminAction} className="mt-2 grid gap-1.5 text-xs">
                    <input type="hidden" name="id" value={item.id} />
                    <input name="slug" defaultValue={item.slug} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="name" defaultValue={item.name} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="focus" defaultValue={item.focus} rows={2} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="schedule" defaultValue={item.schedule} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <select name="status" defaultValue={item.status} className="rounded-md border border-night-700 bg-night-900 px-2 py-1">
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                    <button type="submit" className="rounded-md border border-sage-300/40 bg-sage-500/10 px-2 py-1 text-sage-100">
                      Save community
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Pillars" subtitle="Landing hero pillars">
          <div className="space-y-3">
            {content.pillars.map((item) => (
              <article key={`pillar-${item.id}`} className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand-100">{item.title}</p>
                    <p className="text-night-200">{item.slug}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <form action={setPillarStatusAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value={item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <button type="submit" className="rounded-md border border-night-600 px-2 py-1 text-xs">
                      {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deletePillarAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="rounded-md border border-rose-300/40 px-2 py-1 text-xs text-rose-100">
                      Delete
                    </button>
                  </form>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-night-200">Edit</summary>
                  <form action={updatePillarAdminAction} className="mt-2 grid gap-1.5 text-xs">
                    <input type="hidden" name="id" value={item.id} />
                    <input name="slug" defaultValue={item.slug} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="title" defaultValue={item.title} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="description" defaultValue={item.description} rows={2} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <select name="status" defaultValue={item.status} className="rounded-md border border-night-700 bg-night-900 px-2 py-1">
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                    <button type="submit" className="rounded-md border border-sage-300/40 bg-sage-500/10 px-2 py-1 text-sage-100">
                      Save pillar
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Highlights" subtitle="Landing highlight blocks">
          <div className="space-y-3">
            {content.highlights.map((item) => (
              <article key={`highlight-${item.id}`} className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand-100">{item.slug}</p>
                    <p className="text-night-200">{item.description}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <form action={setHighlightStatusAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value={item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <button type="submit" className="rounded-md border border-night-600 px-2 py-1 text-xs">
                      {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deleteHighlightAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="rounded-md border border-rose-300/40 px-2 py-1 text-xs text-rose-100">
                      Delete
                    </button>
                  </form>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-night-200">Edit</summary>
                  <form action={updateHighlightAdminAction} className="mt-2 grid gap-1.5 text-xs">
                    <input type="hidden" name="id" value={item.id} />
                    <input name="slug" defaultValue={item.slug} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="description" defaultValue={item.description} rows={2} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <select name="status" defaultValue={item.status} className="rounded-md border border-night-700 bg-night-900 px-2 py-1">
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                    <button type="submit" className="rounded-md border border-sage-300/40 bg-sage-500/10 px-2 py-1 text-sage-100">
                      Save highlight
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Challenges" subtitle="Community challenge catalog">
          <div className="space-y-3">
            {content.challenges.map((item) => (
              <article key={`challenge-${item.id}`} className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand-100">{item.title}</p>
                    <p className="text-night-200">{item.duration}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <form action={setChallengeStatusAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value={item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <button type="submit" className="rounded-md border border-night-600 px-2 py-1 text-xs">
                      {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deleteChallengeAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="rounded-md border border-rose-300/40 px-2 py-1 text-xs text-rose-100">
                      Delete
                    </button>
                  </form>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-night-200">Edit</summary>
                  <form action={updateChallengeAdminAction} className="mt-2 grid gap-1.5 text-xs">
                    <input type="hidden" name="id" value={item.id} />
                    <input name="slug" defaultValue={item.slug} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="title" defaultValue={item.title} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="duration" defaultValue={item.duration} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="summary" defaultValue={item.summary} rows={2} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <select name="status" defaultValue={item.status} className="rounded-md border border-night-700 bg-night-900 px-2 py-1">
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                    <button type="submit" className="rounded-md border border-sage-300/40 bg-sage-500/10 px-2 py-1 text-sage-100">
                      Save challenge
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Resources" subtitle="Community resource catalog">
          <div className="space-y-3">
            {content.resources.map((item) => (
              <article key={`resource-${item.id}`} className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand-100">{item.title}</p>
                    <p className="text-night-200">{item.href}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <form action={setResourceStatusAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value={item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <button type="submit" className="rounded-md border border-night-600 px-2 py-1 text-xs">
                      {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deleteResourceAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="rounded-md border border-rose-300/40 px-2 py-1 text-xs text-rose-100">
                      Delete
                    </button>
                  </form>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-night-200">Edit</summary>
                  <form action={updateResourceAdminAction} className="mt-2 grid gap-1.5 text-xs">
                    <input type="hidden" name="id" value={item.id} />
                    <input name="slug" defaultValue={item.slug} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="title" defaultValue={item.title} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="description" defaultValue={item.description} rows={2} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="href" defaultValue={item.href} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="cta" defaultValue={item.cta} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <select name="status" defaultValue={item.status} className="rounded-md border border-night-700 bg-night-900 px-2 py-1">
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                    <button type="submit" className="rounded-md border border-sage-300/40 bg-sage-500/10 px-2 py-1 text-sage-100">
                      Save resource
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Experts" subtitle="Community mentors">
          <div className="space-y-3">
            {content.experts.map((item) => (
              <article key={`expert-${item.id}`} className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand-100">{item.name}</p>
                    <p className="text-night-200">{item.slug}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <form action={setExpertStatusAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value={item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <button type="submit" className="rounded-md border border-night-600 px-2 py-1 text-xs">
                      {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deleteExpertAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="rounded-md border border-rose-300/40 px-2 py-1 text-xs text-rose-100">
                      Delete
                    </button>
                  </form>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-night-200">Edit</summary>
                  <form action={updateExpertAdminAction} className="mt-2 grid gap-1.5 text-xs">
                    <input type="hidden" name="id" value={item.id} />
                    <input name="slug" defaultValue={item.slug} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="name" defaultValue={item.name} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="focus" defaultValue={item.focus} rows={2} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <select name="status" defaultValue={item.status} className="rounded-md border border-night-700 bg-night-900 px-2 py-1">
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                    <button type="submit" className="rounded-md border border-sage-300/40 bg-sage-500/10 px-2 py-1 text-sage-100">
                      Save expert
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Events" subtitle="Community calendar">
          <div className="space-y-3">
            {content.events.map((item) => (
              <article key={`event-${item.id}`} className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand-100">{item.title}</p>
                    <p className="text-night-200">{item.schedule}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <form action={setEventStatusAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value={item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <button type="submit" className="rounded-md border border-night-600 px-2 py-1 text-xs">
                      {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deleteEventAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="rounded-md border border-rose-300/40 px-2 py-1 text-xs text-rose-100">
                      Delete
                    </button>
                  </form>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-night-200">Edit</summary>
                  <form action={updateEventAdminAction} className="mt-2 grid gap-1.5 text-xs">
                    <input type="hidden" name="id" value={item.id} />
                    <input name="slug" defaultValue={item.slug} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="title" defaultValue={item.title} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="schedule" defaultValue={item.schedule} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="summary" defaultValue={item.summary} rows={2} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <select name="status" defaultValue={item.status} className="rounded-md border border-night-700 bg-night-900 px-2 py-1">
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                    <button type="submit" className="rounded-md border border-sage-300/40 bg-sage-500/10 px-2 py-1 text-sage-100">
                      Save event
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </SurfaceCard>

        <SurfaceCard title="Videos" subtitle="Creator media">
          <div className="space-y-3">
            {content.videos.map((item) => (
              <article key={`video-${item.id}`} className="rounded-xl border border-night-700 bg-night-950/80 p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand-100">{item.title}</p>
                    <p className="text-night-200">{item.format}</p>
                  </div>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${statusClasses(item.status)}`}>
                    {item.status}
                  </span>
                </div>
                <div className="mt-2 flex gap-2">
                  <form action={setVideoStatusAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="status" value={item.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                    <button type="submit" className="rounded-md border border-night-600 px-2 py-1 text-xs">
                      {item.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                    </button>
                  </form>
                  <form action={deleteVideoAdminAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="rounded-md border border-rose-300/40 px-2 py-1 text-xs text-rose-100">
                      Delete
                    </button>
                  </form>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-night-200">Edit</summary>
                  <form action={updateVideoAdminAction} className="mt-2 grid gap-1.5 text-xs">
                    <input type="hidden" name="id" value={item.id} />
                    <input name="slug" defaultValue={item.slug} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="title" defaultValue={item.title} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="format" defaultValue={item.format} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <textarea name="summary" defaultValue={item.summary} rows={2} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <input name="videoUrl" defaultValue={item.videoUrl} className="rounded-md border border-night-700 bg-night-900 px-2 py-1" />
                    <select name="status" defaultValue={item.status} className="rounded-md border border-night-700 bg-night-900 px-2 py-1">
                      <option value="DRAFT">DRAFT</option>
                      <option value="PUBLISHED">PUBLISHED</option>
                    </select>
                    <button type="submit" className="rounded-md border border-sage-300/40 bg-sage-500/10 px-2 py-1 text-sage-100">
                      Save video
                    </button>
                  </form>
                </details>
              </article>
            ))}
          </div>
        </SurfaceCard>
      </section>
    </div>
  );
}
