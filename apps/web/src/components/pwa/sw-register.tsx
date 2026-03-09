"use client";

import { useEffect } from "react";

const SW_URL = "/sw.js";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    const onLoad = () => {
      void navigator.serviceWorker.register(SW_URL).catch((error: unknown) => {
        console.error("Service worker registration failed", error);
      });
    };

    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return null;
}
