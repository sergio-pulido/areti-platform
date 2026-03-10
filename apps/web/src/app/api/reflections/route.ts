import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/backend-api";
import { getSessionToken } from "@/lib/auth/session";

function extractError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const value = (payload as { error?: unknown }).error;
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export async function GET(request: Request) {
  const accessToken = await getSessionToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestUrl = new URL(request.url);
  const apiUrl = new URL(`${getApiBaseUrl()}/api/v1/reflections`);

  for (const [key, value] of requestUrl.searchParams.entries()) {
    apiUrl.searchParams.set(key, value);
  }

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as { data?: unknown; error?: string } | null;

  if (!response.ok) {
    return NextResponse.json(
      { error: extractError(payload, "Unable to fetch reflections") },
      { status: response.status },
    );
  }

  return NextResponse.json({ data: payload?.data });
}

export async function POST(request: Request) {
  const accessToken = await getSessionToken();

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const response = await fetch(`${getApiBaseUrl()}/api/v1/reflections`, {
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
    return NextResponse.json(
      { error: extractError(payload, "Unable to create reflection") },
      { status: response.status },
    );
  }

  return NextResponse.json({ data: payload?.data }, { status: response.status });
}
