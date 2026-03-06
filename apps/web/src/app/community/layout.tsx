import type { ReactNode } from "react";
import { SecuredShell } from "@/components/layout/secured-shell";

type CommunityLayoutProps = {
  children: ReactNode;
};

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  return <SecuredShell>{children}</SecuredShell>;
}
