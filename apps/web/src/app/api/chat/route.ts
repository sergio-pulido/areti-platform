import { NextResponse } from "next/server";
import { z } from "zod";
import { apiChat, isApiHttpError } from "@/lib/backend-api";
import { getSessionToken } from "@/lib/auth/session";

const requestSchema = z.object({
  prompt: z.string().trim().min(3).max(800),
});

export async function POST(request: Request) {
  const token = await getSessionToken();

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
  }

  try {
    const result = await apiChat(token, parsed.data.prompt);
    return NextResponse.json({ answer: result.answer });
  } catch (error) {
    if (isApiHttpError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Unable to complete chat request" }, { status: 500 });
  }
}
