import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

const readingTracks = [
  {
    name: "Foundations",
    description: "Beginner-friendly texts to establish Stoic-Epicurean fundamentals.",
  },
  {
    name: "Applied Practice",
    description: "Case-based readings for work, relationships, and emotional resilience.",
  },
  {
    name: "Comparative Lens",
    description: "Cross-school comparisons with Taoist and Buddhist complementary ideas.",
  },
];

export default function CreatorReadingsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Creator"
        title="Readings Studio"
        description="Create concise readings and learning tracks for different learner profiles."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {readingTracks.map((track) => (
          <SurfaceCard key={track.name} title={track.name}>
            <p className="text-sm text-night-200">{track.description}</p>
            <Link
              href="/creator/cms"
              className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Create in CMS
            </Link>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
