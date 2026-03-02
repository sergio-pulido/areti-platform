import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/backend-api";

export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/passkey/options`, {
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
      { error: payload?.error ?? "Unable to create passkey sign-in options" },
      { status: response.status },
    );
  }

  const payload = (await response.json()) as { data?: unknown };
  return NextResponse.json({ data: payload.data });
}
