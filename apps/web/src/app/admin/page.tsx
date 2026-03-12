import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { apiAdminOverview } from "@/lib/backend-api";

function formatPercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%";
  }
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}

function toneClass(value: number): string {
  if (value <= 0) {
    return "text-sage-100";
  }
  if (value <= 3) {
    return "text-amber-200";
  }
  return "text-rose-200";
}

export default async function AdminOverviewPage() {
  const session = await requireSession();
  const overview = await apiAdminOverview(session.accessToken);
  const verificationRate =
    overview.users.total === 0
      ? 0
      : (overview.users.verified / overview.users.total) * 100;
  const attentionCount =
    overview.users.unverified +
    overview.invitations.expiringSoon +
    overview.invitations.expired;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-night-300">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-sand-100">Control panel</h1>
        <p className="mt-2 text-sm text-night-200">
          Operational snapshot for access control, invitation health, and immediate follow-ups.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-night-700 bg-night-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-night-300">Total users</p>
          <p className="mt-2 text-3xl font-semibold text-sand-100">{overview.users.total}</p>
          <p className="mt-2 text-xs text-night-300">
            {overview.users.createdLast7Days} new in the last 7 days
          </p>
        </article>

        <article className="rounded-2xl border border-night-700 bg-night-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-night-300">Verification rate</p>
          <p className="mt-2 text-3xl font-semibold text-sand-100">{formatPercent(verificationRate)}</p>
          <p className="mt-2 text-xs text-night-300">
            {overview.users.verified} verified / {overview.users.unverified} pending
          </p>
        </article>

        <article className="rounded-2xl border border-night-700 bg-night-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-night-300">Active invites</p>
          <p className="mt-2 text-3xl font-semibold text-sand-100">{overview.invitations.active}</p>
          <p className="mt-2 text-xs text-night-300">
            {overview.invitations.createdLast7Days} created / {overview.invitations.redeemedLast7Days} redeemed (7d)
          </p>
        </article>

        <article className="rounded-2xl border border-night-700 bg-night-900/70 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-night-300">Needs attention</p>
          <p className={`mt-2 text-3xl font-semibold ${toneClass(attentionCount)}`}>{attentionCount}</p>
          <p className="mt-2 text-xs text-night-300">
            {overview.invitations.expiringSoon} expiring soon · {overview.invitations.expired} expired
          </p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-night-700 bg-night-900/70 p-5">
          <h2 className="text-lg font-semibold text-sand-100">Summary</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-night-700 bg-night-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-night-300">Roles</p>
              <p className="mt-2 text-sm text-night-100">
                {overview.users.admins} admins / {overview.users.nonAdmins} users
              </p>
            </div>
            <div className="rounded-xl border border-night-700 bg-night-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-night-300">Invite lifecycle</p>
              <p className="mt-2 text-sm text-night-100">
                {overview.invitations.used} used · {overview.invitations.revoked} revoked · {overview.invitations.expired} expired
              </p>
            </div>
            <div className="rounded-xl border border-night-700 bg-night-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-night-300">Issued invitations</p>
              <p className="mt-2 text-sm text-night-100">{overview.invitations.total} total</p>
            </div>
            <div className="rounded-xl border border-night-700 bg-night-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-night-300">Verification backlog</p>
              <p className={`mt-2 text-sm ${toneClass(overview.users.unverified)}`}>
                {overview.users.unverified} users pending
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-night-700 bg-night-900/70 p-5">
          <h2 className="text-lg font-semibold text-sand-100">Tips</h2>
          <ul className="mt-4 space-y-3 text-sm text-night-100">
            <li className="rounded-xl border border-night-700 bg-night-950/70 px-4 py-3">
              Keep invites short-lived and email-bound when possible.
            </li>
            <li className="rounded-xl border border-night-700 bg-night-950/70 px-4 py-3">
              Revoke stale invites with no owner context before they expire.
            </li>
            <li className="rounded-xl border border-night-700 bg-night-950/70 px-4 py-3">
              Review unverified accounts regularly to detect onboarding friction.
            </li>
            <li className="rounded-xl border border-night-700 bg-night-950/70 px-4 py-3">
              Keep admin privileges limited and review promotions in audit logs.
            </li>
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-night-700 bg-night-900/70 p-5">
        <h2 className="text-lg font-semibold text-sand-100">Priority actions</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Link
            href="/admin/invitations"
            className="rounded-xl border border-night-700 bg-night-950/70 px-4 py-3 text-sm text-night-100 transition hover:border-night-600"
          >
            Review invitations ({overview.invitations.active} active)
          </Link>
          <Link
            href="/admin/users"
            className="rounded-xl border border-night-700 bg-night-950/70 px-4 py-3 text-sm text-night-100 transition hover:border-night-600"
          >
            Review verification backlog ({overview.users.unverified} pending)
          </Link>
          <Link
            href="/admin/roles"
            className="rounded-xl border border-night-700 bg-night-950/70 px-4 py-3 text-sm text-night-100 transition hover:border-night-600"
          >
            Roles policy (coming soon)
          </Link>
        </div>
      </section>
    </div>
  );
}
