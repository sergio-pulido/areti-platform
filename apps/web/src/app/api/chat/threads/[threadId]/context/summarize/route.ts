import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/backend-api";
import { getSessionToken } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ threadId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const accessToken = await getSessionToken();
  const { threadId } = await context.params;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/chat/threads/${threadId}/context/summarize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as { data?: unknown; error?: string } | null;

  if (!response.ok) {
    return NextResponse.json(
      { error: payload?.error ?? "Unable to summarize thread context" },
      { status: response.status },
    );
  }

  return NextResponse.json({ data: payload?.data });
}
