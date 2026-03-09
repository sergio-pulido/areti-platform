import { NextResponse } from "next/server";
import { getApiBaseUrl } from "@/lib/backend-api";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const response = await fetch(`${getApiBaseUrl()}/api/v1/preview/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: { ok?: boolean }; error?: string }
    | null;

  if (!response.ok) {
    return NextResponse.json({ error: payload?.error ?? "Unable to track preview event" }, { status: response.status });
  }

  return NextResponse.json({ ok: Boolean(payload?.data?.ok) });
}
