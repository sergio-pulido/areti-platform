import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Security & Preferences"
        description="Manage your account posture, legal settings, and dashboard behavior."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard
          title="Authentication posture"
          subtitle="Built with modern baseline protections"
        >
          <ul className="space-y-3 text-sm text-night-200">
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-sage-200" />
              Argon2id password hashing
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-sage-200" />
              HTTP-only same-site session cookie
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-sage-200" />
              Request validation and rate-limiting hooks
            </li>
          </ul>
        </SurfaceCard>

        <SurfaceCard title="Compliance" subtitle="Transparent legal pages">
          <div className="space-y-2 text-sm">
            <Link href="/legal/privacy" className="flex items-center gap-2 text-sand-100 hover:text-sage-100">
              <Lock size={14} />
              Privacy Policy
            </Link>
            <Link href="/legal/terms" className="flex items-center gap-2 text-sand-100 hover:text-sage-100">
              <Lock size={14} />
              Terms of Service
            </Link>
            <Link href="/legal/cookies" className="flex items-center gap-2 text-sand-100 hover:text-sage-100">
              <Lock size={14} />
              Cookie Policy
            </Link>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
