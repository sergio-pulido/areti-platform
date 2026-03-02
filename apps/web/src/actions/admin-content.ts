"use server";

import { revalidatePath } from "next/cache";
import {
  apiAdminCreateCommunity,
  apiAdminCreateHighlight,
  apiAdminCreateLesson,
  apiAdminCreatePillar,
  apiAdminCreatePractice,
  apiAdminDeleteCommunity,
  apiAdminDeleteHighlight,
  apiAdminDeleteLesson,
  apiAdminDeletePillar,
  apiAdminDeletePractice,
  apiAdminSetCommunityStatus,
  apiAdminSetHighlightStatus,
  apiAdminSetLessonStatus,
  apiAdminSetPillarStatus,
  apiAdminSetPracticeStatus,
  apiAdminUpdateCommunity,
  apiAdminUpdateHighlight,
  apiAdminUpdateLesson,
  apiAdminUpdatePillar,
  apiAdminUpdatePractice,
  type ContentStatus,
} from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getNumber(formData: FormData, key: string): number {
  const value = Number(getString(formData, key));
  if (!Number.isFinite(value)) {
    throw new Error(`Invalid number for ${key}`);
  }

  return value;
}

function getStatus(formData: FormData, key: string): ContentStatus {
  const value = getString(formData, key);

  if (value !== "DRAFT" && value !== "PUBLISHED") {
    throw new Error(`Invalid status for ${key}`);
  }

  return value;
}

async function requireAdminToken(): Promise<string> {
  const session = await requireSession();

  if (session.user.role !== "ADMIN") {
    throw new Error("Admin access required.");
  }

  return session.accessToken;
}

function revalidateCms(): void {
  revalidatePath("/dashboard/cms");
  revalidatePath("/");
  revalidatePath("/dashboard/library");
  revalidatePath("/dashboard/practices");
  revalidatePath("/dashboard/community");
}

export async function createLessonAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminCreateLesson(token, {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    tradition: getString(formData, "tradition"),
    level: getString(formData, "level"),
    minutes: getNumber(formData, "minutes"),
    summary: getString(formData, "summary"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function setLessonStatusAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminSetLessonStatus(
    token,
    getNumber(formData, "id"),
    getStatus(formData, "status"),
  );

  revalidateCms();
}

export async function deleteLessonAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminDeleteLesson(token, getNumber(formData, "id"));

  revalidateCms();
}

export async function updateLessonAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminUpdateLesson(token, getNumber(formData, "id"), {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    tradition: getString(formData, "tradition"),
    level: getString(formData, "level"),
    minutes: getNumber(formData, "minutes"),
    summary: getString(formData, "summary"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function createPracticeAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminCreatePractice(token, {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    cadence: getString(formData, "cadence"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function setPracticeStatusAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminSetPracticeStatus(
    token,
    getNumber(formData, "id"),
    getStatus(formData, "status"),
  );

  revalidateCms();
}

export async function deletePracticeAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminDeletePractice(token, getNumber(formData, "id"));

  revalidateCms();
}

export async function updatePracticeAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminUpdatePractice(token, getNumber(formData, "id"), {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    cadence: getString(formData, "cadence"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function createCommunityAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminCreateCommunity(token, {
    slug: getString(formData, "slug"),
    name: getString(formData, "name"),
    focus: getString(formData, "focus"),
    schedule: getString(formData, "schedule"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function setCommunityStatusAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminSetCommunityStatus(
    token,
    getNumber(formData, "id"),
    getStatus(formData, "status"),
  );

  revalidateCms();
}

export async function deleteCommunityAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminDeleteCommunity(token, getNumber(formData, "id"));

  revalidateCms();
}

export async function updateCommunityAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminUpdateCommunity(token, getNumber(formData, "id"), {
    slug: getString(formData, "slug"),
    name: getString(formData, "name"),
    focus: getString(formData, "focus"),
    schedule: getString(formData, "schedule"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function createPillarAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminCreatePillar(token, {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function setPillarStatusAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminSetPillarStatus(
    token,
    getNumber(formData, "id"),
    getStatus(formData, "status"),
  );

  revalidateCms();
}

export async function deletePillarAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminDeletePillar(token, getNumber(formData, "id"));

  revalidateCms();
}

export async function updatePillarAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminUpdatePillar(token, getNumber(formData, "id"), {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function createHighlightAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminCreateHighlight(token, {
    slug: getString(formData, "slug"),
    description: getString(formData, "description"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function setHighlightStatusAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminSetHighlightStatus(
    token,
    getNumber(formData, "id"),
    getStatus(formData, "status"),
  );

  revalidateCms();
}

export async function deleteHighlightAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminDeleteHighlight(token, getNumber(formData, "id"));

  revalidateCms();
}

export async function updateHighlightAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminUpdateHighlight(token, getNumber(formData, "id"), {
    slug: getString(formData, "slug"),
    description: getString(formData, "description"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}
