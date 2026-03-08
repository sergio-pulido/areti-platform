"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { apiTrackContentCompletion } from "@/lib/backend-api";

const completionSchema = z.object({
  contentKind: z.enum(["lesson", "practice"]),
  contentSlug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9-]+$/),
  returnTo: z.string().trim().optional(),
});

function getString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeReturnTo(returnTo: string | undefined): string | null {
  if (!returnTo) {
    return null;
  }

  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return null;
  }

  return returnTo;
}

export async function markContentCompleteAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const parsed = completionSchema.safeParse({
    contentKind: getString(formData, "contentKind"),
    contentSlug: getString(formData, "contentSlug"),
    returnTo: getString(formData, "returnTo"),
  });

  if (!parsed.success) {
    throw new Error("Invalid completion payload.");
  }

  await apiTrackContentCompletion(session.accessToken, {
    contentKind: parsed.data.contentKind,
    contentSlug: parsed.data.contentSlug,
  });

  revalidatePath("/dashboard");
  revalidatePath("/library");
  revalidatePath("/practices");

  const returnTo = sanitizeReturnTo(parsed.data.returnTo);
  if (!returnTo) {
    return;
  }

  revalidatePath(returnTo);

  const separator = returnTo.includes("?") ? "&" : "?";
  redirect(`${returnTo}${separator}completed=1`);
}
