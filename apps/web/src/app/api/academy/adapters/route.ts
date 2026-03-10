import { NextResponse } from "next/server";
import { z } from "zod";
import { buildAcademyAgentAdapters } from "@/lib/academy/academy-query-adapters";
import { getSessionToken } from "@/lib/auth/session";
import { isApiHttpError } from "@/lib/backend-api";

const requestSchema = z.object({
  context: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid academy adapter payload" }, { status: 400 });
  }

  try {
    const data = await buildAcademyAgentAdapters({
      token,
      context: parsed.data.context,
    });

    return NextResponse.json({ data });
  } catch (error) {
    if (isApiHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Unable to generate academy recommendations" },
      { status: 500 },
    );
  }
}
