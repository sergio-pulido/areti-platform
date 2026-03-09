import Link from "next/link";
import { BookOpen, Lock } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PreviewSignupLink } from "@/components/preview/preview-signup-link";

const sampleLessons = [
  {
    title: "Dichotomy of Control",
    summary: "Separate what depends on your choices from what does not.",
  },
  {
    title: "Pleasure Without Excess",
    summary: "Use simple satisfactions to stay stable and avoid self-sabotage.",
  },
  {
    title: "Voluntary Discomfort",
    summary: "Practice temporary challenge to reduce fear of loss.",
  },
] as const;

export default function PreviewLibraryPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Public Preview"
        title="Library"
        description="Preview how philosophy lessons are presented in the product."
        actions={
          <Link
            href="/preview"
            className="inline-flex rounded-xl border border-night-700 bg-night-900/70 px-3 py-2 text-xs text-night-100 hover:border-night-600"
          >
            All previews
          </Link>
        }
      />

      <section className="grid gap-3 md:grid-cols-3">
        {sampleLessons.map((lesson) => (
          <article key={lesson.title} className="rounded-2xl border border-night-800/70 bg-night-900/60 p-4">
            <p className="text-[10px] uppercase tracking-[0.18em] text-night-300">Lesson</p>
            <h2 className="mt-1 flex items-center gap-2 text-base text-sand-100">
              <BookOpen size={15} className="text-sage-200" />
              {lesson.title}
            </h2>
            <p className="mt-2 text-sm text-night-200">{lesson.summary}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-sage-300/30 bg-sage-500/10 p-4 text-sm text-sage-100">
        <p className="flex items-center gap-2 font-medium">
          <Lock size={15} />
          Full lesson detail, progress tracking, and recommendations require an account.
        </p>
        <PreviewSignupLink
          sourcePath="/preview/library"
          className="mt-3 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/15 px-3 py-2 text-xs hover:bg-sage-500/25"
        >
          Create account to unlock library
        </PreviewSignupLink>
      </section>
    </div>
  );
}
