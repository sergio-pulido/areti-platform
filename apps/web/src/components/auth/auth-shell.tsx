import type { ReactNode } from "react";
import { AppTopbar } from "@/components/layout/app-topbar";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-night-950 text-sand-100">
      <AppTopbar />
      <div className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-[1fr_460px]">
        <section className="relative hidden overflow-hidden border-r border-night-800/80 lg:block">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(181,214,167,0.18),transparent_35%),radial-gradient(circle_at_80%_70%,rgba(232,216,188,0.12),transparent_40%),linear-gradient(140deg,#0b0e12_20%,#131922_60%,#0f1520_100%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between p-12">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-sage-200/90">Stoa + Garden</p>
              <h1 className="mt-5 max-w-lg font-title text-5xl leading-tight text-sand-100">
                Practical wisdom with pleasure, calm, and reason in one platform.
              </h1>
            </div>

            <div className="grid gap-4">
              {[
                "Daily practices blending Stoicism, Epicureanism, Buddhism, and Taoism.",
                "Security-first accounts with hashed credentials and hardened sessions.",
                "A workspace for study, journaling, and conversations with AI guidance.",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-night-700/60 bg-night-900/40 px-5 py-4 text-sm text-sand-200/90"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md rounded-3xl border border-night-700/80 bg-night-900/60 p-8 shadow-2xl shadow-black/30 backdrop-blur">
            <h2 className="font-title text-3xl text-sand-100">{title}</h2>
            <p className="mt-2 text-sm text-sand-300">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
