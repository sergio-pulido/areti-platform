import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

const videoFormats = [
  {
    name: "3-Minute Insight",
    purpose: "Quick tactical concept for immediate application.",
  },
  {
    name: "Guided Practice",
    purpose: "Step-by-step routine walkthrough with prompts.",
  },
  {
    name: "Deep Dive",
    purpose: "Long-form comparative philosophy session.",
  },
];

export default function CreatorVideosPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Creator"
        title="Videos Studio"
        description="Plan and publish short-form and long-form video content for the platform."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {videoFormats.map((format) => (
          <SurfaceCard key={format.name} title={format.name}>
            <p className="text-sm text-night-200">{format.purpose}</p>
            <Link
              href="/creator/cms"
              className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Manage in CMS
            </Link>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
