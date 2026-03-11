import Link from "next/link";
import { Compass, Lock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PreviewSignupLink } from "@/components/preview/preview-signup-link";
import { isSignupEnabled } from "@/lib/runtime-config";

const samplePractices = [
  {
    title: "Morning Intention",
    duration: "5 min",
    steps: "Define one virtue to practice and one predictable obstacle.",
  },
  {
    title: "Midday Reset",
    duration: "3 min",
    steps: "Pause, breathe slowly, and identify what is still in your control now.",
  },
  {
    title: "Evening Review",
    duration: "7 min",
    steps: "Score your choices, not outcomes, and commit one improvement for tomorrow.",
  },
] as const;

export default function PreviewPracticesPage() {
  const signupEnabled = isSignupEnabled();

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Public Preview"
        title="Practices"
        description="Preview structured daily protocols before signing up."
        actions={
          <Link
            href="/preview"
            className="inline-flex rounded-xl border border-night-700 bg-night-900/70 px-3 py-2 text-xs text-night-100 hover:border-night-600"
          >
            All previews
          </Link>
        }
      />

      <section className="space-y-3">
        {samplePractices.map((practice) => (
          <article key={practice.title} className="rounded-2xl border border-night-800/70 bg-night-900/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-night-300">{practice.duration}</p>
            <h2 className="mt-1 flex items-center gap-2 text-base text-sand-100">
              <Compass size={15} className="text-sage-200" />
              {practice.title}
            </h2>
            <p className="mt-2 text-sm text-night-200">{practice.steps}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-sage-300/30 bg-sage-500/10 p-4 text-sm text-sage-100">
        <p className="flex items-center gap-2 font-medium">
          <Lock size={15} />
          {signupEnabled
            ? "Habit tracking, completion history, and tailored protocols require an account."
            : "Areti is currently available by invitation only."}
        </p>
        {signupEnabled ? (
          <PreviewSignupLink
            sourcePath="/preview/practices"
            className="mt-3 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/15 px-3 py-2 text-xs hover:bg-sage-500/25"
          >
            Create account to unlock practices
          </PreviewSignupLink>
        ) : (
          <Link
            href="/auth/signin"
            className="mt-3 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/15 px-3 py-2 text-xs hover:bg-sage-500/25"
          >
            Sign in
          </Link>
        )}
      </section>
    </div>
  );
}
