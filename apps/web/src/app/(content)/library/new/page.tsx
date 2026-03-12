import Link from "next/link";
import { createLessonAdminAction } from "@/actions/admin-content";
import { LessonFormFields } from "@/components/dashboard/content-form-fields";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { requireSession } from "@/lib/auth/session";

export default async function NewLibraryArticlePage() {
  const session = await requireSession();

  if (session.user.role !== "admin") {
    return (
      <div>
        <PageHeader
          eyebrow="Library"
          title="New article"
          description="Admin role required to create new library articles."
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
        eyebrow="Library"
        title="Create Library Article"
        description="Create a published article for the member library."
      />

      <SurfaceCard title="Article details" subtitle="This publishes immediately">
        <form action={createLessonAdminAction} className="grid gap-2 text-sm">
          <LessonFormFields includeStatus={false} />
          <input type="hidden" name="status" value="PUBLISHED" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-night-950"
            >
              Create article
            </button>
            <Link
              href="/library"
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
