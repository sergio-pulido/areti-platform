import type { ReactNode } from "react";
import { requireOnboardedSession, type SessionContext } from "@/lib/auth/session";
import { DashboardSidenav } from "@/components/layout/dashboard-sidenav";
import { AppTopbar } from "@/components/layout/app-topbar";

type SecuredShellProps = {
  children: ReactNode;
  session?: SessionContext;
};

export async function SecuredShell({ children, session: providedSession }: SecuredShellProps) {
  const session = providedSession ?? (await requireOnboardedSession());
  const user = session.user;

  return (
    <div className="min-h-screen bg-night-950 text-sand-100">
      <AppTopbar user={user} accessToken={session.accessToken} />
      <div className="flex min-h-[calc(100vh-56px)] w-full">
        <DashboardSidenav user={user} />

        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
