import type { ReactNode } from "react";
import { SecuredShell } from "@/components/layout/secured-shell";

type AccountLayoutProps = {
  children: ReactNode;
};

export default function AccountLayout({ children }: AccountLayoutProps) {
  return <SecuredShell>{children}</SecuredShell>;
}
