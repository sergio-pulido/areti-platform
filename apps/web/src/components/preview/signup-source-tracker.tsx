"use client";

import { useEffect } from "react";
import { trackPreviewEvent } from "@/lib/preview-analytics";

type SignupSourceTrackerProps = {
  source: string | undefined;
  from: string | undefined;
};

export function SignupSourceTracker({ source, from }: SignupSourceTrackerProps) {
  useEffect(() => {
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    const fromPreviewReferrer = referrer.includes("/preview");
    if (source !== "preview" && !fromPreviewReferrer) {
      return;
    }

    trackPreviewEvent({
      eventType: "preview_signup_view",
      path: "/auth/signup",
      metadata: {
        from: from?.slice(0, 120) ?? (fromPreviewReferrer ? "referrer" : "unknown"),
      },
    });
  }, [from, source]);

  return null;
}
