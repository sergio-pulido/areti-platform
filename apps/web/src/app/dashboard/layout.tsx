import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth/session";
import { DashboardSidenav } from "@/components/layout/dashboard-sidenav";
import { DashboardTopnav } from "@/components/layout/dashboard-topnav";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-night-950 text-sand-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <DashboardSidenav user={user} />

        <div className="flex min-h-screen w-full flex-col">
          <DashboardTopnav user={user} />
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
