import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

export default function CreatorPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Creator"
        title="Creator Studio"
        description="Manage community and learning content through dedicated production workflows."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SurfaceCard title="CMS" subtitle="All content types">
          <p className="text-sm text-night-200">
            Create, edit, publish, and audit every content entity.
          </p>
          <Link
            href="/creator/cms"
            className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
          >
            Open CMS
          </Link>
        </SurfaceCard>

        <SurfaceCard title="Exercises" subtitle="Practice design">
          <p className="text-sm text-night-200">
            Review and refine practical exercises members run daily.
          </p>
          <Link
            href="/creator/exercises"
            className="mt-4 inline-flex rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-xs text-sand-100 hover:border-night-600"
          >
            Open exercises
          </Link>
        </SurfaceCard>

        <SurfaceCard title="Videos" subtitle="Media catalog">
          <p className="text-sm text-night-200">
            Keep video catalog updated and aligned with learning tracks.
          </p>
          <Link
            href="/creator/videos"
            className="mt-4 inline-flex rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-xs text-sand-100 hover:border-night-600"
          >
            Open videos
          </Link>
        </SurfaceCard>
      </div>
    </div>
  );
}
