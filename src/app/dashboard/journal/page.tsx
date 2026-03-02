import { JournalForm } from "@/components/dashboard/journal-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

export default async function JournalPage() {
  const user = await requireUser();

  const entries = db.journalEntry.findManyByUserId(user.id, 12);

  return (
    <div>
      <PageHeader
        eyebrow="Journal"
        title="Reflection Engine"
        description="Write, review, and sharpen your inner narrative through practical philosophy."
      />

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <JournalForm />

        <SurfaceCard title="Recent Entries" subtitle="Newest reflections first">
          <div className="space-y-3">
            {entries.length === 0 ? (
              <p className="rounded-2xl border border-night-800 bg-night-950/70 p-4 text-sm text-night-300">
                Your journal is empty. Add your first reflection.
              </p>
            ) : (
              entries.map((entry) => (
                <article key={entry.id} className="rounded-2xl border border-night-800 bg-night-950/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-semibold text-sand-100">{entry.title}</h3>
                    <span className="rounded-full border border-sage-300/40 bg-sage-500/10 px-2 py-0.5 text-xs text-sage-100">
                      {entry.mood}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm text-night-200">{entry.body}</p>
                  <p className="mt-2 text-xs text-night-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </article>
              ))
            )}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
