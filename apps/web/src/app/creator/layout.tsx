import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SecuredShell } from "@/components/layout/secured-shell";
import { requireUser } from "@/lib/auth/session";

type CreatorLayoutProps = {
  children: ReactNode;
};

export default async function CreatorLayout({ children }: CreatorLayoutProps) {
  const user = await requireUser();

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return <SecuredShell user={user}>{children}</SecuredShell>;
}
