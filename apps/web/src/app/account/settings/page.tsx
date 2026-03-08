import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import {
  deletePasskeyAction,
  renamePasskeyAction,
  revokeDeviceAction,
  setCompanionPreferencesAction,
  setPasskeyEnabledAction,
} from "@/actions/security";
import { PageHeader } from "@/components/dashboard/page-header";
import { PasskeyManager } from "@/components/dashboard/passkey-manager";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { TotpManager } from "@/components/dashboard/totp-manager";
import {
  apiChatPreferences,
  apiDevices,
  apiSecurityPasskeys,
  apiSecuritySettings,
} from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await requireSession();
  const [security, passkeys, devices, companionPreferences] = await Promise.all([
    apiSecuritySettings(session.accessToken),
    apiSecurityPasskeys(session.accessToken),
    apiDevices(session.accessToken),
    apiChatPreferences(session.accessToken),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Security & Preferences"
        description="Manage your account posture, legal settings, and dashboard behavior."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Authentication posture" subtitle="Modern controls and session hardening">
          <ul className="space-y-3 text-sm text-night-200">
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-sage-200" />
              Argon2id password hashing
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-sage-200" />
              Access + refresh session token model
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-sage-200" />
              TOTP MFA and passkey lifecycle controls
            </li>
          </ul>

          <div className="mt-4 grid gap-3">
            <TotpManager enabled={security.mfaEnabled} />

            <PasskeyManager enabled={security.passkeyEnabled} />

            <form action={setPasskeyEnabledAction} className="rounded-xl border border-night-700 bg-night-950/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-sand-100">Passkey policy</p>
                  <p className="text-xs text-night-200">
                    Toggle whether passkey sign-in is allowed for this account.
                  </p>
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
              <input
                type="hidden"
                name="enabled"
                value={security.passkeyEnabled ? "false" : "true"}
              />
              <button
                type="submit"
                className="mt-3 rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
              >
                {security.passkeyEnabled ? "Disable passkey sign-in" : "Enable passkey sign-in"}
              </button>
            </form>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Passkeys & Sessions" subtitle="Operational account controls">
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-night-300">Registered passkeys</p>
              <div className="mt-2 space-y-2">
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
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-night-300">Active devices</p>
              <div className="mt-2 space-y-2">
                {devices.length === 0 ? (
                  <p className="rounded-lg border border-night-700 bg-night-950/70 p-3 text-xs text-night-300">
                    No device sessions found.
                  </p>
                ) : (
                  devices.map((device) => (
                    <article key={device.id} className="rounded-lg border border-night-700 bg-night-950/70 p-3">
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
            </div>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Compliance" subtitle="Transparent legal pages">
          <div className="space-y-2 text-sm">
            <Link href="/account/privacy" className="flex items-center gap-2 text-sand-100 hover:text-sage-100">
              <Lock size={14} />
              Privacy Policy
            </Link>
            <Link href="/account/terms" className="flex items-center gap-2 text-sand-100 hover:text-sage-100">
              <Lock size={14} />
              Terms of Service
            </Link>
            <Link href="/account/cookies" className="flex items-center gap-2 text-sand-100 hover:text-sage-100">
              <Lock size={14} />
              Cookie Policy
            </Link>
          </div>
        </SurfaceCard>

        <SurfaceCard
          title="Companion preferences"
          subtitle="Customize how your personal Companion responds"
        >
          <form action={setCompanionPreferencesAction} className="space-y-3">
            <label htmlFor="customInstructions" className="text-sm text-sand-200">
              Personal instructions
            </label>
            <textarea
              id="customInstructions"
              name="customInstructions"
              defaultValue={companionPreferences.customInstructions}
              maxLength={1500}
              rows={6}
              className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none"
              placeholder="Example: Keep answers concise, challenge my blind spots, and end with one practical action."
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-night-300">
                This addendum is applied after Ataraxia&apos;s global philosophy prompt.
              </p>
              <p className="text-xs text-night-300">
                {companionPreferences.customInstructions.length}/1500
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
              >
                Save preferences
              </button>
              <button
                type="submit"
                name="customInstructions"
                value=""
                className="rounded-lg border border-night-700 bg-night-950 px-3 py-1.5 text-xs text-night-200 hover:border-night-500"
              >
                Reset to default
              </button>
            </div>
          </form>
        </SurfaceCard>
      </div>
    </div>
  );
}
