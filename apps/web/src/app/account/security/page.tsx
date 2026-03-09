import { changePasswordAction } from "@/actions/account";
import {
  deletePasskeyAction,
  renamePasskeyAction,
  revokeDeviceAction,
  setPasskeyEnabledAction,
} from "@/actions/security";
import { PageHeader } from "@/components/dashboard/page-header";
import { PasskeyManager } from "@/components/dashboard/passkey-manager";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { TotpManager } from "@/components/dashboard/totp-manager";
import { getAccountFocusHighlightClass } from "@/lib/account-focus";
import { apiDevices, apiSecurityPasskeys, apiSecuritySettings } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";

type AccountSecurityPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

export default async function AccountSecurityPage({ searchParams }: AccountSecurityPageProps) {
  const session = await requireSession();
  const [security, passkeys, devices] = await Promise.all([
    apiSecuritySettings(session.accessToken),
    apiSecurityPasskeys(session.accessToken),
    apiDevices(session.accessToken),
  ]);

  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const saved = first(params.saved) === "1";
  const error = first(params.error);
  const focus = first(params.focus);

  return (
    <div>
      <PageHeader
        eyebrow="Security"
        title="Security"
        description="Protect your account, manage login methods, and review active sessions."
      />

      {saved ? (
        <p className="mb-3 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-sm text-sage-100">
          Security settings updated.
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Authentication methods" subtitle="Login protections for your account">
          <div className="space-y-3">
            <TotpManager
              id="totp"
              enabled={security.mfaEnabled}
              className={getAccountFocusHighlightClass(focus === "totp")}
            />
            <PasskeyManager
              id="passkeys"
              enabled={security.passkeyEnabled}
              className={getAccountFocusHighlightClass(focus === "passkeys")}
            />
            <form
              action={setPasskeyEnabledAction}
              className={cn(
                "rounded-xl border border-night-700 bg-night-950/70 p-3",
                getAccountFocusHighlightClass(focus === "passkey-policy"),
              )}
              id="passkey-policy"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-sand-100">Passkey sign-in policy</p>
                  <p className="text-xs text-night-200">Turn passkey sign-in on or off for this account.</p>
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] ${
                    security.passkeyEnabled
                      ? "border-sage-300/40 bg-sage-500/15 text-sage-100"
                      : "border-night-600 bg-night-900 text-night-200"
                  }`}
                >
                  {security.passkeyEnabled ? "ENABLED" : "DISABLED"}
                </span>
              </div>
              <input type="hidden" name="enabled" value={security.passkeyEnabled ? "false" : "true"} />
              <button
                type="submit"
                className="mt-3 rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
              >
                {security.passkeyEnabled ? "Disable passkey sign-in" : "Enable passkey sign-in"}
              </button>
            </form>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Password"
          subtitle="Update your password with current-password verification"
          className={getAccountFocusHighlightClass(focus === "password")}
        >
          <form action={changePasswordAction} className="grid gap-3" id="password">
            <input type="hidden" name="focus" value="password" />
            <label className="space-y-1 text-sm text-sand-200">
              <span>Current password</span>
              <input
                type="password"
                name="oldPassword"
                required
                autoComplete="current-password"
                autoFocus={focus === "password"}
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

        <SurfaceCard
          title="Registered passkeys"
          subtitle="Rename or revoke existing passkeys"
          className={getAccountFocusHighlightClass(focus === "passkey-list")}
        >
          <div className="space-y-2">
            {passkeys.length === 0 ? (
              <p className="rounded-lg border border-night-700 bg-night-950/70 p-3 text-xs text-night-300">
                No passkeys registered yet.
              </p>
            ) : (
              passkeys.map((passkey) => (
                <article key={passkey.id} className="rounded-lg border border-night-700 bg-night-950/70 p-3">
                  <form action={renamePasskeyAction} className="flex items-center gap-2">
                    <input type="hidden" name="passkeyId" value={passkey.id} />
                    <input
                      name="nickname"
                      defaultValue={passkey.nickname}
                      className="w-full rounded-md border border-night-700 bg-night-900 px-2 py-1 text-sm text-sand-100"
                    />
                    <button
                      type="submit"
                      className="rounded-md border border-night-600 px-2 py-1 text-xs text-sand-100 hover:border-sage-300"
                    >
                      Save
                    </button>
                  </form>
                  <p className="mt-1 text-xs text-night-300">
                    Last used: {passkey.lastUsedAt ? new Date(passkey.lastUsedAt).toLocaleString() : "Never"}
                  </p>
                  <form action={deletePasskeyAction} className="mt-2">
                    <input type="hidden" name="passkeyId" value={passkey.id} />
                    <button
                      type="submit"
                      className="rounded-md border border-rose-300/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-100 hover:bg-rose-500/20"
                    >
                      Revoke passkey
                    </button>
                  </form>
                </article>
              ))
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Active sessions and devices"
          subtitle="Review and revoke devices currently connected"
          className={getAccountFocusHighlightClass(focus === "sessions")}
        >
          <div className="space-y-2" id="sessions">
            {devices.length === 0 ? (
              <p className="rounded-lg border border-night-700 bg-night-950/70 p-3 text-xs text-night-300">
                No device sessions found.
              </p>
            ) : (
              devices.map((device) => (
                <article
                  key={device.id}
                  className={`rounded-lg border bg-night-950/70 p-3 ${
                    focus === "sessions" && device.isCurrent ? "border-sage-300/60" : "border-night-700"
                  }`}
                >
                  <p className="text-sm font-semibold text-sand-100">
                    {device.label} {device.isCurrent ? "(Current)" : ""}
                  </p>
                  <p className="mt-1 text-xs text-night-300">
                    Last seen: {new Date(device.lastSeenAt).toLocaleString()}
                  </p>
                  {!device.isCurrent && !device.isRevoked ? (
                    <form action={revokeDeviceAction} className="mt-2">
                      <input type="hidden" name="deviceId" value={device.id} />
                      <button
                        type="submit"
                        className="rounded-md border border-rose-300/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-100 hover:bg-rose-500/20"
                      >
                        Revoke device
                      </button>
                    </form>
                  ) : null}
                </article>
              ))
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
