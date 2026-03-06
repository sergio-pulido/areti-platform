import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/backend-api";
import { getSessionToken } from "@/lib/auth/session";

export async function DELETE() {
  const accessToken = await getSessionToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/security/mfa/totp`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 204) {
    return NextResponse.json({ data: { ok: true } });
  }

  const payload = (await response.json().catch(() => null)) as { data?: unknown; error?: string } | null;

  if (!response.ok) {
    return NextResponse.json({ error: payload?.error ?? "Unable to disable TOTP" }, { status: response.status });
  }

  return NextResponse.json({ data: payload?.data ?? { ok: true } });
}
