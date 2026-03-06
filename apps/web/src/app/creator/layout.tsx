import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SecuredShell } from "@/components/layout/secured-shell";
import { requireSession } from "@/lib/auth/session";

type CreatorLayoutProps = {
  children: ReactNode;
};

export default async function CreatorLayout({ children }: CreatorLayoutProps) {
  const session = await requireSession();
  const user = session.user;

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <SecuredShell session={session}>{children}</SecuredShell>;
}
