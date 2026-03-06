import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { setMfaEnabledAction, setPasskeyEnabledAction } from "@/actions/security";
import { PageHeader } from "@/components/dashboard/page-header";
import { PasskeyManager } from "@/components/dashboard/passkey-manager";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { apiSecuritySettings } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await requireSession();
  const security = await apiSecuritySettings(session.accessToken);

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
              Validation + auth checks on all secured endpoints
            </li>
          </ul>

          <div className="mt-4 grid gap-3">
            <form action={setMfaEnabledAction} className="rounded-xl border border-night-700 bg-night-950/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-sand-100">Multi-factor authentication</p>
                  <p className="text-xs text-night-200">
                    {security.mfaEnabled
                      ? "MFA is active for this account."
                      : "Add a second factor during sign-in."}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] ${
                    security.mfaEnabled
                      ? "border-sage-300/40 bg-sage-500/15 text-sage-100"
                      : "border-night-600 bg-night-900 text-night-200"
                  }`}
                >
                  {security.mfaEnabled ? "ENABLED" : "DISABLED"}
                </span>
              </div>
              <input type="hidden" name="enabled" value={security.mfaEnabled ? "false" : "true"} />
              <button
                type="submit"
                className="mt-3 rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
              >
                {security.mfaEnabled ? "Disable MFA" : "Enable MFA"}
              </button>
            </form>

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
      </div>
    </div>
  );
}
