import Link from "next/link";
import { logoutAction } from "@/actions/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { requireUser } from "@/lib/auth/session";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile & Access"
        description="Your identity, role, and exit controls for this workspace."
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_0.75fr]">
        <SurfaceCard title="Account details" subtitle="Current authenticated user">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-night-300">Name</dt>
              <dd className="text-sand-100">{user.name}</dd>
            </div>
            <div>
              <dt className="text-night-300">Email</dt>
              <dd className="text-sand-100">{user.email}</dd>
            </div>
            <div>
              <dt className="text-night-300">Role</dt>
              <dd className="text-sand-100">{user.role}</dd>
            </div>
          </dl>
        </SurfaceCard>

        <SurfaceCard title="Session actions" subtitle="Account and legal controls">
          <div className="space-y-2 text-sm">
            <Link href="/dashboard/settings" className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600">
              Open security settings
            </Link>
            <Link href="/legal/privacy" className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600">
              Privacy policy
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-xl border border-rose-300/40 bg-rose-500/10 px-3 py-2 text-left text-rose-100 hover:bg-rose-500/20"
              >
                Logout from this device
              </button>
            </form>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
