import type { ReactNode } from "react";
import { AppTopbar } from "@/components/layout/app-topbar";

type LegalLayoutProps = {
  children: ReactNode;
};

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-night-950 text-sand-100">
      <AppTopbar />
      <div className="px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl">
          <article className="rounded-3xl border border-night-800 bg-night-900/70 p-6 sm:p-8">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
