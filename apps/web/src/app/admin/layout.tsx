import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SecuredShell } from "@/components/layout/secured-shell";
import { requireSession } from "@/lib/auth/session";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await requireSession();

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return <SecuredShell session={session}>{children}</SecuredShell>;
}
