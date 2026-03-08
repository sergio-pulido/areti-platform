import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

export default function AccountSubscriptionPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Subscription"
        title="Subscription"
        description="Manage your plan, payment relationship, and renewal visibility."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Current plan" subtitle="Your subscription status and renewal details">
          <p className="text-sm text-night-200">
            Subscription plan details are not connected yet. This section is ready for live plan and renewal
            data.
          </p>
          <p className="mt-2 text-xs text-night-300">When billing is enabled, your active tier and renewal date will appear here.</p>
        </SurfaceCard>

        <SurfaceCard title="Payment and invoices" subtitle="Payment methods and billing history">
          <p className="text-sm text-night-200">
            No payment methods or invoices are available yet.
          </p>
          <p className="mt-2 text-xs text-night-300">
            This area will support payment methods, invoice downloads, and receipt history once integrated.
          </p>
        </SurfaceCard>

        <SurfaceCard title="Manage subscription" subtitle="Future self-service actions">
          <p className="text-sm text-night-200">
            Self-service upgrades, plan changes, and cancellations will be available here.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled
              className="rounded-lg border border-night-700 bg-night-900 px-3 py-1.5 text-xs text-night-200 opacity-70"
            >
              Manage subscription (coming soon)
            </button>
            <Link
              href="/account/preferences"
              className="rounded-lg border border-night-700 bg-night-950 px-3 py-1.5 text-xs text-sand-100 hover:border-night-500"
            >
              Open preferences
            </Link>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
