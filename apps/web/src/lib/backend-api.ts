import { z } from "zod";

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: "MEMBER" | "ADMIN";
  emailVerifiedAt: string | null;
  onboardingCompletedAt: string | null;
};

export type ApiSocialLink = {
  label: string;
  url: string;
};

export type ApiUserProfile = {
  id: string;
  userId: string;
  username: string | null;
  summary: string;
  phone: string;
  city: string;
  country: string;
  socialLinks: ApiSocialLink[];
  createdAt: string;
  updatedAt: string;
};

export type ApiUserPreferences = {
  id: string;
  userId: string;
  language: string;
  timezone: string;
  profileVisibility: "public" | "private" | "contacts";
  showEmail: boolean;
  showPhone: boolean;
  allowContact: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiNotificationPreferences = {
  id: string;
  userId: string;
  emailChallenges: boolean;
  emailEvents: boolean;
  emailUpdates: boolean;
  emailMarketing: boolean;
  pushChallenges: boolean;
  pushEvents: boolean;
  pushUpdates: boolean;
  digest: "immediate" | "daily" | "weekly";
  createdAt: string;
  updatedAt: string;
};

export type AuthTokenPair = {
  accessToken: string;
  refreshToken: string;
};

export type ApiAuthPayload = AuthTokenPair & {
  user: ApiUser;
};

export type ApiMePayload = {
  user: ApiUser;
  accessToken: string;
  profile: ApiUserProfile;
  preferences: ApiUserPreferences;
};

export type ApiSignupResult = {
  verificationRequired: true;
  email: string;
  debugVerificationCode?: string;
  debugVerificationToken?: string;
};

export type ApiVerifyEmailResult = ApiAuthPayload;

export type ApiResendVerificationResult = {
  sent: boolean;
  alreadyVerified?: boolean;
  debugVerificationCode?: string;
  debugVerificationToken?: string;
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

export type ApiReflectionSourceType = "voice" | "upload" | "text";
export type ApiReflectionStatus = "draft" | "processing" | "ready" | "failed";

export type ApiReflectionProcessingJob = {
  id: string;
  reflectionId: string;
  step: "transcription" | "cleaning" | "refinement" | "commentary";
  status: "pending" | "running" | "success" | "failed";
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiReflectionListItem = {
  id: string;
  title: string;
  sourceType: ApiReflectionSourceType;
  status: ApiReflectionStatus;
  isFavorite: boolean;
  preview: string;
  commentary: string | null;
  tags: string[];
  hasAudio: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiReflectionDetail = {
  id: string;
  title: string;
  sourceType: ApiReflectionSourceType;
  rawText: string;
  cleanTranscript: string | null;
  refinedText: string | null;
  commentary: string | null;
  commentaryMode: string | null;
  language: string;
  isFavorite: boolean;
  status: ApiReflectionStatus;
  processingError: string | null;
  tags: string[];
  audio: {
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds: number | null;
    playbackUrl: string;
  } | null;
  processingJobs: ApiReflectionProcessingJob[];
  createdAt: string;
  updatedAt: string;
};

export type ApiReflectionListResponse = {
  items: ApiReflectionListItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type ApiDashboardSummary = {
  entriesCount: number;
  latestEntries: ApiJournalEntry[];
  progress: {
    streakDays: number;
    reflectionsThisWeek: number;
    daysSinceLastEntry: number | null;
    practicesCompletedThisWeek: number;
    lessonsCompleted: number;
    totalLessons: number;
    recentCompletions: Array<{
      contentKind: "lesson" | "practice";
      contentSlug: string;
      title: string;
      completedAt: string;
      href: string;
    }>;
  };
};

export type ApiProgressCompletion = {
  id: string;
  contentKind: "lesson" | "practice";
  contentSlug: string;
  completionCount: number;
  lastCompletedAt: string;
};

export type ApiRewardsProgress = {
  earnedCount: number;
  totalCount: number;
  nextMilestone: {
    id: string;
    title: string;
    description: string;
  } | null;
  signals: {
    streakDays: number;
    reflections: number;
    lessonsCompleted: number;
    practiceRuns: number;
    distinctCompletions: number;
  };
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    earned: boolean;
  }>;
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
  context: ApiChatContextTelemetry;
  branch: {
    id: string;
    threadId: string;
    sourceThreadId: string;
    sourceThreadTitle: string;
    sourceMessageId: string;
    sourceMessagePreview: string;
    createdAt: string;
  } | null;
};

export type ApiChatContextState = "ok" | "warning" | "degraded";

export type ApiChatContextTelemetry = {
  summarizedMessageCount: number;
  estimatedPromptTokens: number;
  contextCapacity: number;
  usagePercent: number;
  state: ApiChatContextState;
  autoSummariesCount: number;
  lastSummarizedAt: string | null;
  updatedAt: string;
  summarizedThisTurn?: boolean;
  notice?: string | null;
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

export type ApiOnboardingProfile = {
  id: string;
  userId: string;
  primaryObjective: string;
  dailyTimeCommitment: string;
  preferredPracticeFormat: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiOnboardingResponse = {
  profile: ApiOnboardingProfile | null;
  onboardingCompletedAt: string | null;
};

export type ApiChatEvent = {
  id: string;
  userId: string;
  threadId: string | null;
  eventType: ApiChatEventType;
  payloadJson: string;
  createdAt: string;
};

export type ApiChatEventType =
  | "thread_first_message_created"
  | "thread_auto_titled"
  | "thread_renamed"
  | "thread_archived"
  | "thread_restored"
  | "thread_deleted"
  | "thread_branched"
  | "thread_branch_auto_asked"
  | "message_quoted"
  | "message_pinned"
  | "message_provider_error"
  | "context_auto_summarized"
  | "context_manual_summarized"
  | "context_warning"
  | "context_degraded";

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

export type ApiAcademyDomain = {
  id: number;
  slug: string;
  name: string;
  descriptionShort: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiAcademyTradition = {
  id: number;
  domainId: number;
  parentTraditionId: number | null;
  slug: string;
  name: string;
  originRegion: string | null;
  descriptionShort: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiAcademyPerson = {
  id: number;
  slug: string;
  displayName: string;
  birthYear: number | null;
  deathYear: number | null;
  countryOrRegion: string | null;
  traditionId: number | null;
  roleType: string | null;
  isFounder: boolean;
  credibilityBand: string | null;
  bioShort: string | null;
  evidenceProfile: string | null;
  claimRiskLevel: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiAcademyWork = {
  id: number;
  slug: string;
  personId: number | null;
  traditionId: number | null;
  title: string;
  workType: string | null;
  publicationYear: number | null;
  isPrimaryText: boolean;
  summaryShort: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiAcademyConcept = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  conceptFamily: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiAcademyPersonRelationship = {
  id: number;
  sourcePersonId: number;
  targetPersonId: number;
  relationshipType: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiAcademyConceptLinks = {
  concept: ApiAcademyConcept;
  traditions: ApiAcademyTradition[];
  persons: ApiAcademyPerson[];
  works: ApiAcademyWork[];
};

export type ApiAcademyPathItem = {
  id: number;
  pathId: number;
  entityType: "tradition" | "person" | "work" | "concept";
  entityId: number;
  sortOrder: number;
  rationale: string;
  createdAt: string;
  updatedAt: string;
  tradition: ApiAcademyTradition | null;
  person: ApiAcademyPerson | null;
  work: ApiAcademyWork | null;
  concept: ApiAcademyConcept | null;
};

export type ApiAcademyPath = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  tone: "beginner" | "intermediate";
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  progressionOrder: number;
  recommendationWeight: number;
  recommendationHint: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  items?: ApiAcademyPathItem[];
};

export type ApiAcademySearchResult = {
  type: "domain" | "tradition" | "person" | "work" | "concept";
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  score: number;
  tags: string[];
};

export type ApiAcademyQueryInput = {
  entity?: "domains" | "traditions" | "persons" | "works" | "concepts" | "paths";
  q?: string;
  slug?: string;
  domainId?: number;
  traditionId?: number;
  personId?: number;
  conceptId?: number;
  pathId?: number;
  limit?: number;
  includeRelations?: boolean;
};

export type ApiAcademyQueryResult = {
  entity: "all" | "domains" | "traditions" | "persons" | "works" | "concepts" | "paths";
  q: string;
  domains: ApiAcademyDomain[];
  traditions: ApiAcademyTradition[];
  persons: ApiAcademyPerson[];
  works: ApiAcademyWork[];
  concepts: ApiAcademyConcept[];
  paths: ApiAcademyPath[];
  conceptLinks: ApiAcademyConceptLinks[];
};

export type ApiAcademyConceptRelationEntityType = "tradition" | "person" | "work";

export type ApiAcademyCurationBundle = {
  domains: ApiAcademyDomain[];
  traditions: ApiAcademyTradition[];
  persons: ApiAcademyPerson[];
  works: ApiAcademyWork[];
  concepts: ApiAcademyConcept[];
  paths: ApiAcademyPath[];
  personRelationships: ApiAcademyPersonRelationship[];
  conceptTraditionLinks: Array<{
    id: number;
    conceptId: number;
    traditionId: number;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
  conceptPersonLinks: Array<{
    id: number;
    conceptId: number;
    personId: number;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
  conceptWorkLinks: Array<{
    id: number;
    conceptId: number;
    workId: number;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }>;
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

export type ApiAdminPreviewAnalytics = {
  days: number;
  totals: {
    events: number;
    sessionsPreviewed: number;
    sessionsReachedSignup: number;
    signupConversionRate: number;
  };
  countsByType: Record<string, number>;
};

export type ApiAdminSystemJobRun = {
  id: string;
  jobName: string;
  status: string;
  usersScanned: number;
  usersWithDigestEnabled: number;
  notificationsCreated: number;
  duplicatesSkipped: number;
  startedAt: string;
  finishedAt: string | null;
  errorMessage: string | null;
};

export type ApiAdminSystemJobSummary = {
  jobName: string;
  failureWindowMinutes: number;
  staleLockMinutes: number;
  healthy: boolean;
  latestStatus: string | null;
  latestRunAt: string | null;
  latestRunAgeMinutes: number | null;
  latestSuccessAt: string | null;
  latestErrorAt: string | null;
  latestErrorMessage: string | null;
  runsLast24h: number;
  runsLast7d: number;
  successRuns7d: number;
  successRate7d: number;
  lock: {
    path: string;
    exists: boolean;
    startedAt: string | null;
    ageMinutes: number | null;
    staleDetected: boolean;
  };
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
  message: z.string().optional(),
  code: z.string().optional(),
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
      const message = parsed.data.message ?? parsed.data.error ?? response.statusText ?? "Request failed";

      return {
        message,
        code: parsed.data.code ?? parsed.data.error,
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
  email: string;
  password: string;
  acceptLegal: boolean;
}): Promise<ApiSignupResult> {
  return requestJson<ApiSignupResult>("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiVerifyEmail(input: {
  token?: string;
  email?: string;
  code?: string;
}): Promise<ApiVerifyEmailResult> {
  return requestJson<ApiVerifyEmailResult>("/api/v1/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function apiResendVerification(email: string): Promise<ApiResendVerificationResult> {
  return requestJson<ApiResendVerificationResult>("/api/v1/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
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

export async function apiMe(token: string): Promise<ApiMePayload> {
  return requestJson<ApiMePayload>("/api/v1/auth/me", withAuth(token));
}

export async function apiPatchMe(
  token: string,
  input: {
    name?: string;
    profile?: {
      username?: string | null;
      summary?: string;
      phone?: string;
      city?: string;
      country?: string;
      socialLinks?: ApiSocialLink[];
    };
    preferences?: {
      language?: string;
      timezone?: string;
      profileVisibility?: "public" | "private" | "contacts";
      showEmail?: boolean;
      showPhone?: boolean;
      allowContact?: boolean;
    };
  },
): Promise<{ user: ApiUser; profile: ApiUserProfile; preferences: ApiUserPreferences }> {
  return requestJson<{ user: ApiUser; profile: ApiUserProfile; preferences: ApiUserPreferences }>(
    "/api/v1/auth/me",
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiChangePassword(
  token: string,
  input: { oldPassword: string; newPassword: string; confirmPassword: string },
): Promise<{ updated: true }> {
  return requestJson<{ updated: true }>(
    "/api/v1/auth/change-password",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiDeleteAccount(
  token: string,
  input: { emailConfirm: string; passwordConfirm: string },
): Promise<{ deleted: true }> {
  return requestJson<{ deleted: true }>(
    "/api/v1/auth/delete",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
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

export async function apiReflectionsList(
  token: string,
  input?: {
    page?: number;
    pageSize?: number;
    q?: string;
    favorite?: boolean;
    status?: ApiReflectionStatus;
  },
): Promise<ApiReflectionListResponse> {
  const params = new URLSearchParams();
  params.set("page", String(Math.max(1, input?.page ?? 1)));
  params.set("pageSize", String(Math.max(1, Math.min(30, input?.pageSize ?? 12))));
  if (input?.q) {
    params.set("q", input.q);
  }
  if (input?.favorite !== undefined) {
    params.set("favorite", input.favorite ? "true" : "false");
  }
  if (input?.status) {
    params.set("status", input.status);
  }

  return requestJson<ApiReflectionListResponse>(`/api/v1/reflections?${params.toString()}`, withAuth(token));
}

export async function apiReflectionCreate(
  token: string,
  input: {
    sourceType: ApiReflectionSourceType;
    title?: string;
    rawText?: string;
    tags?: string[];
    language?: string;
    commentaryMode?: string | null;
    audio?: {
      fileName: string;
      mimeType: string;
      base64Data: string;
      durationSeconds?: number;
    };
  },
): Promise<ApiReflectionDetail> {
  return requestJson<ApiReflectionDetail>(
    "/api/v1/reflections",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiReflectionById(token: string, reflectionId: string): Promise<ApiReflectionDetail> {
  return requestJson<ApiReflectionDetail>(`/api/v1/reflections/${reflectionId}`, withAuth(token));
}

export async function apiReflectionUpdate(
  token: string,
  reflectionId: string,
  input: {
    title?: string;
    tags?: string[];
    isFavorite?: boolean;
    refinedText?: string;
  },
): Promise<ApiReflectionDetail> {
  return requestJson<ApiReflectionDetail>(
    `/api/v1/reflections/${reflectionId}`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiReflectionDelete(token: string, reflectionId: string): Promise<void> {
  return requestJson<void>(
    `/api/v1/reflections/${reflectionId}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiReflectionRegenerateCommentary(
  token: string,
  reflectionId: string,
): Promise<ApiReflectionDetail> {
  return requestJson<ApiReflectionDetail>(
    `/api/v1/reflections/${reflectionId}/commentary/regenerate`,
    withAuth(token, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  );
}

export async function apiReflectionRetry(
  token: string,
  reflectionId: string,
): Promise<ApiReflectionDetail> {
  return requestJson<ApiReflectionDetail>(
    `/api/v1/reflections/${reflectionId}/retry`,
    withAuth(token, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  );
}

export async function apiReflectionSendToCompanion(
  token: string,
  reflectionId: string,
): Promise<{ threadId: string; href: string }> {
  return requestJson<{ threadId: string; href: string }>(
    `/api/v1/reflections/${reflectionId}/send-to-companion`,
    withAuth(token, {
      method: "POST",
      body: JSON.stringify({}),
    }),
  );
}

export async function apiTrackContentCompletion(
  token: string,
  input: { contentKind: "lesson" | "practice"; contentSlug: string },
): Promise<void> {
  await requestJson<void>(
    "/api/v1/progress/complete",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiProgressCompletions(
  token: string,
  limit = 300,
): Promise<ApiProgressCompletion[]> {
  return requestJson<ApiProgressCompletion[]>(
    `/api/v1/progress/completions?limit=${Math.max(1, Math.min(limit, 500))}`,
    withAuth(token),
  );
}

export async function apiRewardsProgress(token: string): Promise<ApiRewardsProgress> {
  return requestJson<ApiRewardsProgress>("/api/v1/progress/rewards", withAuth(token));
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

export async function apiAcademyOverview(): Promise<{
  overview: {
    domainCount: number;
    traditionCount: number;
    personCount: number;
    workCount: number;
    conceptCount: number;
    relationshipCount: number;
    conceptLinkCount: number;
    pathCount: number;
  };
  featuredPaths: ApiAcademyPath[];
}> {
  return requestJson<{
    overview: {
      domainCount: number;
      traditionCount: number;
      personCount: number;
      workCount: number;
      conceptCount: number;
      relationshipCount: number;
      conceptLinkCount: number;
      pathCount: number;
    };
    featuredPaths: ApiAcademyPath[];
  }>("/api/v1/academy");
}

export async function apiAcademyDomains(input?: {
  q?: string;
  limit?: number;
}): Promise<ApiAcademyDomain[]> {
  const params = new URLSearchParams();
  if (input?.q) {
    params.set("q", input.q);
  }
  if (typeof input?.limit === "number") {
    params.set("limit", String(input.limit));
  }
  const qs = params.toString();
  return requestJson<ApiAcademyDomain[]>(`/api/v1/academy/domains${qs ? `?${qs}` : ""}`);
}

export async function apiAcademyDomainBySlug(
  slug: string,
): Promise<{ domain: ApiAcademyDomain; traditions: ApiAcademyTradition[] }> {
  return requestJson<{ domain: ApiAcademyDomain; traditions: ApiAcademyTradition[] }>(
    `/api/v1/academy/domains/${encodeURIComponent(slug)}`,
  );
}

export async function apiAcademyTraditions(input?: {
  q?: string;
  limit?: number;
  domainId?: number;
  domain?: string;
  parentTraditionId?: number;
}): Promise<ApiAcademyTradition[]> {
  const params = new URLSearchParams();
  if (input?.q) {
    params.set("q", input.q);
  }
  if (typeof input?.limit === "number") {
    params.set("limit", String(input.limit));
  }
  if (typeof input?.domainId === "number") {
    params.set("domainId", String(input.domainId));
  }
  if (input?.domain) {
    params.set("domain", input.domain);
  }
  if (typeof input?.parentTraditionId === "number") {
    params.set("parentTraditionId", String(input.parentTraditionId));
  }
  const qs = params.toString();
  return requestJson<ApiAcademyTradition[]>(`/api/v1/academy/traditions${qs ? `?${qs}` : ""}`);
}

export async function apiAcademyTraditionBySlug(slug: string): Promise<{
  tradition: ApiAcademyTradition;
  persons: ApiAcademyPerson[];
  works: ApiAcademyWork[];
  concepts: ApiAcademyConcept[];
}> {
  return requestJson<{
    tradition: ApiAcademyTradition;
    persons: ApiAcademyPerson[];
    works: ApiAcademyWork[];
    concepts: ApiAcademyConcept[];
  }>(`/api/v1/academy/traditions/${encodeURIComponent(slug)}`);
}

export async function apiAcademyPersons(input?: {
  q?: string;
  limit?: number;
  domainId?: number;
  traditionId?: number;
  credibilityBand?: string;
}): Promise<ApiAcademyPerson[]> {
  const params = new URLSearchParams();
  if (input?.q) {
    params.set("q", input.q);
  }
  if (typeof input?.limit === "number") {
    params.set("limit", String(input.limit));
  }
  if (typeof input?.domainId === "number") {
    params.set("domainId", String(input.domainId));
  }
  if (typeof input?.traditionId === "number") {
    params.set("traditionId", String(input.traditionId));
  }
  if (input?.credibilityBand) {
    params.set("credibilityBand", input.credibilityBand);
  }
  const qs = params.toString();
  return requestJson<ApiAcademyPerson[]>(`/api/v1/academy/persons${qs ? `?${qs}` : ""}`);
}

export async function apiAcademyPersonBySlug(slug: string): Promise<{
  person: ApiAcademyPerson;
  works: ApiAcademyWork[];
  concepts: ApiAcademyConcept[];
  relationships: ApiAcademyPersonRelationship[];
}> {
  return requestJson<{
    person: ApiAcademyPerson;
    works: ApiAcademyWork[];
    concepts: ApiAcademyConcept[];
    relationships: ApiAcademyPersonRelationship[];
  }>(`/api/v1/academy/persons/${encodeURIComponent(slug)}`);
}

export async function apiAcademyWorks(input?: {
  q?: string;
  limit?: number;
  personId?: number;
  traditionId?: number;
  isPrimaryText?: boolean;
}): Promise<ApiAcademyWork[]> {
  const params = new URLSearchParams();
  if (input?.q) {
    params.set("q", input.q);
  }
  if (typeof input?.limit === "number") {
    params.set("limit", String(input.limit));
  }
  if (typeof input?.personId === "number") {
    params.set("personId", String(input.personId));
  }
  if (typeof input?.traditionId === "number") {
    params.set("traditionId", String(input.traditionId));
  }
  if (typeof input?.isPrimaryText === "boolean") {
    params.set("isPrimaryText", String(input.isPrimaryText));
  }
  const qs = params.toString();
  return requestJson<ApiAcademyWork[]>(`/api/v1/academy/works${qs ? `?${qs}` : ""}`);
}

export async function apiAcademyWorkBySlug(slug: string): Promise<{
  work: ApiAcademyWork;
  author: ApiAcademyPerson | null;
  tradition: ApiAcademyTradition | null;
  concepts: ApiAcademyConcept[];
  relatedWorks: ApiAcademyWork[];
}> {
  return requestJson<{
    work: ApiAcademyWork;
    author: ApiAcademyPerson | null;
    tradition: ApiAcademyTradition | null;
    concepts: ApiAcademyConcept[];
    relatedWorks: ApiAcademyWork[];
  }>(`/api/v1/academy/works/${encodeURIComponent(slug)}`);
}

export async function apiAcademyConcepts(input?: {
  q?: string;
  limit?: number;
  family?: string;
  traditionId?: number;
  personId?: number;
  workId?: number;
}): Promise<ApiAcademyConcept[]> {
  const params = new URLSearchParams();
  if (input?.q) {
    params.set("q", input.q);
  }
  if (typeof input?.limit === "number") {
    params.set("limit", String(input.limit));
  }
  if (input?.family) {
    params.set("family", input.family);
  }
  if (typeof input?.traditionId === "number") {
    params.set("traditionId", String(input.traditionId));
  }
  if (typeof input?.personId === "number") {
    params.set("personId", String(input.personId));
  }
  if (typeof input?.workId === "number") {
    params.set("workId", String(input.workId));
  }
  const qs = params.toString();
  return requestJson<ApiAcademyConcept[]>(`/api/v1/academy/concepts${qs ? `?${qs}` : ""}`);
}

export async function apiAcademyConceptBySlug(slug: string): Promise<{
  concept: ApiAcademyConcept;
  links: ApiAcademyConceptLinks | null;
}> {
  return requestJson<{ concept: ApiAcademyConcept; links: ApiAcademyConceptLinks | null }>(
    `/api/v1/academy/concepts/${encodeURIComponent(slug)}`,
  );
}

export async function apiAcademyConceptLinks(slug: string): Promise<ApiAcademyConceptLinks> {
  return requestJson<ApiAcademyConceptLinks>(`/api/v1/academy/concepts/${encodeURIComponent(slug)}/links`);
}

export async function apiAcademyPaths(input?: {
  q?: string;
  limit?: number;
  featured?: boolean;
  includeItems?: boolean;
}): Promise<ApiAcademyPath[]> {
  const params = new URLSearchParams();
  if (input?.q) {
    params.set("q", input.q);
  }
  if (typeof input?.limit === "number") {
    params.set("limit", String(input.limit));
  }
  if (typeof input?.featured === "boolean") {
    params.set("featured", String(input.featured));
  }
  if (typeof input?.includeItems === "boolean") {
    params.set("includeItems", String(input.includeItems));
  }
  const qs = params.toString();
  return requestJson<ApiAcademyPath[]>(`/api/v1/academy/paths${qs ? `?${qs}` : ""}`);
}

export async function apiAcademyPathBySlug(slug: string): Promise<ApiAcademyPath> {
  return requestJson<ApiAcademyPath>(`/api/v1/academy/paths/${encodeURIComponent(slug)}`);
}

export async function apiAcademySearch(
  q: string,
  limit = 40,
): Promise<ApiAcademySearchResult[]> {
  const params = new URLSearchParams({
    q,
    limit: String(limit),
  });

  return requestJson<ApiAcademySearchResult[]>(`/api/v1/academy/search?${params.toString()}`);
}

export async function apiAcademyQuery(
  token: string,
  input: ApiAcademyQueryInput,
): Promise<ApiAcademyQueryResult> {
  return requestJson<ApiAcademyQueryResult>(
    "/api/v1/academy/query",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminAcademyCuration(
  token: string,
  limit = 300,
): Promise<ApiAcademyCurationBundle> {
  return requestJson<ApiAcademyCurationBundle>(
    `/api/v1/admin/academy/curation?limit=${limit}`,
    withAuth(token),
  );
}

export async function apiAdminUpdateAcademyPath(
  token: string,
  id: number,
  input: {
    title?: string;
    summary?: string;
    tone?: "beginner" | "intermediate";
    difficultyLevel?: "beginner" | "intermediate" | "advanced";
    progressionOrder?: number;
    recommendationWeight?: number;
    recommendationHint?: string;
    isFeatured?: boolean;
  },
): Promise<ApiAcademyPath> {
  return requestJson<ApiAcademyPath>(
    `/api/v1/admin/academy/paths/${id}`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminReplaceAcademyPathItems(
  token: string,
  id: number,
  items: Array<{
    entityType: "tradition" | "person" | "work" | "concept";
    entityId: number;
    rationale?: string;
    sortOrder?: number;
  }>,
): Promise<ApiAcademyPath> {
  return requestJson<ApiAcademyPath>(
    `/api/v1/admin/academy/paths/${id}/items`,
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),
  );
}

export async function apiAdminUpdateAcademyPersonEditorial(
  token: string,
  id: number,
  input: {
    credibilityBand?: "foundational" | "major" | "secondary" | "popularizer" | "controversial" | null;
    evidenceProfile?: string | null;
    claimRiskLevel?: "low" | "medium" | "high" | null;
    bioShort?: string | null;
  },
): Promise<ApiAcademyPerson> {
  return requestJson<ApiAcademyPerson>(
    `/api/v1/admin/academy/persons/${id}/editorial`,
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminUpsertAcademyPersonRelationship(
  token: string,
  input: {
    id?: number;
    sourcePersonId: number;
    targetPersonId: number;
    relationshipType: string;
    notes?: string | null;
  },
): Promise<ApiAcademyPersonRelationship> {
  return requestJson<ApiAcademyPersonRelationship>(
    "/api/v1/admin/academy/relationships/persons",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminDeleteAcademyPersonRelationship(
  token: string,
  id: number,
): Promise<void> {
  await requestJson<{ ok: true }>(
    `/api/v1/admin/academy/relationships/persons/${id}`,
    withAuth(token, {
      method: "DELETE",
    }),
  );
}

export async function apiAdminUpsertAcademyConceptRelation(
  token: string,
  input: {
    conceptId: number;
    entityType: ApiAcademyConceptRelationEntityType;
    entityId: number;
    sortOrder?: number;
  },
): Promise<{ ok: true; links: ApiAcademyConceptLinks | null }> {
  return requestJson<{ ok: true; links: ApiAcademyConceptLinks | null }>(
    "/api/v1/admin/academy/relationships/concepts",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminDeleteAcademyConceptRelation(
  token: string,
  input: {
    conceptId: number;
    entityType: ApiAcademyConceptRelationEntityType;
    entityId: number;
  },
): Promise<void> {
  await requestJson<{ ok: true }>(
    "/api/v1/admin/academy/relationships/concepts",
    withAuth(token, {
      method: "DELETE",
      body: JSON.stringify(input),
    }),
  );
}

export async function apiAdminContent(token: string): Promise<AdminContentBundle> {
  return requestJson<AdminContentBundle>("/api/v1/admin/content", withAuth(token));
}

export async function apiAdminAudit(token: string, limit = 40): Promise<ApiAdminAuditLog[]> {
  return requestJson<ApiAdminAuditLog[]>(`/api/v1/admin/audit?limit=${limit}`, withAuth(token));
}

export async function apiAdminChatEvents(
  token: string,
  input?: {
    limit?: number;
    threadId?: string;
    userId?: string;
    eventType?: ApiChatEventType;
    days?: number;
    memoryOnly?: boolean;
  },
): Promise<ApiChatEvent[]> {
  const params = new URLSearchParams();
  const limit = input?.limit ?? 200;
  params.set("limit", String(limit));
  if (input?.threadId) {
    params.set("threadId", input.threadId);
  }
  if (input?.userId) {
    params.set("userId", input.userId);
  }
  if (input?.eventType) {
    params.set("eventType", input.eventType);
  }
  if (typeof input?.days === "number" && Number.isFinite(input.days) && input.days > 0) {
    params.set("days", String(Math.floor(input.days)));
  }
  if (input?.memoryOnly) {
    params.set("memoryOnly", "true");
  }

  return requestJson<ApiChatEvent[]>(`/api/v1/admin/chat/events?${params.toString()}`, withAuth(token));
}

export async function apiAdminPreviewAnalytics(
  token: string,
  days = 30,
): Promise<ApiAdminPreviewAnalytics> {
  return requestJson<ApiAdminPreviewAnalytics>(
    `/api/v1/admin/preview/analytics?days=${days}`,
    withAuth(token),
  );
}

export async function apiAdminSystemJobRuns(
  token: string,
  input?: {
    limit?: number;
    jobName?: string;
    status?: "running" | "success" | "error" | "skipped";
    days?: number;
  },
): Promise<ApiAdminSystemJobRun[]> {
  const params = new URLSearchParams();
  if (input?.limit) {
    params.set("limit", String(input.limit));
  }
  if (input?.jobName) {
    params.set("jobName", input.jobName);
  }
  if (input?.status) {
    params.set("status", input.status);
  }
  if (input?.days) {
    params.set("days", String(input.days));
  }
  const qs = params.toString();
  return requestJson<ApiAdminSystemJobRun[]>(
    `/api/v1/admin/system/jobs/runs${qs ? `?${qs}` : ""}`,
    withAuth(token),
  );
}

export async function apiAdminSystemJobSummary(
  token: string,
  input?: { jobName?: string; failureWindowMinutes?: number; staleLockMinutes?: number },
): Promise<ApiAdminSystemJobSummary> {
  const params = new URLSearchParams();
  if (input?.jobName) {
    params.set("jobName", input.jobName);
  }
  if (input?.failureWindowMinutes) {
    params.set("failureWindowMinutes", String(input.failureWindowMinutes));
  }
  if (input?.staleLockMinutes) {
    params.set("staleLockMinutes", String(input.staleLockMinutes));
  }
  const qs = params.toString();
  return requestJson<ApiAdminSystemJobSummary>(
    `/api/v1/admin/system/jobs/summary${qs ? `?${qs}` : ""}`,
    withAuth(token),
  );
}

export async function apiAdminUnlockSystemJob(
  token: string,
  input?: { jobName?: string; minAgeMinutes?: number },
): Promise<{ unlocked: boolean; lockPath: string; lockAgeMinutes: number | null }> {
  return requestJson<{ unlocked: boolean; lockPath: string; lockAgeMinutes: number | null }>(
    "/api/v1/admin/system/jobs/unlock",
    withAuth(token, {
      method: "POST",
      body: JSON.stringify({
        jobName: input?.jobName ?? "notification_digest",
        minAgeMinutes: input?.minAgeMinutes ?? 30,
      }),
    }),
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

export async function apiNotificationPreferences(
  token: string,
): Promise<ApiNotificationPreferences> {
  return requestJson<ApiNotificationPreferences>(
    "/api/v1/notifications/preferences",
    withAuth(token),
  );
}

export async function apiSetNotificationPreferences(
  token: string,
  input: Partial<
    Pick<
      ApiNotificationPreferences,
      | "emailChallenges"
      | "emailEvents"
      | "emailUpdates"
      | "emailMarketing"
      | "pushChallenges"
      | "pushEvents"
      | "pushUpdates"
      | "digest"
    >
  >,
): Promise<ApiNotificationPreferences> {
  return requestJson<ApiNotificationPreferences>(
    "/api/v1/notifications/preferences",
    withAuth(token, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
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
): Promise<{ answer: string; context: ApiChatContextTelemetry }> {
  return requestJson<{ answer: string; context: ApiChatContextTelemetry }>(
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

export async function apiOnboarding(token: string): Promise<ApiOnboardingResponse> {
  return requestJson<ApiOnboardingResponse>("/api/v1/onboarding", withAuth(token));
}

export async function apiUpsertOnboarding(
  token: string,
  input: {
    primaryObjective: string;
    dailyTimeCommitment: string;
    preferredPracticeFormat: string;
    notes?: string;
  },
): Promise<ApiOnboardingResponse> {
  return requestJson<ApiOnboardingResponse>(
    "/api/v1/onboarding",
    withAuth(token, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  );
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
