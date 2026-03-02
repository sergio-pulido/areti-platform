import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth/session";

const requestSchema = z.object({
  prompt: z.string().trim().min(3).max(600),
});

function buildAnswer(prompt: string): string {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("anx") || normalized.includes("stress") || normalized.includes("fear")) {
    return "Start with the Stoic split: what is under your control today? Choose one action there. Then apply Epicurean simplicity: remove one unnecessary demand. Finish with a short Taoist reset: breathe, loosen force, and move with the smallest natural step.";
  }

  if (normalized.includes("habit") || normalized.includes("discipline") || normalized.includes("routine")) {
    return "Create a two-layer routine: Stoic commitment (non-negotiable tiny action) plus Epicurean pleasure (make it genuinely enjoyable). Add Buddhist awareness by tracking when craving or resistance appears without judgment.";
  }

  if (normalized.includes("love") || normalized.includes("relationship") || normalized.includes("friend")) {
    return "Use Epicurus first: quality friendship is a core good. Then add Stoic virtue: speak with honesty, justice, and restraint. A Taoist lens helps too: stop over-controlling the person and protect the flow of mutual respect.";
  }

  return `Question received: "${prompt}". A balanced response: choose virtue for decisions (Stoicism), choose sustainable pleasure and friendship (Epicureanism), reduce attachment to outcomes (Buddhism), and avoid forcing what can be guided softly (Taoism). Pick one principle to practice in the next 24 hours.`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = requestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
  }

  return NextResponse.json({ answer: buildAnswer(parsed.data.prompt) });
}
