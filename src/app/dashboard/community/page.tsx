import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

const circles = [
  {
    name: "Builders Circle",
    focus: "Founders and operators applying philosophy to execution.",
    schedule: "Tuesdays 7:00 PM",
  },
  {
    name: "Calm Mind Collective",
    focus: "Stress, anxiety, and cognitive reframing with real examples.",
    schedule: "Wednesdays 6:30 PM",
  },
  {
    name: "Friendship & Meaning Group",
    focus: "Epicurean themes: friendship, pleasure, limits, and gratitude.",
    schedule: "Fridays 5:30 PM",
  },
];

export default function CommunityPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Guided Circles"
        description="Join practical discussions, accountability groups, and shared philosophical experiments."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {circles.map((circle) => (
          <SurfaceCard key={circle.name} title={circle.name} subtitle={circle.schedule}>
            <p className="text-sm text-night-200">{circle.focus}</p>
            <button
              type="button"
              className="mt-4 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Request invite
            </button>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
