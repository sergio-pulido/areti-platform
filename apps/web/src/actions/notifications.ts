"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiNotificationRead, apiNotificationsReadAll } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function sanitizeInternalHref(href: string): string {
  if (!href.startsWith("/")) {
    return "/dashboard";
  }

  return href;
}

function revalidateShell(): void {
  revalidatePath("/dashboard");
  revalidatePath("/community");
  revalidatePath("/creator");
  revalidatePath("/account");
  revalidatePath("/account/notifications");
}

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = getString(formData, "id");

  if (!id) {
    throw new Error("Notification id is required.");
  }

  await apiNotificationRead(session.accessToken, id);
  revalidateShell();
}

export async function readAllNotificationsAction(): Promise<void> {
  const session = await requireSession();
  await apiNotificationsReadAll(session.accessToken);
  revalidateShell();
}

export async function openNotificationAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = getString(formData, "id");
  const href = sanitizeInternalHref(getString(formData, "href"));

  if (id) {
    await apiNotificationRead(session.accessToken, id);
  }

  revalidateShell();
  redirect(href);
}
