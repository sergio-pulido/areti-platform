import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/backend-api";
import { getSessionToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  const accessToken = await getSessionToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const response = await fetch(`${getApiBaseUrl()}/api/v1/security/passkeys/register/verify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    return NextResponse.json(
      { error: payload?.error ?? "Unable to verify passkey registration" },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as { data?: unknown };
  return NextResponse.json({ data: payload.data });
}
