import Link from "next/link";
import { deleteAccountAction } from "@/actions/account";
import { logoutAction } from "@/actions/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { requireSession } from "@/lib/auth/session";

type AccountPrivacyPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

export default async function AccountPrivacyPage({ searchParams }: AccountPrivacyPageProps) {
  const session = await requireSession();
  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const error = first(params.error);

  return (
    <div>
      <PageHeader
        eyebrow="Privacy"
        title="Privacy"
        description="Control your data, connected services, and account lifecycle."
      />

      {error ? (
        <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Data controls" subtitle="Download, retention, and account-level data settings">
          <p className="text-sm text-night-200">
            Data export and granular retention controls are planned but not enabled yet.
          </p>
          <button
            type="button"
            disabled
            className="mt-3 rounded-lg border border-night-700 bg-night-900 px-3 py-1.5 text-xs text-night-200 opacity-70"
          >
            Request data export (coming soon)
          </button>
        </SurfaceCard>

        <SurfaceCard title="Legal and policy" subtitle="Canonical legal documents for your account">
          <div className="space-y-2 text-sm">
            <Link
              href="/legal/privacy"
              className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600"
            >
              Privacy policy
            </Link>
            <Link
              href="/legal/terms"
              className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600"
            >
              Terms and conditions
            </Link>
            <Link
              href="/legal/cookies"
              className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600"
            >
              Cookie policy
            </Link>
          </div>
        </SurfaceCard>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2" id="deletion">
        <SurfaceCard title="Logout from this device" subtitle="End the current session without deleting your account">
          <p className="text-sm text-night-200">
            Use this if you only want to leave this device.
          </p>
          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="rounded-xl border border-night-700 bg-night-900 px-3 py-2 text-sm text-sand-100 hover:border-night-600"
            >
              Logout
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Delete account" subtitle="Permanent account deletion and anonymization">
          <p className="text-sm text-night-200">
            This action permanently anonymizes your profile and revokes all active sessions.
          </p>

          <form action={deleteAccountAction} className="mt-4 space-y-3">
            <label className="space-y-1 text-sm text-sand-200">
              <span>Confirm your email</span>
              <input
                name="emailConfirm"
                required
                defaultValue={session.user.email}
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              />
            </label>

            <label className="space-y-1 text-sm text-sand-200">
              <span>Confirm your password</span>
              <input
                type="password"
                name="passwordConfirm"
                required
                autoComplete="current-password"
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              />
            </label>

            <button
              type="submit"
              className="rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-100 hover:bg-rose-500/20"
            >
              Delete account permanently
            </button>
          </form>
        </SurfaceCard>
      </div>
    </div>
  );
}
