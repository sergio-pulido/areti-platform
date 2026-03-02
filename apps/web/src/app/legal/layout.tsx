import type { ReactNode } from "react";
import Link from "next/link";

type LegalLayoutProps = {
  children: ReactNode;
};

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-night-950 px-4 py-10 text-sand-100 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="font-title text-2xl text-sand-100">
            Ataraxia
          </Link>
          <div className="flex gap-2 text-sm">
            <Link href="/legal/privacy" className="rounded-lg border border-night-700 px-3 py-1.5 text-sand-200 hover:border-night-500">
              Privacy
            </Link>
            <Link href="/legal/terms" className="rounded-lg border border-night-700 px-3 py-1.5 text-sand-200 hover:border-night-500">
              Terms
            </Link>
            <Link href="/legal/cookies" className="rounded-lg border border-night-700 px-3 py-1.5 text-sand-200 hover:border-night-500">
              Cookies
            </Link>
          </div>
        </div>
        <article className="rounded-3xl border border-night-800 bg-night-900/70 p-6 sm:p-8">{children}</article>
      </div>
    </div>
  );
}
