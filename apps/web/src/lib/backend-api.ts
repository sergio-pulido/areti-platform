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
};

const errorSchema = z.object({
  error: z.string().optional(),
  data: z.unknown().optional(),
});

const mfaRequiredDataSchema = z.object({
  mfaChallengeId: z.string().uuid(),
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
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

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

export async function apiAdminContent(token: string): Promise<AdminContentBundle> {
  return requestJson<AdminContentBundle>("/api/v1/admin/content", withAuth(token));
}

export async function apiAdminAudit(token: string, limit = 40): Promise<ApiAdminAuditLog[]> {
  return requestJson<ApiAdminAuditLog[]>(`/api/v1/admin/audit?limit=${limit}`, withAuth(token));
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
