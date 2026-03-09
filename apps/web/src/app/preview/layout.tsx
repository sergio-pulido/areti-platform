import type { ReactNode } from "react";
import { AppTopbar } from "@/components/layout/app-topbar";
import { PreviewPageTracker } from "@/components/preview/preview-page-tracker";

type PreviewLayoutProps = {
  children: ReactNode;
};

export default function PreviewLayout({ children }: PreviewLayoutProps) {
  return (
    <div className="min-h-screen bg-night-950 text-sand-100">
      <AppTopbar guestAuthSwitch={{ href: "/auth/signup?source=preview&from=%2Fpreview", label: "Create account" }} />
      <PreviewPageTracker />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
