import Link from "next/link";
import { BarChart3, Bot, BookOpen, Compass, Notebook } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PreviewSignupLink } from "@/components/preview/preview-signup-link";

const sampleActions = [
  {
    title: "Morning check-in",
    detail: "2 min" ,
    icon: Notebook,
  },
  {
    title: "Short Companion reflection",
    detail: "One concise prompt",
    icon: Bot,
  },
  {
    title: "Read one lesson",
    detail: "5 min",
    icon: BookOpen,
  },
  {
    title: "Complete one practice",
    detail: "7 min",
    icon: Compass,
  },
] as const;

export default function PreviewDashboardPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Public Preview"
        title="Dashboard"
        description="A sample of the member home with priorities, momentum, and next actions."
        actions={
          <Link
            href="/preview"
            className="inline-flex rounded-xl border border-night-700 bg-night-900/70 px-3 py-2 text-xs text-night-100 hover:border-night-600"
          >
            All previews
          </Link>
        }
      />

      <section className="rounded-2xl border border-night-800/70 bg-night-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-night-300">Today overview</p>
        <h2 className="mt-1 flex items-center gap-2 text-lg text-sand-100">
          <BarChart3 size={16} className="text-sage-200" />
          Momentum snapshot
        </h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-night-700/70 bg-night-950/60 p-3">
            <p className="text-xs text-night-300">Streak</p>
            <p className="mt-1 text-xl text-sand-100">4 days</p>
          </div>
          <div className="rounded-xl border border-night-700/70 bg-night-950/60 p-3">
            <p className="text-xs text-night-300">Reflections this week</p>
            <p className="mt-1 text-xl text-sand-100">3</p>
          </div>
          <div className="rounded-xl border border-night-700/70 bg-night-950/60 p-3">
            <p className="text-xs text-night-300">Practices completed</p>
            <p className="mt-1 text-xl text-sand-100">2</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {sampleActions.map((action) => {
          const Icon = action.icon;
          return (
            <article key={action.title} className="rounded-2xl border border-night-800/70 bg-night-900/60 p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-night-300">Next action</p>
              <h3 className="mt-1 flex items-center gap-2 text-base text-sand-100">
                <Icon size={15} className="text-sage-200" />
                {action.title}
              </h3>
              <p className="mt-2 text-sm text-night-200">{action.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-sage-300/30 bg-sage-500/10 p-4">
        <p className="text-sm text-sage-100">Create an account to unlock real progress data, continuity, and history.</p>
        <PreviewSignupLink
          sourcePath="/preview/dashboard"
          className="mt-3 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/15 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/25"
        >
          Create account to unlock dashboard
        </PreviewSignupLink>
      </section>
    </div>
  );
}
