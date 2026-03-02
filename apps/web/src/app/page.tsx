import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Swords } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { fetchLandingContent } from "@/lib/content-api";

export default async function Home() {
  const [user, landingContent] = await Promise.all([getCurrentUser(), fetchLandingContent()]);

  return (
    <div className="min-h-screen bg-night-950 text-sand-100">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(181,214,167,0.15),transparent_35%),radial-gradient(circle_at_75%_15%,rgba(232,216,188,0.12),transparent_35%),radial-gradient(circle_at_75%_80%,rgba(127,96,71,0.2),transparent_50%)]" />

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-12">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-sage-200/90">Ataraxia Platform</p>
            <h1 className="font-title text-2xl text-sand-100">Stoic Garden</h1>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/legal/privacy"
              className="rounded-xl border border-night-700 px-4 py-2 text-sm text-sand-200 hover:border-night-500"
            >
              Privacy
            </Link>
            <Link
              href="/auth/signin"
              className="rounded-xl border border-night-700 px-4 py-2 text-sm text-sand-200 hover:border-night-500"
            >
              Sign in
            </Link>
            <Link
              href={user ? "/dashboard" : "/auth/signup"}
              className="rounded-xl border border-sand-100 bg-sand-100 px-4 py-2 text-sm font-semibold text-night-950 hover:bg-sand-50"
            >
              {user ? "Open dashboard" : "Get started"}
            </Link>
          </nav>
        </header>

        <main className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-6 lg:px-12 lg:pb-24 lg:pt-10">
          <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-sage-300/30 bg-sage-500/10 px-3 py-1 text-xs uppercase tracking-[0.25em] text-sage-100">
                <Swords size={13} />
                Philosophy for high-stakes modern life
              </p>
              <h2 className="mt-5 max-w-4xl font-title text-5xl leading-tight md:text-6xl">
                Build inner strength with Stoicism, guided by Epicurean calm.
              </h2>
              <p className="mt-5 max-w-2xl text-lg text-sand-200/85">
                This platform combines timeless philosophy and practical tools: protected accounts,
                structured practices, reflective journaling, and an AI guide for real-life decisions.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={user ? "/dashboard" : "/auth/signup"}
                  className="inline-flex items-center gap-2 rounded-xl border border-sand-100 bg-sand-100 px-5 py-3 text-sm font-semibold text-night-950 hover:bg-sand-50"
                >
                  {user ? "Continue to dashboard" : "Create free account"}
                  <ArrowRight size={15} />
                </Link>
                <Link
                  href="/dashboard/chat"
                  className="inline-flex items-center gap-2 rounded-xl border border-night-600 bg-night-900/60 px-5 py-3 text-sm text-sand-100 hover:border-night-500"
                >
                  <Sparkles size={14} />
                  Preview the AI guide
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-night-800 bg-night-900/60 p-6 shadow-2xl shadow-black/30">
              <h3 className="font-title text-2xl">Platform Pillars</h3>
              <div className="mt-5 space-y-3">
                {landingContent.pillars.map((pillar) => (
                  <article
                    key={pillar.slug}
                    className="rounded-2xl border border-night-700/80 bg-night-950/70 p-4"
                  >
                    <h4 className="text-base font-semibold text-sand-100">{pillar.title}</h4>
                    <p className="mt-1 text-sm text-night-200">{pillar.description}</p>
                  </article>
                ))}
                {landingContent.pillars.length === 0 ? (
                  <p className="rounded-2xl border border-night-700/80 bg-night-950/70 p-4 text-sm text-night-200">
                    Content API unavailable. Start the backend to load platform content.
                  </p>
                ) : null}
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-sage-200/90">
                <ShieldCheck size={14} />
                Security baseline: encrypted credentials, protected sessions, strict validation.
              </p>
            </div>
          </section>

          <section className="mt-12 grid gap-3 md:grid-cols-2">
            {landingContent.highlights.map((item) => (
              <div
                key={item.slug}
                className="rounded-2xl border border-night-800 bg-night-900/50 p-4 text-sm text-sand-200"
              >
                {item.description}
              </div>
            ))}
            {landingContent.highlights.length === 0 ? (
              <p className="rounded-2xl border border-night-800 bg-night-900/50 p-4 text-sm text-night-200">
                No landing highlights found in API content.
              </p>
            ) : null}
          </section>
        </main>
      </div>

      <footer className="border-t border-night-800 bg-night-950/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-xs text-night-300 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <p>Ataraxia Platform - practical philosophy for resilient, meaningful living.</p>
          <div className="flex gap-4">
            <Link href="/legal/privacy" className="hover:text-sand-100">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-sand-100">
              Terms
            </Link>
            <Link href="/legal/cookies" className="hover:text-sand-100">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
