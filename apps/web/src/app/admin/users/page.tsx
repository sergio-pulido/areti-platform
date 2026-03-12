import { apiAdminUsers } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

type AdminUsersPageProps = {
  searchParams?: Promise<{
    q?: string;
    offset?: string;
    limit?: string;
  }>;
};

function toPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const session = await requireSession();
  const params = (await searchParams) ?? {};
  const limit = Math.min(100, Math.max(1, toPositiveInteger(params.limit, 50)));
  const offset = toPositiveInteger(params.offset, 0);
  const q = params.q?.trim();

  const data = await apiAdminUsers(session.accessToken, {
    limit,
    offset,
    q,
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-night-300">Admin</p>
        <h1 className="mt-2 text-3xl font-semibold text-sand-100">Users</h1>
        <p className="mt-2 text-sm text-night-200">Operational user directory with role and verification state.</p>
      </header>

      <form method="get" className="rounded-2xl border border-night-700 bg-night-900/70 p-4">
        <label className="text-sm text-night-200">
          Search by name or email
          <input
            name="q"
            defaultValue={q ?? ""}
            className="mt-1 w-full rounded-lg border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
          />
        </label>
        <input type="hidden" name="limit" value={String(limit)} />
        <button
          type="submit"
          className="mt-3 rounded-lg border border-night-600 px-3 py-2 text-sm text-night-100"
        >
          Search
        </button>
      </form>

      {data.items.length === 0 ? (
        <p className="rounded-xl border border-night-700 bg-night-900/70 px-4 py-3 text-sm text-night-300">
          No users found.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-night-700 bg-night-900/70 p-4">
          <table className="min-w-full text-left text-sm">
            <thead className="text-night-300">
              <tr>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Username</th>
                <th className="px-2 py-2">Verified</th>
                <th className="px-2 py-2">Role</th>
                <th className="px-2 py-2">Plan</th>
                <th className="px-2 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((user) => (
                <tr key={user.id} className="border-t border-night-800 text-night-100">
                  <td className="px-2 py-2">{user.name}</td>
                  <td className="px-2 py-2">{user.email}</td>
                  <td className="px-2 py-2">{user.username ?? "-"}</td>
                  <td className="px-2 py-2">{user.emailVerified ? "yes" : "no"}</td>
                  <td className="px-2 py-2">{user.role}</td>
                  <td className="px-2 py-2">{user.plan ?? "-"}</td>
                  <td className="px-2 py-2">{new Date(user.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-night-300">
        <p>
          Showing {data.items.length} of {data.pagination.total}
        </p>
        <div className="flex gap-2">
          {offset > 0 ? (
            <a
              className="rounded border border-night-600 px-2 py-1 text-night-100"
              href={`/admin/users?${new URLSearchParams({
                limit: String(limit),
                offset: String(Math.max(0, offset - limit)),
                ...(q ? { q } : {}),
              }).toString()}`}
            >
              Previous
            </a>
          ) : null}
          {offset + limit < data.pagination.total ? (
            <a
              className="rounded border border-night-600 px-2 py-1 text-night-100"
              href={`/admin/users?${new URLSearchParams({
                limit: String(limit),
                offset: String(offset + limit),
                ...(q ? { q } : {}),
              }).toString()}`}
            >
              Next
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
