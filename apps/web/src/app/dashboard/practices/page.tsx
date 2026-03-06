import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { PracticeProtocolCard } from "@/components/dashboard/practice-protocol-card";
import { requireSession } from "@/lib/auth/session";
import { fetchPracticeRoutines } from "@/lib/content-api";

export default async function PracticesPage() {
  const session = await requireSession();
  const routines = await fetchPracticeRoutines();
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div>
      <PageHeader
        eyebrow="Practices"
        title="Your Daily Protocols"
        description="Rituals designed for mental resilience, calm pleasure, and strategic action."
        actions={
          isAdmin ? (
            <Link
              href="/dashboard/practices/new"
              className="inline-flex rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
            >
              New protocol
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {routines.map((routine) => (
          <PracticeProtocolCard key={routine.slug} routine={routine} />
        ))}
        {routines.length === 0 ? (
          <p className="rounded-2xl border border-night-800 bg-night-900/60 p-4 text-sm text-night-200">
            No practices found in API content.
          </p>
        ) : null}
      </div>
    </div>
  );
}
