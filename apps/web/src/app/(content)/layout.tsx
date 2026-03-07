import type { ReactNode } from "react";
import { SecuredShell } from "@/components/layout/secured-shell";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  return <SecuredShell>{children}</SecuredShell>;
}
