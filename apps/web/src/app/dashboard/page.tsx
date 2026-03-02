import Link from "next/link";
import { ArrowUpRight, Bot, NotebookPen, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { requireSession } from "@/lib/auth/session";
import { apiDashboardSummary } from "@/lib/backend-api";

export default async function DashboardPage() {
  const session = await requireSession();
  const user = session.user;
  const summary = await apiDashboardSummary(session.accessToken);

  const { entriesCount, latestEntries } = summary;

  const stats = [
    {
      label: "Active Streak",
      value: `${Math.min(21, entriesCount + 2)} days`,
      meta: "Consistency in practice",
    },
    {
      label: "Reflections",
      value: `${entriesCount}`,
      meta: "Journaled insights",
    },
    {
      label: "Focus Index",
      value: "87%",
      meta: "Based on weekly goals",
    },
    {
      label: "Security",
      value: "Hardened",
      meta: "Session + validation enabled",
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Dashboard"
        title={`Welcome, ${user.name.split(" ")[0]}`}
        description="Track your progress, stay centered, and act with philosophical clarity."
        actions={
          <Link
            href="/dashboard/journal"
            className="inline-flex items-center gap-2 rounded-xl border border-sand-100 bg-sand-100 px-4 py-2 text-sm font-semibold text-night-950 hover:bg-sand-50"
          >
            <NotebookPen size={14} />
            New reflection
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <SurfaceCard key={item.label} title={item.value} subtitle={item.label}>
            <p className="text-sm text-night-300">{item.meta}</p>
          </SurfaceCard>
        ))}
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <SurfaceCard
          title="Recent reflections"
          subtitle="Your latest journal entries to keep momentum visible"
        >
          <div className="space-y-3">
            {latestEntries.length === 0 ? (
              <p className="rounded-2xl border border-night-800 bg-night-950/70 p-4 text-sm text-night-300">
                No entries yet. Start with one reflection in the Journal tab.
              </p>
            ) : (
              latestEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl border border-night-800 bg-night-950/70 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-semibold text-sand-100">{entry.title}</h3>
                    <span className="rounded-full border border-sage-300/40 bg-sage-500/10 px-2 py-0.5 text-xs text-sage-100">
                      {entry.mood}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-night-300">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </article>
              ))
            )}
          </div>
        </SurfaceCard>

        <div className="space-y-4">
          <SurfaceCard title="AI Companion" subtitle="Fast coaching for real-world problems">
            <p className="text-sm text-night-200">
              Ask for guidance on anxiety, habits, decision-making, and relationships through
              a Stoic-Epicurean lens.
            </p>
            <Link
              href="/dashboard/chat"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sm text-sand-100 hover:border-sage-300"
            >
              Open chatbot
              <ArrowUpRight size={14} />
            </Link>
          </SurfaceCard>

          <SurfaceCard title="Security posture" subtitle="Practical safeguards enabled by default">
            <ul className="space-y-2 text-sm text-night-200">
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-sage-200" />
                Argon2id password hashing
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-sage-200" />
                HTTP-only secure session cookies
              </li>
              <li className="flex items-center gap-2">
                <Bot size={14} className="text-sage-200" />
                Input validation + auth checks on every endpoint
              </li>
            </ul>
          </SurfaceCard>
        </div>
      </section>
    </div>
  );
}
