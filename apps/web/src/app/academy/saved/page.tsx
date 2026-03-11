import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

export default function AcademySavedPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Academy"
        title="Saved"
        description="Your bookmarked academy material in one place."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Saved collection" subtitle="Bookmarks across traditions, thinkers, works, and concepts">
          <p className="text-sm text-night-200">
            Saved academy collections are being connected to persistent bookmarks.
          </p>
          <p className="mt-2 text-xs text-night-300">
            You can continue learning now from guided paths or open your favourites list.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/academy/paths"
              className="rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
            >
              Open Academy paths
            </Link>
            <Link
              href="/account/favourites"
              className="rounded-lg border border-night-700 bg-night-950 px-3 py-1.5 text-xs text-sand-100 hover:border-night-500"
            >
              Open favourites
            </Link>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
