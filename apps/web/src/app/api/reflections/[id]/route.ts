import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/backend-api";
import { getSessionToken } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function extractError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const value = (payload as { error?: unknown }).error;
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

export async function GET(_request: Request, context: RouteContext) {
  const accessToken = await getSessionToken();
  const { id } = await context.params;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/reflections/${id}`, {
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
      { error: extractError(payload, "Unable to fetch reflection") },
      { status: response.status },
    );
  }

  return NextResponse.json({ data: payload?.data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const accessToken = await getSessionToken();
  const { id } = await context.params;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));

  const response = await fetch(`${getApiBaseUrl()}/api/v1/reflections/${id}`, {
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
    return NextResponse.json(
      { error: extractError(payload, "Unable to update reflection") },
      { status: response.status },
    );
  }

  return NextResponse.json({ data: payload?.data }, { status: response.status });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const accessToken = await getSessionToken();
  const { id } = await context.params;

  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(`${getApiBaseUrl()}/api/v1/reflections/${id}`, {
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
    return NextResponse.json(
      { error: extractError(payload, "Unable to delete reflection") },
      { status: response.status },
    );
  }

  return NextResponse.json({ data: payload?.data ?? { ok: true } });
}
