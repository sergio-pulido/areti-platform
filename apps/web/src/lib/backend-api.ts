import { z } from "zod";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: "MEMBER" | "ADMIN";
};

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type ApiAuthPayload = AuthTokenPair & {
  user: ApiUser;
};

export type ApiSigninResult =
  | ({ mfaRequired: false } & ApiAuthPayload)
  | {
      mfaRequired: true;
      mfaChallengeId: string;
    };

export type ApiJournalEntry = {
  id: string;
  userId: string;
  title: string;
  body: string;
  mood: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiDashboardSummary = {
  entriesCount: number;
  latestEntries: ApiJournalEntry[];
};

export type ApiSecuritySettings = {
  mfaEnabled: boolean;
  passkeyEnabled: boolean;
};

export type ApiPasskey = {
  id: string;
  credentialId: string;
  nickname: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type ApiNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export type ApiNotificationsPayload = {
  items: ApiNotification[];
  unreadCount: number;
};

export type ApiDevice = {
  id: string;
  userId: string;
  label: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastSeenAt: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
  isCurrent: boolean;
  isRevoked: boolean;
};

export type ApiChatThread = {
  id: string;
  userId: string;
  title: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiChatMessage = {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ApiChatPreferences = {
  customInstructions: string;
};

export type ApiChatEvent = {
  id: string;
  userId: string;
  threadId: string | null;
  eventType:
    | "thread_first_message_created"
    | "thread_auto_titled"
    | "thread_renamed"
    | "thread_archived"
    | "thread_restored"
    | "thread_deleted"
    | "message_provider_error";
  payloadJson: string;
  createdAt: string;
};

export type ApiChatThreadScope = "active" | "archived" | "all";

export type ApiContentChallenge = {
  id: number;
  slug: string;
  title: string;
  duration: string;
  summary: string;
};

export type ApiContentResource = {
  id: number;
  slug: string;
  title: string;
  description: string;
  href: string;
  cta: string;
};

export type ApiContentExpert = {
  id: number;
  slug: string;
  name: string;
  focus: string;
};

export type ApiContentEvent = {
  id: number;
  slug: string;
  title: string;
  schedule: string;
  summary: string;
};

export type ApiContentVideo = {
  id: number;
  slug: string;
  title: string;
  format: string;
  summary: string;
  videoUrl: string;
};

export type ApiAdminAuditLog = {
  id: string;
  adminUserId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  payloadJson: string;
  createdAt: string;
};

export type ContentStatus = "DRAFT" | "PUBLISHED";

export type AdminContentBundle = {
  pillars: Array<{
    id: number;
    slug: string;
    title: string;
    description: string;
    status: ContentStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  highlights: Array<{
    id: number;
    slug: string;
    description: string;
    status: ContentStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  lessons: Array<{
    id: number;
    slug: string;
    title: string;
    tradition: string;
    level: string;
    minutes: number;
    summary: string;
    content: string;
    status: ContentStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  practices: Array<{
    id: number;
    slug: string;
    title: string;
    description: string;
    cadence: string;
    protocol: string;
    status: ContentStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  community: Array<{
    id: number;
    slug: string;
    name: string;
    focus: string;
    schedule: string;
    status: ContentStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  challenges: Array<{
    id: number;
    slug: string;
    title: string;
    duration: string;
    summary: string;
    status: ContentStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  resources: Array<{
    id: number;
    slug: string;
    title: string;
    description: string;
    href: string;
    cta: string;
    status: ContentStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  experts: Array<{
    id: number;
    slug: string;
    name: string;
    focus: string;
    status: ContentStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  events: Array<{
    id: number;
    slug: string;
    title: string;
    schedule: string;
    summary: string;
    status: ContentStatus;
    createdAt: string;
    updatedAt: string;
  }>;
  videos: Array<{
    id: number;
    slug: string;
    title: string;
    format: string;
    summary: string;
    videoUrl: string;
    status: ContentStatus;
    createdAt: string;
    updatedAt: string;
  }>;
};

const errorSchema = z.object({
  error: z.string().optional(),
  data: z.unknown().optional(),
});

const mfaRequiredDataSchema = z.object({
  mfaChallengeId: z.string().min(1),
});

export class ApiHttpError extends Error {
  status: number;
  code?: string;
  data?: unknown;

  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
    this.code = code;
    this.data = data;
  }
}

export function isApiHttpError(value: unknown): value is ApiHttpError {
  return value instanceof ApiHttpError;
}

export function getApiBaseUrl(): string {
  return process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";
}

async function parseErrorPayload(response: Response): Promise<{
  message: string;
  code?: string;
  data?: unknown;
}> {
  try {
    const parsed = errorSchema.safeParse(await response.json());

    if (parsed.success) {
      return {
        message: parsed.data.error ?? response.statusText ?? "Request failed",
        code: parsed.data.error,
        data: parsed.data.data,
      };
    }
  } catch {
    // Fallback below.
  }

  return {
    message: response.statusText || "Request failed",
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (error) {
    const cause = error instanceof Error ? error.message : "Unknown network error";
    throw new ApiHttpError(`Unable to reach API service. ${cause}`, 503, "API_UNAVAILABLE");
  }

  if (!response.ok) {
    const parsed = await parseErrorPayload(response);
    throw new ApiHttpError(parsed.message, response.status, parsed.code, parsed.data);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as { data?: T };
  return payload.data as T;
}

function withAuth(token: string, init?: RequestInit): RequestInit {
  return {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function apiSignup(input: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<ApiAuthPayload> {
  return requestJson<ApiAuthPayload>("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiSignin(input: {
  email: string;
  password: string;
  mfaChallengeId?: string;
  mfaCode?: string;
}): Promise<ApiSigninResult> {
  const response = await fetch(`${getApiBaseUrl()}/api/v1/auth/signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(input),
  });

  if (response.ok) {
    const payload = (await response.json()) as { data?: ApiAuthPayload };

    if (!payload.data) {
      throw new Error("Invalid signin response payload.");
    }

    return {
      mfaRequired: false,
      ...payload.data,
    };
  }

  const parsed = await parseErrorPayload(response);

  if (response.status === 401 && parsed.code === "MFA_REQUIRED") {
    const mfaParsed = mfaRequiredDataSchema.safeParse(parsed.data);

    if (!mfaParsed.success) {
      throw new ApiHttpError("MFA challenge data missing in response.", 500);
    }

    return {
      mfaRequired: true,
      mfaChallengeId: mfaParsed.data.mfaChallengeId,
    };
  }

  throw new ApiHttpError(parsed.message, response.status, parsed.code, parsed.data);
}

export async function apiMe(token: string): Promise<{ user: ApiUser; accessToken: string }> {
  return requestJson<{ user: ApiUser; accessToken: string }>("/api/v1/auth/me", withAuth(token));
}

export async function apiRefresh(refreshToken: string): Promise<AuthTokenPair> {
  return requestJson<AuthTokenPair>("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export async function apiLogout(token: string, refreshToken?: string): Promise<void> {
  return requestJson<void>(
    "/api/v1/auth/logout",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
    }),
  );
}

export async function apiDashboardSummary(token: string): Promise<ApiDashboardSummary> {
  return requestJson<ApiDashboardSummary>("/api/v1/dashboard/summary", withAuth(token));
}

export async function apiJournalList(token: string, limit = 12): Promise<ApiJournalEntry[]> {
  return requestJson<ApiJournalEntry[]>(`/api/v1/journal?limit=${limit}`, withAuth(token));
}

export async function apiJournalCreate(
  token: string,
  input: { title: string; body: string; mood: string },
): Promise<void> {
  return requestJson<void>(
    "/api/v1/journal",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiSecuritySettings(token: string): Promise<ApiSecuritySettings> {
  return requestJson<ApiSecuritySettings>("/api/v1/security/settings", withAuth(token));
}

export async function apiSetMfa(token: string, enabled: boolean): Promise<{ mfaEnabled: boolean }> {
  return requestJson<{ mfaEnabled: boolean }>(
    "/api/v1/security/mfa",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),
  );
}

export async function apiSetPasskeys(
  token: string,
  enabled: boolean,
): Promise<{ passkeyEnabled: boolean }> {
  return requestJson<{ passkeyEnabled: boolean }>(
    "/api/v1/security/passkeys",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify({ enabled }),
    }),
  );
}

export async function apiChat(token: string, prompt: string): Promise<{ answer: string }> {
  return requestJson<{ answer: string }>(
    "/api/v1/chat",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  );
}

export async function apiContentChallenges(): Promise<ApiContentChallenge[]> {
  return requestJson<ApiContentChallenge[]>("/api/v1/content/challenges");
}

export async function apiContentResources(): Promise<ApiContentResource[]> {
  return requestJson<ApiContentResource[]>("/api/v1/content/resources");
}

export async function apiContentExperts(): Promise<ApiContentExpert[]> {
  return requestJson<ApiContentExpert[]>("/api/v1/content/experts");
}

export async function apiContentEvents(): Promise<ApiContentEvent[]> {
  return requestJson<ApiContentEvent[]>("/api/v1/content/events");
}

export async function apiContentVideos(): Promise<ApiContentVideo[]> {
  return requestJson<ApiContentVideo[]>("/api/v1/content/videos");
}

export async function apiAdminContent(token: string): Promise<AdminContentBundle> {
  return requestJson<AdminContentBundle>("/api/v1/admin/content", withAuth(token));
}

export async function apiAdminAudit(token: string, limit = 40): Promise<ApiAdminAuditLog[]> {
  return requestJson<ApiAdminAuditLog[]>(`/api/v1/admin/audit?limit=${limit}`, withAuth(token));
}

export async function apiAdminChatEvents(token: string, limit = 200): Promise<ApiChatEvent[]> {
  return requestJson<ApiChatEvent[]>(
    `/api/v1/admin/chat/events?limit=${limit}`,
    withAuth(token),
  );
}

export async function apiAdminCreateLesson(
  token: string,
  input: {
    slug: string;
    title: string;
    tradition: string;
    level: string;
    minutes: number;
    summary: string;
    content: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    "/api/v1/admin/content/lessons",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminSetLessonStatus(
  token: string,
  id: number,
  status: ContentStatus,
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/lessons/${id}/status`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
}

export async function apiAdminDeleteLesson(token: string, id: number): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/lessons/${id}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiAdminUpdateLesson(
  token: string,
  id: number,
  input: {
    slug: string;
    title: string;
    tradition: string;
    level: string;
    minutes: number;
    summary: string;
    content: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/lessons/${id}`,
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminCreatePractice(
  token: string,
  input: {
    slug: string;
    title: string;
    description: string;
    cadence: string;
    protocol: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    "/api/v1/admin/content/practices",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminSetPracticeStatus(
  token: string,
  id: number,
  status: ContentStatus,
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/practices/${id}/status`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
}

export async function apiAdminDeletePractice(token: string, id: number): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/practices/${id}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiAdminUpdatePractice(
  token: string,
  id: number,
  input: {
    slug: string;
    title: string;
    description: string;
    cadence: string;
    protocol: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/practices/${id}`,
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminCreateCommunity(
  token: string,
  input: {
    slug: string;
    name: string;
    focus: string;
    schedule: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    "/api/v1/admin/content/community",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminSetCommunityStatus(
  token: string,
  id: number,
  status: ContentStatus,
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/community/${id}/status`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
}

export async function apiAdminDeleteCommunity(token: string, id: number): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/community/${id}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiAdminUpdateCommunity(
  token: string,
  id: number,
  input: {
    slug: string;
    name: string;
    focus: string;
    schedule: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/community/${id}`,
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminCreatePillar(
  token: string,
  input: {
    slug: string;
    title: string;
    description: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    "/api/v1/admin/content/pillars",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminSetPillarStatus(
  token: string,
  id: number,
  status: ContentStatus,
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/pillars/${id}/status`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
}

export async function apiAdminDeletePillar(token: string, id: number): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/pillars/${id}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiAdminUpdatePillar(
  token: string,
  id: number,
  input: {
    slug: string;
    title: string;
    description: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/pillars/${id}`,
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminCreateHighlight(
  token: string,
  input: {
    slug: string;
    description: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    "/api/v1/admin/content/highlights",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminSetHighlightStatus(
  token: string,
  id: number,
  status: ContentStatus,
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/highlights/${id}/status`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
}

export async function apiAdminDeleteHighlight(token: string, id: number): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/highlights/${id}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiAdminUpdateHighlight(
  token: string,
  id: number,
  input: {
    slug: string;
    description: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/highlights/${id}`,
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiNotifications(token: string, limit = 20): Promise<ApiNotificationsPayload> {
  return requestJson<ApiNotificationsPayload>(
    `/api/v1/notifications?limit=${limit}`,
    withAuth(token),
  );
}

export async function apiNotificationRead(token: string, notificationId: string): Promise<void> {
  return requestJson<void>(
    `/api/v1/notifications/${notificationId}/read`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({}),
    }),
  );
}

export async function apiNotificationsReadAll(token: string): Promise<{ updatedCount: number }> {
  return requestJson<{ updatedCount: number }>(
    "/api/v1/notifications/read-all",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  );
}

export async function apiSecurityPasskeys(token: string): Promise<ApiPasskey[]> {
  return requestJson<ApiPasskey[]>("/api/v1/security/passkeys", withAuth(token));
}

export async function apiSecurityRenamePasskey(
  token: string,
  passkeyId: string,
  nickname: string,
): Promise<void> {
  return requestJson<void>(
    `/api/v1/security/passkeys/${passkeyId}`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ nickname }),
    }),
  );
}

export async function apiSecurityDeletePasskey(token: string, passkeyId: string): Promise<void> {
  return requestJson<void>(
    `/api/v1/security/passkeys/${passkeyId}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiTotpSetup(
  token: string,
): Promise<{ secret: string; otpAuthUrl: string }> {
  return requestJson<{ secret: string; otpAuthUrl: string }>(
    "/api/v1/security/mfa/totp/setup",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  );
}

export async function apiTotpVerify(token: string, code: string): Promise<{ mfaEnabled: boolean }> {
  return requestJson<{ mfaEnabled: boolean }>(
    "/api/v1/security/mfa/totp/verify",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  );
}

export async function apiTotpDisable(token: string): Promise<void> {
  return requestJson<void>(
    "/api/v1/security/mfa/totp",
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiDevices(token: string): Promise<ApiDevice[]> {
  return requestJson<ApiDevice[]>("/api/v1/security/devices", withAuth(token));
}

export async function apiRevokeDevice(token: string, deviceId: string): Promise<void> {
  return requestJson<void>(
    `/api/v1/security/devices/${deviceId}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiChatThreads(
  token: string,
  scope: ApiChatThreadScope = "active",
): Promise<ApiChatThread[]> {
  return requestJson<ApiChatThread[]>(`/api/v1/chat/threads?scope=${scope}`, withAuth(token));
}

export async function apiChatCreateThread(
  token: string,
  title?: string,
): Promise<ApiChatThread> {
  return requestJson<ApiChatThread>(
    "/api/v1/chat/threads",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(title ? { title } : {}),
    }),
  );
}

export async function apiChatPatchThread(
  token: string,
  threadId: string,
  input: { title?: string; archived?: boolean },
): Promise<void> {
  return requestJson<void>(
    `/api/v1/chat/threads/${threadId}`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiChatDeleteThread(token: string, threadId: string): Promise<void> {
  return requestJson<void>(
    `/api/v1/chat/threads/${threadId}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiChatMessages(
  token: string,
  threadId: string,
): Promise<ApiChatMessage[]> {
  return requestJson<ApiChatMessage[]>(
    `/api/v1/chat/threads/${threadId}/messages`,
    withAuth(token),
  );
}

export async function apiChatPostMessage(
  token: string,
  threadId: string,
  prompt: string,
): Promise<{ answer: string }> {
  return requestJson<{ answer: string }>(
    `/api/v1/chat/threads/${threadId}/messages`,
    withAuth(token, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  );
}

export async function apiChatPreferences(token: string): Promise<ApiChatPreferences> {
  return requestJson<ApiChatPreferences>("/api/v1/chat/preferences", withAuth(token));
}

export async function apiSetChatPreferences(
  token: string,
  customInstructions: string,
): Promise<ApiChatPreferences> {
  return requestJson<ApiChatPreferences>(
    "/api/v1/chat/preferences",
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ customInstructions }),
    }),
  );
}

export async function apiAdminCreateChallenge(
  token: string,
  input: {
    slug: string;
    title: string;
    duration: string;
    summary: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    "/api/v1/admin/content/challenges",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminUpdateChallenge(
  token: string,
  id: number,
  input: {
    slug: string;
    title: string;
    duration: string;
    summary: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/challenges/${id}`,
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminSetChallengeStatus(
  token: string,
  id: number,
  status: ContentStatus,
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/challenges/${id}/status`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
}

export async function apiAdminDeleteChallenge(token: string, id: number): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/challenges/${id}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiAdminCreateResource(
  token: string,
  input: {
    slug: string;
    title: string;
    description: string;
    href: string;
    cta: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    "/api/v1/admin/content/resources",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminUpdateResource(
  token: string,
  id: number,
  input: {
    slug: string;
    title: string;
    description: string;
    href: string;
    cta: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/resources/${id}`,
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminSetResourceStatus(
  token: string,
  id: number,
  status: ContentStatus,
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/resources/${id}/status`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
}

export async function apiAdminDeleteResource(token: string, id: number): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/resources/${id}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiAdminCreateExpert(
  token: string,
  input: {
    slug: string;
    name: string;
    focus: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    "/api/v1/admin/content/experts",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminUpdateExpert(
  token: string,
  id: number,
  input: {
    slug: string;
    name: string;
    focus: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/experts/${id}`,
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminSetExpertStatus(
  token: string,
  id: number,
  status: ContentStatus,
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/experts/${id}/status`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
}

export async function apiAdminDeleteExpert(token: string, id: number): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/experts/${id}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiAdminCreateEvent(
  token: string,
  input: {
    slug: string;
    title: string;
    schedule: string;
    summary: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    "/api/v1/admin/content/events",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminUpdateEvent(
  token: string,
  id: number,
  input: {
    slug: string;
    title: string;
    schedule: string;
    summary: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/events/${id}`,
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminSetEventStatus(
  token: string,
  id: number,
  status: ContentStatus,
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/events/${id}/status`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
}

export async function apiAdminDeleteEvent(token: string, id: number): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/events/${id}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiAdminCreateVideo(
  token: string,
  input: {
    slug: string;
    title: string;
    format: string;
    summary: string;
    videoUrl: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    "/api/v1/admin/content/videos",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminUpdateVideo(
  token: string,
  id: number,
  input: {
    slug: string;
    title: string;
    format: string;
    summary: string;
    videoUrl: string;
    status: ContentStatus;
  },
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/videos/${id}`,
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminSetVideoStatus(
  token: string,
  id: number,
  status: ContentStatus,
): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/videos/${id}/status`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  );
}

export async function apiAdminDeleteVideo(token: string, id: number): Promise<void> {
  return requestJson<void>(
    `/api/v1/admin/content/videos/${id}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}
