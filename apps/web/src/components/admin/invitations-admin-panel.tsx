"use client";

import { useActionState, useMemo, useState } from "react";
import {
  createInvitationAdminAction,
  revokeInvitationAdminAction,
} from "@/actions/admin-invitations";
import type { ApiAdminInvitation } from "@/lib/backend-api";

type InvitationsAdminPanelProps = {
  invitations: ApiAdminInvitation[];
};

function invitationStatus(invitation: ApiAdminInvitation): "active" | "used" | "expired" | "revoked" {
  if (invitation.revokedAt) {
    return "revoked";
  }
  if (invitation.usedCount >= invitation.maxUses || invitation.usedAt) {
    return "used";
  }
  if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
    return "expired";
  }
  return "active";
}

function toDatetimeLocalDefault(daysAhead: number): string {
  const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffsetMs);
  return localDate.toISOString().slice(0, 16);
}

export function InvitationsAdminPanel({ invitations }: InvitationsAdminPanelProps) {
  const [state, formAction, pending] = useActionState(
    createInvitationAdminAction,
    {},
  );
  const [copied, setCopied] = useState<"token" | "url" | null>(null);
  const defaultExpiresAt = useMemo(() => toDatetimeLocalDefault(7), []);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-night-700 bg-night-900/70 p-5">
        <h2 className="text-lg font-semibold text-sand-100">Create Invitation</h2>
        <p className="mt-1 text-sm text-night-200">Single-use invite tokens with short expiry.</p>

        <form action={formAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-night-200">
            Email (optional)
            <input
              name="email"
              type="email"
              placeholder="user@example.com"
              className="mt-1 w-full rounded-lg border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <label className="text-sm text-night-200">
            Expires at
            <input
              name="expiresAt"
              type="datetime-local"
              defaultValue={defaultExpiresAt}
              className="mt-1 w-full rounded-lg border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            />
          </label>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg border border-sage-300/40 bg-sage-500/15 px-4 py-2 text-sm font-medium text-sage-100 disabled:opacity-60"
            >
              {pending ? "Creating..." : "Create invitation"}
            </button>
          </div>
        </form>

        {state.error ? (
          <p className="mt-3 rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {state.error}
          </p>
        ) : null}

        {state.created ? (
          <div className="mt-4 rounded-xl border border-sage-300/30 bg-sage-500/10 p-4">
            <p className="text-sm font-semibold text-sage-100">Invitation created</p>
            <p className="mt-2 text-xs text-night-100">Token (shown once):</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="break-all rounded bg-night-950 px-2 py-1 text-xs text-sand-100">
                {state.created.token}
              </code>
              <button
                type="button"
                className="rounded border border-night-600 px-2 py-1 text-xs text-night-100"
                onClick={async () => {
                  await navigator.clipboard.writeText(state.created?.token ?? "");
                  setCopied("token");
                }}
              >
                Copy
              </button>
            </div>

            <p className="mt-3 text-xs text-night-100">Invite URL:</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="break-all rounded bg-night-950 px-2 py-1 text-xs text-sand-100">
                {state.created.inviteUrl}
              </code>
              <button
                type="button"
                className="rounded border border-night-600 px-2 py-1 text-xs text-night-100"
                onClick={async () => {
                  await navigator.clipboard.writeText(state.created?.inviteUrl ?? "");
                  setCopied("url");
                }}
              >
                Copy
              </button>
            </div>
            {copied ? <p className="mt-2 text-xs text-sage-100">Copied {copied}.</p> : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-night-700 bg-night-900/70 p-5">
        <h2 className="text-lg font-semibold text-sand-100">Invitations</h2>
        {invitations.length === 0 ? (
          <p className="mt-3 text-sm text-night-300">No invitations yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-night-300">
                <tr>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">Expires</th>
                  <th className="px-2 py-2">Usage</th>
                  <th className="px-2 py-2">Created</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => {
                  const status = invitationStatus(invitation);
                  const canRevoke = status === "active";

                  return (
                    <tr key={invitation.id} className="border-t border-night-800 text-night-100">
                      <td className="px-2 py-2 capitalize">{status}</td>
                      <td className="px-2 py-2">{invitation.email ?? "Any email"}</td>
                      <td className="px-2 py-2">{new Date(invitation.expiresAt).toLocaleString()}</td>
                      <td className="px-2 py-2">
                        {invitation.usedCount}/{invitation.maxUses}
                      </td>
                      <td className="px-2 py-2">{new Date(invitation.createdAt).toLocaleString()}</td>
                      <td className="px-2 py-2">
                        {canRevoke ? (
                          <form action={revokeInvitationAdminAction}>
                            <input type="hidden" name="invitationId" value={invitation.id} />
                            <button
                              type="submit"
                              className="rounded border border-rose-300/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                            >
                              Revoke
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-night-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
