import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { apiContentEvents } from "@/lib/backend-api";

export default async function AccountCalendarPage() {
  const events = await apiContentEvents();

  return (
    <div>
      <PageHeader
        eyebrow="Saved content"
        title="Calendar"
        description="Your upcoming events and activities from the Ataraxia community."
      />

      <SurfaceCard title="Upcoming events" subtitle="Personal calendar feed">
        {events.length === 0 ? (
          <p className="text-sm text-night-200">No events are currently available.</p>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 8).map((event) => (
              <article key={event.slug} className="rounded-xl border border-night-700 bg-night-950/70 p-3">
                <p className="flex items-center gap-2 text-sm font-semibold text-sand-100">
                  <CalendarDays size={14} className="text-sage-200" />
                  {event.title}
                </p>
                <p className="mt-1 text-xs text-night-200">{event.schedule}</p>
                <p className="mt-1 text-xs text-night-300">{event.summary}</p>
              </article>
            ))}
          </div>
        )}

        <div className="mt-4">
          <Link
            href="/community/events"
            className="inline-flex rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
          >
            Open events section
          </Link>
        </div>
      </SurfaceCard>
    </div>
  );
}
