import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { fetchCreatorVideos } from "@/lib/content-api";

export default async function CreatorVideosPage() {
  const videos = await fetchCreatorVideos();

  return (
    <div>
      <PageHeader
        eyebrow="Creator"
        title="Videos Studio"
        description="Plan and publish short-form and long-form video content for the platform."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((video) => (
          <SurfaceCard key={video.slug} title={video.title} subtitle={video.format}>
            <p className="text-sm text-night-200">{video.summary}</p>
            <div className="mt-4 flex gap-2">
              <Link
                href={video.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-xs text-sand-100 hover:border-night-600"
              >
                Open video
              </Link>
              <Link
                href="/creator/cms"
                className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
              >
                Manage in CMS
              </Link>
            </div>
          </SurfaceCard>
        ))}
        {videos.length === 0 ? (
          <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
            No videos published yet.
          </p>
        ) : null}
      </div>
    </div>
  );
}
