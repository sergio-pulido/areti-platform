"use server";

import { revalidatePath } from "next/cache";
import { apiSetMfa, apiSetPasskeys } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

function parseEnabled(formData: FormData): boolean {
  const value = formData.get("enabled");

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error("Invalid security toggle payload.");
}

export async function setMfaEnabledAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const enabled = parseEnabled(formData);

  await apiSetMfa(session.accessToken, enabled);

  revalidatePath("/dashboard/settings");
}

export async function setPasskeyEnabledAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const enabled = parseEnabled(formData);

  await apiSetPasskeys(session.accessToken, enabled);

  revalidatePath("/dashboard/settings");
}
