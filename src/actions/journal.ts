"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import type { JournalActionState } from "@/actions/journal-state";

const journalSchema = z.object({
  title: z.string().trim().min(3, "Title is too short").max(80),
  body: z.string().trim().min(10, "Reflection is too short").max(3000),
  mood: z.string().trim().min(2).max(32),
});

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createJournalEntry(
  _prevState: JournalActionState,
  formData: FormData,
): Promise<JournalActionState> {
  const user = await requireUser();

  const parsed = journalSchema.safeParse({
    title: getString(formData, "title"),
    body: getString(formData, "body"),
    mood: getString(formData, "mood"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error: issue?.message ?? "Unable to create journal entry.",
    };
  }

  db.journalEntry.create({
    id: randomUUID(),
    userId: user.id,
    title: parsed.data.title,
    body: parsed.data.body,
    mood: parsed.data.mood,
  });

  revalidatePath("/dashboard/journal");

  return {};
}
