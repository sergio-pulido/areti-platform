import { InvitationsAdminPanel } from "@/components/admin/invitations-admin-panel";
import { apiAdminInvitations } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

export default async function AdminInvitationsPage() {
  const session = await requireSession();
  const data = await apiAdminInvitations(session.accessToken, {
    limit: 100,
    offset: 0,
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-night-300">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-sand-100">Invitations</h1>
        <p className="mt-2 text-sm text-night-200">Create and manage secure, single-use signup invites.</p>
      </header>

      <InvitationsAdminPanel invitations={data.items} />
    </div>
  );
}
