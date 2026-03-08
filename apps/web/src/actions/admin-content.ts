"use server";

import { revalidatePath } from "next/cache";
import {
  apiAdminCreateChallenge,
  apiAdminCreateCommunity,
  apiAdminCreateEvent,
  apiAdminCreateExpert,
  apiAdminCreateHighlight,
  apiAdminCreateLesson,
  apiAdminCreatePillar,
  apiAdminCreatePractice,
  apiAdminCreateResource,
  apiAdminCreateVideo,
  apiAdminDeleteChallenge,
  apiAdminDeleteCommunity,
  apiAdminDeleteEvent,
  apiAdminDeleteExpert,
  apiAdminDeleteHighlight,
  apiAdminDeleteLesson,
  apiAdminDeletePillar,
  apiAdminDeletePractice,
  apiAdminDeleteResource,
  apiAdminDeleteVideo,
  apiAdminSetChallengeStatus,
  apiAdminSetCommunityStatus,
  apiAdminSetEventStatus,
  apiAdminSetExpertStatus,
  apiAdminSetHighlightStatus,
  apiAdminSetLessonStatus,
  apiAdminSetPillarStatus,
  apiAdminSetPracticeStatus,
  apiAdminSetResourceStatus,
  apiAdminSetVideoStatus,
  apiAdminUpdateChallenge,
  apiAdminUpdateCommunity,
  apiAdminUpdateEvent,
  apiAdminUpdateExpert,
  apiAdminUpdateHighlight,
  apiAdminUpdateLesson,
  apiAdminUpdatePillar,
  apiAdminUpdatePractice,
  apiAdminUpdateResource,
  apiAdminUpdateVideo,
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

function getStatusOrDefault(
  formData: FormData,
  key: string,
  fallback: ContentStatus,
): ContentStatus {
  const value = getString(formData, key);

  if (!value) {
    return fallback;
  }

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
  revalidatePath("/creator/cms");
  revalidatePath("/creator");
  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath("/practices");
  revalidatePath("/community");
  revalidatePath("/community/challenges");
  revalidatePath("/community/resources");
  revalidatePath("/community/experts");
  revalidatePath("/community/events");
  revalidatePath("/creator/videos");
  revalidatePath("/creator/readings");
  revalidatePath("/creator/exercises");
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
    content: getString(formData, "content"),
    status: getStatusOrDefault(formData, "status", "PUBLISHED"),
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
    content: getString(formData, "content"),
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
    protocol: getString(formData, "protocol"),
    status: getStatusOrDefault(formData, "status", "PUBLISHED"),
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
    protocol: getString(formData, "protocol"),
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

export async function createChallengeAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminCreateChallenge(token, {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    duration: getString(formData, "duration"),
    summary: getString(formData, "summary"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function setChallengeStatusAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminSetChallengeStatus(
    token,
    getNumber(formData, "id"),
    getStatus(formData, "status"),
  );

  revalidateCms();
}

export async function deleteChallengeAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminDeleteChallenge(token, getNumber(formData, "id"));

  revalidateCms();
}

export async function updateChallengeAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminUpdateChallenge(token, getNumber(formData, "id"), {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    duration: getString(formData, "duration"),
    summary: getString(formData, "summary"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function createResourceAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminCreateResource(token, {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    href: getString(formData, "href"),
    cta: getString(formData, "cta"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function setResourceStatusAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminSetResourceStatus(
    token,
    getNumber(formData, "id"),
    getStatus(formData, "status"),
  );

  revalidateCms();
}

export async function deleteResourceAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminDeleteResource(token, getNumber(formData, "id"));

  revalidateCms();
}

export async function updateResourceAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminUpdateResource(token, getNumber(formData, "id"), {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    href: getString(formData, "href"),
    cta: getString(formData, "cta"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function createExpertAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminCreateExpert(token, {
    slug: getString(formData, "slug"),
    name: getString(formData, "name"),
    focus: getString(formData, "focus"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function setExpertStatusAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminSetExpertStatus(
    token,
    getNumber(formData, "id"),
    getStatus(formData, "status"),
  );

  revalidateCms();
}

export async function deleteExpertAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminDeleteExpert(token, getNumber(formData, "id"));

  revalidateCms();
}

export async function updateExpertAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminUpdateExpert(token, getNumber(formData, "id"), {
    slug: getString(formData, "slug"),
    name: getString(formData, "name"),
    focus: getString(formData, "focus"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function createEventAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminCreateEvent(token, {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    schedule: getString(formData, "schedule"),
    summary: getString(formData, "summary"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function setEventStatusAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminSetEventStatus(
    token,
    getNumber(formData, "id"),
    getStatus(formData, "status"),
  );

  revalidateCms();
}

export async function deleteEventAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminDeleteEvent(token, getNumber(formData, "id"));

  revalidateCms();
}

export async function updateEventAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminUpdateEvent(token, getNumber(formData, "id"), {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    schedule: getString(formData, "schedule"),
    summary: getString(formData, "summary"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function createVideoAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminCreateVideo(token, {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    format: getString(formData, "format"),
    summary: getString(formData, "summary"),
    videoUrl: getString(formData, "videoUrl"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}

export async function setVideoStatusAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminSetVideoStatus(
    token,
    getNumber(formData, "id"),
    getStatus(formData, "status"),
  );

  revalidateCms();
}

export async function deleteVideoAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminDeleteVideo(token, getNumber(formData, "id"));

  revalidateCms();
}

export async function updateVideoAdminAction(formData: FormData): Promise<void> {
  const token = await requireAdminToken();

  await apiAdminUpdateVideo(token, getNumber(formData, "id"), {
    slug: getString(formData, "slug"),
    title: getString(formData, "title"),
    format: getString(formData, "format"),
    summary: getString(formData, "summary"),
    videoUrl: getString(formData, "videoUrl"),
    status: getStatus(formData, "status"),
  });

  revalidateCms();
}
