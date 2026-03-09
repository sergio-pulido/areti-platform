"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackPreviewEvent } from "@/lib/preview-analytics";

type PreviewSignupLinkProps = {
  className: string;
  sourcePath: string;
  children: ReactNode;
};

export function PreviewSignupLink({ className, sourcePath, children }: PreviewSignupLinkProps) {
  return (
    <Link
      href={`/auth/signup?source=preview&from=${encodeURIComponent(sourcePath)}`}
      onClick={() => {
        trackPreviewEvent({
          eventType: "preview_signup_click",
          path: sourcePath,
        });
      }}
      className={className}
    >
      {children}
    </Link>
  );
}
