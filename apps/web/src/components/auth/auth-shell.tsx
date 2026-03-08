import type { ReactNode } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthHeroPanel } from "@/components/auth/auth-hero-panel";
import { AppTopbar } from "@/components/layout/app-topbar";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  guestAuthSwitch: {
    href: string;
    label: string;
  };
};

export function AuthShell({ title, subtitle, children, guestAuthSwitch }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-night-950 text-sand-100">
      <AppTopbar guestAuthSwitch={guestAuthSwitch} />
      <div className="grid min-h-[calc(100vh-56px)] grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
        <AuthHeroPanel />

        <section className="flex items-start justify-center p-5 pb-8 pt-6 sm:p-8 lg:items-center lg:p-10">
          <AuthCard>
            <AuthHeader title={title} subtitle={subtitle} />
            <div className="mt-7">{children}</div>
          </AuthCard>
        </section>
      </div>
    </div>
  );
}
