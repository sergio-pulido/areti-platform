import Link from "next/link";
import { createPracticeAdminAction } from "@/actions/admin-content";
import { PracticeFormFields } from "@/components/dashboard/content-form-fields";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { requireSession } from "@/lib/auth/session";

export default async function NewPracticeProtocolPage() {
  const session = await requireSession();

  if (session.user.role !== "ADMIN") {
    return (
      <div>
        <PageHeader
          eyebrow="Practices"
          title="New protocol"
          description="Admin role required to create new practices."
        />
        <SurfaceCard title="Access denied" subtitle="Admin role required">
          <p className="text-sm text-night-200">
            Your current role is <strong>{session.user.role}</strong>.
          </p>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Practices"
        title="Create Practice Protocol"
        description="Create a published protocol for the practices section."
      />

      <SurfaceCard title="Protocol details" subtitle="This publishes immediately">
        <form action={createPracticeAdminAction} className="grid gap-2 text-sm">
          <PracticeFormFields includeStatus={false} />
          <input type="hidden" name="status" value="PUBLISHED" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950"
            >
              Create protocol
            </button>
            <Link
              href="/dashboard/practices"
              className="rounded-lg border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
            >
              Cancel
            </Link>
          </div>
        </form>
      </SurfaceCard>
    </div>
  );
}
