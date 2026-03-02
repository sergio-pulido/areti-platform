import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/backend-api";
import { getSessionToken } from "@/lib/auth/session";

export async function POST() {
  const accessToken = await getSessionToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/security/passkeys/register/options`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    return NextResponse.json(
      { error: payload?.error ?? "Unable to create passkey registration options" },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as { data?: unknown };
  return NextResponse.json({ data: payload.data });
}
