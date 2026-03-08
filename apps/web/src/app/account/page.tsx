import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Bot,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import {
  apiDevices,
  apiMe,
  apiNotifications,
  apiSecurityPasskeys,
  apiSecuritySettings,
} from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

export default async function AccountPage() {
  const session = await requireSession();
  const [me, security, passkeys, devices, notifications] = await Promise.all([
    apiMe(session.accessToken),
    apiSecuritySettings(session.accessToken),
    apiSecurityPasskeys(session.accessToken),
    apiDevices(session.accessToken),
    apiNotifications(session.accessToken, 20),
  ]);

  const activeDevices = devices.filter((device) => !device.isRevoked);
  const currentDevice = activeDevices.find((device) => device.isCurrent) ?? null;
  const emailVerified = Boolean(me.user.emailVerifiedAt);

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Account Overview"
        description="Manage profile identity, security posture, device sessions, and preferences."
        actions={
          <Link
            href="/account/security"
            className="inline-flex items-center gap-2 rounded-xl border border-night-700 bg-night-900/80 px-3 py-2 text-xs text-sand-100 hover:border-night-600"
          >
            Open Security
            <ArrowRight size={13} />
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Identity profile" subtitle="Primary account details and visibility defaults">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-night-300">Name</dt>
              <dd className="text-sand-100">{me.user.name}</dd>
            </div>
            <div>
              <dt className="text-night-300">Email</dt>
              <dd className="text-sand-100">{me.user.email}</dd>
            </div>
            <div>
              <dt className="text-night-300">Username</dt>
              <dd className="text-sand-100">{me.profile.username ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-night-300">Language / Timezone</dt>
              <dd className="text-sand-100">
                {me.preferences.language.toUpperCase()} / {me.preferences.timezone}
              </dd>
            </div>
            <div>
              <dt className="text-night-300">Verification</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border px-2 py-1 text-[10px] ${
                    emailVerified
                      ? "border-sage-300/40 bg-sage-500/15 text-sage-100"
                      : "border-amber-300/40 bg-amber-500/10 text-amber-100"
                  }`}
                >
                  {emailVerified ? "EMAIL VERIFIED" : "EMAIL VERIFICATION PENDING"}
                </span>
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/account/profile"
              className="inline-flex items-center gap-2 rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
            >
              <UserCircle2 size={13} />
              Edit profile
            </Link>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Security snapshot" subtitle="Authentication and session health">
          <ul className="space-y-3 text-sm">
            <li className="flex items-start justify-between gap-3 rounded-xl border border-night-700 bg-night-950/70 px-3 py-2">
              <span className="flex items-center gap-2 text-sand-100">
                <CheckCircle2 size={14} className="text-sage-200" />
                Email verification
              </span>
              <span className="text-xs text-night-200">{emailVerified ? "Verified" : "Pending"}</span>
            </li>
            <li className="flex items-start justify-between gap-3 rounded-xl border border-night-700 bg-night-950/70 px-3 py-2">
              <span className="flex items-center gap-2 text-sand-100">
                <ShieldCheck size={14} className="text-sage-200" />
                TOTP MFA
              </span>
              <span className="text-xs text-night-200">{security.mfaEnabled ? "Enabled" : "Disabled"}</span>
            </li>
            <li className="flex items-start justify-between gap-3 rounded-xl border border-night-700 bg-night-950/70 px-3 py-2">
              <span className="flex items-center gap-2 text-sand-100">
                <KeyRound size={14} className="text-sage-200" />
                Registered passkeys
              </span>
              <span className="text-xs text-night-200">{passkeys.length}</span>
            </li>
            <li className="flex items-start justify-between gap-3 rounded-xl border border-night-700 bg-night-950/70 px-3 py-2">
              <span className="flex items-center gap-2 text-sand-100">
                <ShieldCheck size={14} className="text-sage-200" />
                Active devices
              </span>
              <span className="text-xs text-night-200">{activeDevices.length}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs text-night-300">
            Current device: {currentDevice ? currentDevice.label : "Not detected"}
          </p>
        </SurfaceCard>

        <SurfaceCard title="Core account controls" subtitle="Identity, settings, security, lifecycle">
          <div className="space-y-2 text-sm">
            <Link href="/account/profile" className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600">
              Profile
            </Link>
            <Link href="/account/settings" className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600">
              Preferences and settings
            </Link>
            <Link href="/account/notifications" className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600">
              Notification controls
            </Link>
            <Link href="/account/danger" className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600">
              Danger zone
            </Link>
          </div>
        </SurfaceCard>

        <SurfaceCard title="Activity pulse" subtitle="Notifications and personalization status">
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border border-night-700 bg-night-950/70 px-3 py-2">
              <p className="flex items-center gap-2 text-sand-100">
                <Bell size={14} className="text-sage-200" />
                Notifications
              </p>
              <p className="mt-1 text-night-200">{notifications.unreadCount} unread</p>
              <Link
                href="/account/notifications"
                className="mt-2 inline-block text-xs text-sage-100 hover:text-sage-50"
              >
                Open notifications page
              </Link>
            </div>
            <div className="rounded-xl border border-night-700 bg-night-950/70 px-3 py-2">
              <p className="flex items-center gap-2 text-sand-100">
                <Bot size={14} className="text-sage-200" />
                Companion personalization
              </p>
              <p className="mt-1 text-night-200">Manage companion behavior in account settings and chat.</p>
              <Link href="/chat" className="mt-2 inline-block text-xs text-sage-100 hover:text-sage-50">
                Open companion workspace
              </Link>
            </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
