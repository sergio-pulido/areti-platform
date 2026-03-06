import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/backend-api";
import { getSessionToken } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ threadId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const accessToken = await getSessionToken();
  const { threadId } = await context.params;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const response = await fetch(`${getApiBaseUrl()}/api/v1/chat/threads/${threadId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as { data?: unknown; error?: string } | null;

  if (!response.ok) {
    return NextResponse.json({ error: payload?.error ?? "Unable to update thread" }, { status: response.status });
  }

  return NextResponse.json({ data: payload?.data ?? { ok: true } });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const accessToken = await getSessionToken();
  const { threadId } = await context.params;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/chat/threads/${threadId}`, {
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
    return NextResponse.json({ error: payload?.error ?? "Unable to delete thread" }, { status: response.status });
  }

  return NextResponse.json({ data: payload?.data ?? { ok: true } });
}
