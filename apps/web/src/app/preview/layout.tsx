import type { ReactNode } from "react";
import { AppTopbar } from "@/components/layout/app-topbar";
import { PreviewPageTracker } from "@/components/preview/preview-page-tracker";
import { isSignupEnabled } from "@/lib/runtime-config";

type PreviewLayoutProps = {
  children: ReactNode;
};

export default function PreviewLayout({ children }: PreviewLayoutProps) {
  const signupEnabled = isSignupEnabled();

  return (
    <div className="min-h-screen bg-night-950 text-sand-100">
      <AppTopbar
        guestAuthSwitch={
          signupEnabled
            ? { href: "/auth/signup?source=preview&from=%2Fpreview", label: "Create account" }
            : { href: "/auth/signin", label: "Sign in" }
        }
      />
      <PreviewPageTracker />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
