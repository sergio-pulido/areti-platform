import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/backend-api";
import { getSessionToken } from "@/lib/auth/session";

export async function GET() {
  const accessToken = await getSessionToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/chat/threads`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as { data?: unknown; error?: string } | null;

  if (!response.ok) {
    return NextResponse.json({ error: payload?.error ?? "Unable to fetch chat threads" }, { status: response.status });
  }

  return NextResponse.json({ data: payload?.data ?? [] });
}

export async function POST(request: Request) {
  const accessToken = await getSessionToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const response = await fetch(`${getApiBaseUrl()}/api/v1/chat/threads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as { data?: unknown; error?: string } | null;

  if (!response.ok) {
    return NextResponse.json({ error: payload?.error ?? "Unable to create chat thread" }, { status: response.status });
  }

  return NextResponse.json({ data: payload?.data });
}
