"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { trackPreviewEvent } from "@/lib/preview-analytics";

export function PreviewPageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname.startsWith("/preview")) {
      return;
    }

    trackPreviewEvent({
      eventType: "preview_page_view",
      path: pathname,
    });
  }, [pathname]);

  return null;
}
