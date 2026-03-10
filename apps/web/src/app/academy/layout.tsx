import type { ReactNode } from "react";
import { SecuredShell } from "@/components/layout/secured-shell";

type AcademyLayoutProps = {
  children: ReactNode;
};

export default function AcademyLayout({ children }: AcademyLayoutProps) {
  return <SecuredShell>{children}</SecuredShell>;
}
