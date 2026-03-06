import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/backend-api";
import { getSessionToken } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ threadId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const accessToken = await getSessionToken();
  const { threadId } = await context.params;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/chat/threads/${threadId}/messages`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as { data?: unknown; error?: string } | null;

  if (!response.ok) {
    return NextResponse.json({ error: payload?.error ?? "Unable to fetch messages" }, { status: response.status });
  }

  return NextResponse.json({ data: payload?.data ?? [] });
}

export async function POST(request: Request, context: RouteContext) {
  const accessToken = await getSessionToken();
  const { threadId } = await context.params;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const response = await fetch(`${getApiBaseUrl()}/api/v1/chat/threads/${threadId}/messages`, {
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
    return NextResponse.json({ error: payload?.error ?? "Unable to send message" }, { status: response.status });
  }

  return NextResponse.json({ data: payload?.data });
}
