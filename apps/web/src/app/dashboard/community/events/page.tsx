import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";

const events = [
  {
    slug: "weekly-dialogue",
    title: "Weekly Socratic Dialogue",
    schedule: "Tuesdays · 19:00",
    summary: "Discuss one difficult life decision and test reasoning with the group.",
  },
  {
    slug: "focus-lab",
    title: "Focus Lab",
    schedule: "Thursdays · 18:00",
    summary: "Live coworking and reflection block for deep work and calm execution.",
  },
  {
    slug: "monthly-retrospective",
    title: "Monthly Retrospective Circle",
    schedule: "Last Friday · 20:00",
    summary: "Review wins, failures, and next commitments with accountability partners.",
  },
];

export default function CommunityEventsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Community"
        title="Events"
        description="Attend recurring sessions to stay consistent, reflective, and accountable."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {events.map((event) => (
          <SurfaceCard key={event.slug} title={event.title} subtitle={event.schedule}>
            <p className="text-sm text-night-200">{event.summary}</p>
            <Link
              href={`/dashboard/journal?title=${encodeURIComponent(`Event Plan: ${event.title}`)}&mood=Focused`}
              className="mt-4 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              Save plan
            </Link>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
