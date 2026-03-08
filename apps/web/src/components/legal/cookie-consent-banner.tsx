"use client";

import Link from "next/link";
import { useState } from "react";
import {
  COOKIE_CONSENT_COOKIE_NAME,
  COOKIE_CONSENT_COOKIE_VALUE,
  COOKIE_CONSENT_MAX_AGE_SECONDS,
} from "@/lib/legal";

function hasConsentCookie(): boolean {
  if (typeof document === "undefined") {
    return true;
  }

  return document.cookie
    .split(";")
    .map((item) => item.trim())
    .some((item) => item === `${COOKIE_CONSENT_COOKIE_NAME}=${COOKIE_CONSENT_COOKIE_VALUE}`);
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => !hasConsentCookie());

  if (!visible) {
    return null;
  }

  function handleAccept() {
    document.cookie = `${COOKIE_CONSENT_COOKIE_NAME}=${COOKIE_CONSENT_COOKIE_VALUE}; Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}; Path=/; SameSite=Lax`;
    setVisible(false);

    const currentUrl = new URL(window.location.href);
    if (currentUrl.pathname === "/legal/cookies") {
      const nextTarget = currentUrl.searchParams.get("next") ?? "";
      if (nextTarget.startsWith("/")) {
        window.location.assign(nextTarget);
        return;
      }
    }

    window.location.reload();
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-night-700 bg-night-950/95 p-4 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-sand-200">
          We use cookies to keep your account session secure and maintain essential platform
          features. Read our{" "}
          <Link href="/legal/cookies" className="text-sage-200 hover:text-sage-100">
            Cookie Policy
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={handleAccept}
          className="rounded-lg border border-sand-100 bg-sand-100 px-4 py-2 text-sm font-semibold text-night-950 hover:bg-sand-50"
        >
          Accept cookies
        </button>
      </div>
    </div>
  );
}
