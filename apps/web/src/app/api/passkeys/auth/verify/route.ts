import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { getApiBaseUrl, type ApiUser } from "@/lib/backend-api";

type PasskeyAuthVerifyPayload = {
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
};

export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/passkey/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    return NextResponse.json(
      { error: payload?.error ?? "Unable to verify passkey sign-in" },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as { data?: PasskeyAuthVerifyPayload };

  if (!payload.data) {
    return NextResponse.json({ error: "Invalid passkey sign-in response" }, { status: 500 });
  }

  await createSession({
    accessToken: payload.data.accessToken,
    refreshToken: payload.data.refreshToken,
  });

  return NextResponse.json({ data: { user: payload.data.user } });
}
