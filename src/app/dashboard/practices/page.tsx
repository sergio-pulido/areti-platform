import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

const routines = [
  {
    title: "Morning Premeditatio",
    description:
      "Visualize potential obstacles and choose your virtuous response before the day starts.",
    cadence: "Daily · 6 min",
  },
  {
    title: "Pleasure Audit",
    description:
      "Epicurean check: remove one needless desire and reinforce one natural healthy joy.",
    cadence: "Daily · 4 min",
  },
  {
    title: "Evening Examen",
    description:
      "Review actions with compassion and precision. Keep what served virtue, adjust the rest.",
    cadence: "Daily · 8 min",
  },
  {
    title: "Taoist Unforcing Block",
    description:
      "For 20 minutes, work with fluid focus and no over-control. Let rhythm replace force.",
    cadence: "3x week · 20 min",
  },
];

export default function PracticesPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Practices"
        title="Your Daily Protocols"
        description="Rituals designed for mental resilience, calm pleasure, and strategic action."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {routines.map((routine) => (
          <SurfaceCard key={routine.title} title={routine.title} subtitle={routine.cadence}>
            <p className="text-sm text-night-200">{routine.description}</p>
            <button
              type="button"
              className="mt-4 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Start practice
            </button>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
