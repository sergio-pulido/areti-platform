import { changePasswordAction } from "@/actions/account";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

type AccountPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

export default async function AccountPasswordPage({ searchParams }: AccountPasswordPageProps) {
  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const saved = first(params.saved) === "1";
  const error = first(params.error);

  return (
    <div>
      <PageHeader
        eyebrow="Security"
        title="Password"
        description="Change your account password with current-password verification."
      />

      {saved ? (
        <p className="mb-3 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-sm text-sage-100">
          Password updated successfully.
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <SurfaceCard title="Change password" subtitle="Current password is required to confirm this operation">
        <form action={changePasswordAction} className="grid gap-3 md:max-w-xl">
          <label className="space-y-1 text-sm text-sand-200">
            <span>Current password</span>
            <input
              type="password"
              name="oldPassword"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <label className="space-y-1 text-sm text-sand-200">
            <span>New password</span>
            <input
              type="password"
              name="newPassword"
              required
              autoComplete="new-password"
              minLength={10}
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <label className="space-y-1 text-sm text-sand-200">
            <span>Confirm new password</span>
            <input
              type="password"
              name="confirmPassword"
              required
              autoComplete="new-password"
              minLength={10}
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <button
            type="submit"
            className="w-fit rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
          >
            Update password
          </button>
        </form>
      </SurfaceCard>
    </div>
  );
}
