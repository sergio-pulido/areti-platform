import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { COOKIE_CONSENT_COOKIE_NAME, COOKIE_CONSENT_COOKIE_VALUE } from "@/lib/legal";

const protectedPrefixes = [
  "/dashboard",
  "/journal",
  "/library",
  "/practices",
  "/chat",
  "/community",
  "/creator",
  "/account",
  "/onboarding",
];

function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(COOKIE_CONSENT_COOKIE_NAME)?.value;

  if (cookieValue === COOKIE_CONSENT_COOKIE_VALUE) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/legal/cookies";
  redirectUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
