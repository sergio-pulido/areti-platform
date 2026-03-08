import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { setPasskeyEnabledAction } from "@/actions/security";
import { PageHeader } from "@/components/dashboard/page-header";
import { PasskeyManager } from "@/components/dashboard/passkey-manager";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { TotpManager } from "@/components/dashboard/totp-manager";
import { apiSecuritySettings } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

export default async function AccountSecurityPage() {
  const session = await requireSession();
  const security = await apiSecuritySettings(session.accessToken);

  return (
    <div>
      <PageHeader
        eyebrow="Security"
        title="Security"
        description="Security overview, recommendations, and modern authentication controls."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Security overview" subtitle="Current authentication posture">
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

          <div className="mt-4 space-y-2 text-sm">
            <Link href="/account/password" className="block rounded-xl border border-night-700 px-3 py-2 hover:border-night-600">
              Open password controls
            </Link>
            <Link href="/account/sessions" className="block rounded-xl border border-night-700 px-3 py-2 hover:border-night-600">
              Manage sessions and devices
            </Link>
            <Link href="/account/danger" className="block rounded-xl border border-night-700 px-3 py-2 hover:border-night-600">
              Open danger zone
            </Link>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Authentication controls" subtitle="TOTP and passkey setup">
          <div className="space-y-3">
            <TotpManager enabled={security.mfaEnabled} />
            <PasskeyManager enabled={security.passkeyEnabled} />

            <form action={setPasskeyEnabledAction} className="rounded-xl border border-night-700 bg-night-950/70 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-sand-100">Passkey policy</p>
                  <p className="text-xs text-night-200">Toggle whether passkey sign-in is allowed for this account.</p>
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
      </div>
    </div>
  );
}
