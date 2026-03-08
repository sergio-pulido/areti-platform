import { AlertTriangle } from "lucide-react";
import { deleteAccountAction } from "@/actions/account";
import { logoutAction } from "@/actions/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { requireSession } from "@/lib/auth/session";

type AccountDangerPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

export default async function AccountDangerPage({ searchParams }: AccountDangerPageProps) {
  const session = await requireSession();
  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const error = first(params.error);

  return (
    <div>
      <PageHeader
        eyebrow="Security"
        title="Danger Zone"
        description="Irreversible account actions. Deletion performs anonymization and immediate session revocation."
      />

      {error ? (
        <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Delete account" subtitle="This action cannot be undone">
          <p className="flex items-start gap-2 text-sm text-amber-100">
            <AlertTriangle size={14} className="mt-0.5 text-amber-300" />
            Your account will be soft-deleted, anonymized, and signed out from all sessions.
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

        <SurfaceCard title="Session teardown" subtitle="Non-destructive sign-out">
          <p className="text-sm text-night-200">
            If you only need to leave this device, use standard logout.
          </p>
          <form action={logoutAction} className="mt-4">
            <button
              type="submit"
              className="rounded-xl border border-night-700 bg-night-900 px-3 py-2 text-sm text-sand-100 hover:border-night-600"
            >
              Logout from this device
            </button>
          </form>
        </SurfaceCard>
      </div>
    </div>
  );
}
