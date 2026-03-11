import Link from "next/link";
import { ArrowRight, BarChart3, Bot, BookOpen, Compass, NotebookPen } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { PreviewSignupLink } from "@/components/preview/preview-signup-link";
import { isSignupEnabled } from "@/lib/runtime-config";

const previewFeatures = [
  {
    href: "/preview/chat",
    title: "Companion Chat Preview",
    description: "Token-limited conversational preview with no account required.",
    status: "Live",
    icon: Bot,
  },
  {
    href: "/preview/journal",
    title: "Journal Preview",
    description: "Sample reflection flow and journaling experience without persistence.",
    status: "Live",
    icon: NotebookPen,
  },
  {
    href: "/preview/library",
    title: "Library Preview",
    description: "Sample lesson cards that mirror the reading format.",
    status: "Live",
    icon: BookOpen,
  },
  {
    href: "/preview/practices",
    title: "Practices Preview",
    description: "Sample daily protocols and habit-oriented format.",
    status: "Live",
    icon: Compass,
  },
  {
    href: "/preview/dashboard",
    title: "Dashboard Preview",
    description: "Sample momentum and action-first home experience.",
    status: "Live",
    icon: BarChart3,
  },
] as const;

export default function PreviewIndexPage() {
  const signupEnabled = isSignupEnabled();

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Public Preview"
        title="Try Areti Without Signing In"
        description="Explore lightweight previews of core experiences before creating an account."
      />

      <section className="grid gap-3 md:grid-cols-2">
        {previewFeatures.map((feature) => {
          const Icon = feature.icon;
          return (
            <article
              key={feature.title}
              className="rounded-2xl border border-night-800/70 bg-night-900/60 p-4"
            >
              <p className="text-[10px] uppercase tracking-[0.18em] text-night-300">{feature.status}</p>
              <h2 className="mt-1 flex items-center gap-2 text-lg text-sand-100">
                <Icon size={16} className="text-sage-200" />
                {feature.title}
              </h2>
              <p className="mt-2 text-sm text-night-200">{feature.description}</p>
              <Link
                href={feature.href}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20"
              >
                Open preview
                <ArrowRight size={13} />
              </Link>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-sage-300/30 bg-sage-500/10 p-4">
        <p className="text-sm text-sage-100">
          {signupEnabled
            ? "Want to save progress and unlock the full product?"
            : "Areti is currently available by invitation only."}
        </p>
        {signupEnabled ? (
          <PreviewSignupLink
            sourcePath="/preview"
            className="mt-3 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/15 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/25"
          >
            Create account
          </PreviewSignupLink>
        ) : (
          <Link
            href="/auth/signin"
            className="mt-3 inline-flex rounded-xl border border-sage-300/40 bg-sage-500/15 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/25"
          >
            Sign in
          </Link>
        )}
      </section>
    </div>
  );
}
