import type { ReactNode } from "react";
import { requireSession, type SessionContext } from "@/lib/auth/session";
import { DashboardSidenav } from "@/components/layout/dashboard-sidenav";
import { DashboardTopnav } from "@/components/layout/dashboard-topnav";

type SecuredShellProps = {
  children: ReactNode;
  session?: SessionContext;
};

export async function SecuredShell({ children, session: providedSession }: SecuredShellProps) {
  const session = providedSession ?? (await requireSession());
  const user = session.user;

  return (
    <div className="min-h-screen bg-night-950 text-sand-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <DashboardSidenav user={user} />

        <div className="flex min-h-screen w-full flex-col">
          <DashboardTopnav user={user} accessToken={session.accessToken} />
          <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
