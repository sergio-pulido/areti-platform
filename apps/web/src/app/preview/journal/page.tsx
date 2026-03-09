import Link from "next/link";
import { Lock, NotebookPen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PreviewSignupLink } from "@/components/preview/preview-signup-link";

export default function PreviewJournalPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Public Preview"
        title="Journal"
        description="See the reflection flow and structure before creating an account."
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
        <p className="text-xs uppercase tracking-[0.18em] text-night-300">Sample reflection</p>
        <h2 className="mt-1 flex items-center gap-2 text-lg text-sand-100">
          <NotebookPen size={16} className="text-sage-200" />
          Evening reset
        </h2>
        <p className="mt-3 text-sm text-night-200">
          Prompt: What happened today that I can reinterpret with more clarity and less ego?
        </p>
        <div className="mt-3 rounded-xl border border-night-700/70 bg-night-950/60 p-3 text-sm text-night-200">
          I felt tension in a meeting because I wanted quick agreement. A better frame is that I can control how
          clearly I communicate, not how quickly others decide.
        </div>
      </section>

      <section className="rounded-2xl border border-sage-300/30 bg-sage-500/10 p-4 text-sm text-sage-100">
        <p className="flex items-center gap-2 font-medium">
          <Lock size={15} />
          Save entries, streaks, and history require an account.
        </p>
        <PreviewSignupLink
          sourcePath="/preview/journal"
          className="mt-3 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/15 px-3 py-2 text-xs hover:bg-sage-500/25"
        >
          Create account to unlock journal
        </PreviewSignupLink>
      </section>
    </div>
  );
}
