import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  or,
  type SQL,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import {
  academyConceptPersons,
  academyConceptTraditions,
  academyConceptWorks,
  academyConcepts,
  academyDomains,
  academyPathItems,
  academyPaths,
  academyPersonRelationships,
  academyPersons,
  academyTraditions,
  academyWorks,
  adminAuditLogs,
  invitations,
  signupIntents,
  chatEvents,
  chatMessages,
  chatThreadBranches,
  chatThreadContexts,
  chatThreads,
  communityChallenges,
  communityCircles,
  userDeletionAudit,
  communityEvents,
  communityExperts,
  communityResources,
  contentHighlights,
  contentPillars,
  creatorVideos,
  emailVerificationChallenges,
  journalEntries,
  reflectionEntries,
  reflectionAudioAssets,
  reflectionTags,
  reflectionProcessingJobs,
  reflectionEvents,
  userContentCompletions,
  libraryLessons,
  mfaChallenges,
  passkeyCredentials,
  previewEvents,
  rateLimitBlockEvents,
  rateLimitPolicyOverrides,
  practiceRoutines,
  refreshSessions,
  sessions,
  systemJobRuns,
  userNotificationPreferences,
  userPreferences,
  userProfiles,
  userLegalConsents,
  userCompanionPreferences,
  userDevices,
  userNotifications,
  userOnboardingProfiles,
  userTotpSecrets,
  users,
  type AvatarType,
  type AcademyPathDifficulty,
  type AcademyPathEntityType,
  type AcademyPathTone,
  type ContentCompletionKind,
  type ContentStatus,
  type LegalPolicyType,
  type PreviewEventType,
  type ReflectionEventType,
  type ReflectionProcessingJobStatus,
  type ReflectionProcessingStep,
  type ReflectionSourceType,
  type ReflectionStatus,
  type RateLimitOverrideScopeType,
  type SignupFlowType,
  type UserRole,
} from "./schema.js";
import {
  COMMUNITY_CHALLENGES_SEED,
  COMMUNITY_EVENTS_SEED,
  COMMUNITY_EXPERTS_SEED,
  COMMUNITY_RESOURCES_SEED,
  COMMUNITY_SEED,
  CREATOR_VIDEOS_SEED,
  HIGHLIGHT_SEED,
  LIBRARY_SEED,
  PILLAR_SEED,
  PRACTICE_SEED,
} from "./seed-data.js";
import {
  ACADEMY_CONCEPT_PERSON_LINKS,
  ACADEMY_CONCEPT_TRADITION_LINKS,
  ACADEMY_CONCEPT_WORK_LINKS,
  ACADEMY_PATHS_SEED,
} from "./academy-editorial-seed.js";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerifiedAt: string | null;
  onboardingCompletedAt: string | null;
};

export type AdminUserListItemRecord = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  role: UserRole;
  emailVerifiedAt: string | null;
  createdAt: string;
};

export type AdminOverviewStatsRecord = {
  users: {
    total: number;
    admins: number;
    nonAdmins: number;
    verified: number;
    unverified: number;
    createdLast7Days: number;
  };
  invitations: {
    total: number;
    active: number;
    used: number;
    revoked: number;
    expired: number;
    expiringSoon: number;
    createdLast7Days: number;
    redeemedLast7Days: number;
  };
};

export type InvitationRecord = {
  id: string;
  tokenHash: string;
  email: string | null;
  roleToGrant: UserRole;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  createdByUserId: string;
  createdAt: string;
  usedAt: string | null;
  usedByUserId: string | null;
  revokedAt: string | null;
};

export type SignupIntentRecord = {
  id: string;
  email: string;
  flowType: SignupFlowType;
  inviteId: string | null;
  inviteTokenHash: string | null;
  verificationTokenHash: string;
  verificationCodeHash: string;
  verificationExpiresAt: string;
  verificationSentAt: string;
  verificationSendCount: number;
  emailVerifiedAt: string | null;
  completionTokenHash: string | null;
  completionExpiresAt: string | null;
  legalAcceptedAt: string | null;
  legalTermsVersion: string | null;
  privacyVersion: string | null;
  locale: string | null;
  expiresAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EmailVerificationChallengeRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  codeHash: string;
  expiresAt: string;
  createdAt: string;
  consumedAt: string | null;
  lastSentAt: string;
  sendCount: number;
};

export type OnboardingProfileRecord = {
  id: string;
  userId: string;
  primaryGoal: "reflect_more_clearly" | "reduce_stress" | "build_discipline" | "explore_philosophy" | "improve_emotional_awareness";
  preferredTopics: Array<"stoicism" | "epicureanism" | "mindfulness" | "psychology" | "habits" | "journaling">;
  experienceLevel: "new_to_philosophy" | "somewhat_familiar" | "advanced";
  primaryObjective: string;
  biggestDifficulty: string;
  mainNeed: string;
  dailyTimeCommitment: string;
  coachingStyle: string;
  contemplativeExperience: string;
  preferredPracticeFormat: string;
  successDefinition30d: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SecuritySettings = {
  mfaEnabled: boolean;
  passkeyEnabled: boolean;
};

export type PasskeyCredentialRecord = {
  id: string;
  userId: string;
  credentialId: string;
  nickname: string | null;
  publicKey: string;
  counter: number;
  transports: string[];
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NotificationRecord = {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  readAt: string | null;
  createdAt: string;
};

export type ReflectionAudioAssetRecord = {
  id: string;
  reflectionId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  createdAt: string;
};

export type ReflectionTagRecord = {
  id: string;
  reflectionId: string;
  tag: string;
  createdAt: string;
};

export type ReflectionProcessingJobRecord = {
  id: string;
  reflectionId: string;
  step: ReflectionProcessingStep;
  status: ReflectionProcessingJobStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReflectionEntryRecord = {
  id: string;
  userId: string;
  title: string;
  sourceType: ReflectionSourceType;
  rawText: string;
  cleanTranscript: string | null;
  refinedText: string | null;
  commentary: string | null;
  commentaryMode: string | null;
  language: string;
  isFavorite: boolean;
  status: ReflectionStatus;
  processingError: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tags: ReflectionTagRecord[];
  audioAssets: ReflectionAudioAssetRecord[];
  processingJobs: ReflectionProcessingJobRecord[];
};

export type ReflectionListItemRecord = {
  id: string;
  userId: string;
  title: string;
  sourceType: ReflectionSourceType;
  status: ReflectionStatus;
  isFavorite: boolean;
  commentary: string | null;
  cleanTranscript: string | null;
  refinedText: string | null;
  rawText: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  preview: string;
  tags: string[];
  hasAudio: boolean;
};

export type ChatThreadRecord = {
  id: string;
  userId: string;
  title: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  context: ChatThreadContextRecord;
  branch: ChatThreadBranchRecord | null;
};

export type ChatThreadBranchRecord = {
  id: string;
  threadId: string;
  sourceThreadId: string;
  sourceThreadTitle: string;
  sourceMessageId: string;
  sourceMessagePreview: string;
  createdAt: string;
};

export type ChatMessageRecord = {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ChatThreadScope = "active" | "archived" | "all";

export type ChatContextState = "ok" | "warning" | "degraded";

export type ChatThreadContextRecord = {
  id: string;
  threadId: string;
  summary: string;
  summarizedMessageCount: number;
  estimatedPromptTokens: number;
  contextCapacity: number;
  usagePercent: number;
  state: ChatContextState;
  autoSummariesCount: number;
  lastSummarizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanionPreferencesRecord = {
  id: string;
  userId: string;
  customInstructions: string;
  createdAt: string;
  updatedAt: string;
};

export type ChatEventType =
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

export type ChatEventRecord = {
  id: string;
  userId: string;
  threadId: string | null;
  eventType: ChatEventType;
  payloadJson: string;
  createdAt: string;
};

export type PreviewEventRecord = {
  id: string;
  sessionId: string;
  eventType: PreviewEventType;
  path: string;
  referrer: string | null;
  metadataJson: string;
  createdAt: string;
};

export type RateLimitBlockEventRecord = {
  id: string;
  policyKey: string;
  route: string;
  method: string;
  ipHash: string;
  ipMasked: string | null;
  userId: string | null;
  country: string | null;
  plan: string | null;
  trustLevel: string | null;
  blocked: boolean;
  retryAfterSeconds: number;
  requestCount: number;
  limitValue: number;
  windowSeconds: number;
  scopeType: string;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
};

export type RateLimitPolicyOverrideRecord = {
  id: string;
  policyKey: string;
  scopeType: RateLimitOverrideScopeType;
  scopeValue: string | null;
  windowSeconds: number | null;
  maxRequests: number | null;
  anonymousMaxRequests: number | null;
  authenticatedMaxRequests: number | null;
  burstRequests: number | null;
  costWeight: number | null;
  enabled: boolean | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SystemJobRunRecord = {
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

export type UserDeviceRecord = {
  id: string;
  userId: string;
  label: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastSeenAt: string;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RefreshSessionContext = {
  user: CurrentUser;
  deviceId: string | null;
};

export type UserAuthRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  mfaEnabled: boolean;
  passkeyEnabled: boolean;
  emailVerifiedAt: string | null;
  onboardingCompletedAt: string | null;
  deletedAt: string | null;
  anonymizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileRecord = {
  id: string;
  userId: string;
  username: string | null;
  avatarType: AvatarType;
  avatarPreset: string | null;
  avatarImageKey: string | null;
  summary: string;
  phone: string;
  city: string;
  country: string;
  socialLinks: Array<{ label: string; url: string }>;
  createdAt: string;
  updatedAt: string;
};

export type UserPreferencesRecord = {
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

export type UserNotificationPreferencesRecord = {
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

export type ContentCompletionRecord = {
  id: string;
  userId: string;
  contentKind: ContentCompletionKind;
  contentSlug: string;
  completionCount: number;
  lastCompletedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type UserContentCompletionSummary = {
  lessonsCompleted: number;
  practicesCompletedThisWeek: number;
  totalLessons: number;
};

export type RecentContentCompletionItem = {
  contentKind: ContentCompletionKind;
  contentSlug: string;
  completionCount: number;
  lastCompletedAt: string;
};

type AcademyDomainSeed = {
  id: number;
  slug: string;
  name: string;
  description_short?: string | null;
};

type AcademyTraditionSeed = {
  id: number;
  domain_id: number;
  parent_tradition_id?: number | null;
  slug: string;
  name: string;
  origin_region?: string | null;
  description_short?: string | null;
};

type AcademyPersonSeed = {
  id: number;
  slug: string;
  display_name: string;
  birth_year?: number | null;
  death_year?: number | null;
  country_or_region?: string | null;
  tradition_id?: number | null;
  role_type?: string | null;
  is_founder?: boolean | null;
  credibility_band?: string | null;
  bio_short?: string | null;
  evidence_profile?: string | null;
  claim_risk_level?: string | null;
};

type AcademyWorkSeed = {
  id: number;
  person_id?: number | null;
  tradition_id?: number | null;
  title: string;
  work_type?: string | null;
  publication_year?: number | null;
  is_primary_text?: boolean | null;
  summary_short?: string | null;
};

type AcademyConceptSeed = {
  id: number;
  slug: string;
  name: string;
  description?: string | null;
  concept_family?: string | null;
};

type AcademyPersonRelationshipSeed = {
  id: number;
  source_person_id: number;
  target_person_id: number;
  relationship_type: string;
  notes?: string | null;
};

type AcademyKnowledgeSeed = {
  domains: AcademyDomainSeed[];
  traditions: AcademyTraditionSeed[];
  persons: AcademyPersonSeed[];
  works: AcademyWorkSeed[];
  concepts: AcademyConceptSeed[];
  person_relationships: AcademyPersonRelationshipSeed[];
};

function loadAcademyKnowledgeSeed(): AcademyKnowledgeSeed {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const seedPath = path.join(here, "academy-knowledge-seed.json");
  const parsed = JSON.parse(readFileSync(seedPath, "utf8")) as Partial<AcademyKnowledgeSeed>;

  if (
    !Array.isArray(parsed.domains) ||
    !Array.isArray(parsed.traditions) ||
    !Array.isArray(parsed.persons) ||
    !Array.isArray(parsed.works) ||
    !Array.isArray(parsed.concepts) ||
    !Array.isArray(parsed.person_relationships)
  ) {
    throw new Error("Academy seed is invalid or incomplete.");
  }

  return parsed as AcademyKnowledgeSeed;
}

const ACADEMY_KNOWLEDGE_SEED = loadAcademyKnowledgeSeed();

export type AcademyDomainRecord = {
  id: number;
  slug: string;
  name: string;
  descriptionShort: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AcademyTraditionRecord = {
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

export type AcademyPersonRecord = {
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

export type AcademyWorkRecord = {
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

export type AcademyConceptRecord = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  conceptFamily: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AcademyPersonRelationshipRecord = {
  id: number;
  sourcePersonId: number;
  targetPersonId: number;
  relationshipType: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AcademyConceptTraditionLinkRecord = {
  id: number;
  conceptId: number;
  traditionId: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AcademyConceptPersonLinkRecord = {
  id: number;
  conceptId: number;
  personId: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AcademyConceptWorkLinkRecord = {
  id: number;
  conceptId: number;
  workId: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AcademyPathRecord = {
  id: number;
  slug: string;
  title: string;
  summary: string;
  tone: AcademyPathTone;
  difficultyLevel: AcademyPathDifficulty;
  progressionOrder: number;
  recommendationWeight: number;
  recommendationHint: string;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AcademyPathItemRecord = {
  id: number;
  pathId: number;
  entityType: AcademyPathEntityType;
  entityId: number;
  sortOrder: number;
  rationale: string;
  createdAt: string;
  updatedAt: string;
};

export type AcademyPathResolvedItemRecord = AcademyPathItemRecord & {
  tradition: AcademyTraditionRecord | null;
  person: AcademyPersonRecord | null;
  work: AcademyWorkRecord | null;
  concept: AcademyConceptRecord | null;
};

export type AcademyPathDetailRecord = AcademyPathRecord & {
  items: AcademyPathResolvedItemRecord[];
};

export type AcademyConceptLinksRecord = {
  concept: AcademyConceptRecord;
  traditions: AcademyTraditionRecord[];
  persons: AcademyPersonRecord[];
  works: AcademyWorkRecord[];
};

export type AcademySearchResultRecord = {
  type: "domain" | "tradition" | "person" | "work" | "concept";
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  score: number;
  tags: string[];
};

export type AcademyKnowledgeEntity = "domains" | "traditions" | "persons" | "works" | "concepts" | "paths";

export type AcademyKnowledgeQueryInput = {
  entity?: AcademyKnowledgeEntity;
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

export type AcademyKnowledgeQueryResult = {
  entity: AcademyKnowledgeEntity | "all";
  q: string;
  domains: AcademyDomainRecord[];
  traditions: AcademyTraditionRecord[];
  persons: AcademyPersonRecord[];
  works: AcademyWorkRecord[];
  concepts: AcademyConceptRecord[];
  paths: AcademyPathDetailRecord[];
  conceptLinks: AcademyConceptLinksRecord[];
};

export type AcademyConceptRelationEntityType = "tradition" | "person" | "work";

export type AcademyCurationSnapshotRecord = {
  domains: AcademyDomainRecord[];
  traditions: AcademyTraditionRecord[];
  persons: AcademyPersonRecord[];
  works: AcademyWorkRecord[];
  concepts: AcademyConceptRecord[];
  paths: AcademyPathDetailRecord[];
  personRelationships: AcademyPersonRelationshipRecord[];
  conceptTraditionLinks: AcademyConceptTraditionLinkRecord[];
  conceptPersonLinks: AcademyConceptPersonLinkRecord[];
  conceptWorkLinks: AcademyConceptWorkLinkRecord[];
};

export type AcademyPathCurationPatchInput = {
  title?: string;
  summary?: string;
  tone?: AcademyPathTone;
  difficultyLevel?: AcademyPathDifficulty;
  progressionOrder?: number;
  recommendationWeight?: number;
  recommendationHint?: string;
  isFeatured?: boolean;
};

export type AcademyPathItemCurationInput = {
  entityType: AcademyPathEntityType;
  entityId: number;
  rationale?: string | null;
  sortOrder?: number;
};

export type AcademyPersonEditorialPatchInput = {
  credibilityBand?: string | null;
  evidenceProfile?: string | null;
  claimRiskLevel?: string | null;
  bioShort?: string | null;
};

export type AcademyPersonRelationshipUpsertInput = {
  id?: number;
  sourcePersonId: number;
  targetPersonId: number;
  relationshipType: string;
  notes?: string | null;
};

export type AcademyConceptRelationUpsertInput = {
  conceptId: number;
  entityType: AcademyConceptRelationEntityType;
  entityId: number;
  sortOrder?: number;
};

const globalForDb = globalThis as unknown as {
  sqlite?: Database.Database;
  migrated?: boolean;
  seeded?: boolean;
};

function nowIso(): string {
  return new Date().toISOString();
}

function parseTransports(transports: string | null): string[] {
  if (!transports) {
    return [];
  }

  try {
    const parsed = JSON.parse(transports) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string");
    }
  } catch {
    // Ignore malformed stored transports and fallback to empty.
  }

  return [];
}

function parseSocialLinks(socialLinksJson: string): Array<{ label: string; url: string }> {
  try {
    const parsed = JSON.parse(socialLinksJson) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const record = item as { label?: unknown; url?: unknown };
        const label = typeof record.label === "string" ? record.label.trim() : "";
        const url = typeof record.url === "string" ? record.url.trim() : "";
        if (!label || !url) {
          return null;
        }
        return { label, url };
      })
      .filter((value): value is { label: string; url: string } => Boolean(value));
  } catch {
    return [];
  }
}

const validAvatarTypes = new Set<AvatarType>(["initials", "preset", "upload"]);
const validOnboardingTopics = new Set([
  "stoicism",
  "epicureanism",
  "mindfulness",
  "psychology",
  "habits",
  "journaling",
]);

function normalizeAvatarType(value: string | null | undefined): AvatarType {
  if (value && validAvatarTypes.has(value as AvatarType)) {
    return value as AvatarType;
  }

  return "initials";
}

function parsePreferredTopics(
  preferredTopicsJson: string,
): Array<"stoicism" | "epicureanism" | "mindfulness" | "psychology" | "habits" | "journaling"> {
  try {
    const parsed = JSON.parse(preferredTopicsJson) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    const normalized = parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().toLowerCase())
      .filter((item): item is "stoicism" | "epicureanism" | "mindfulness" | "psychology" | "habits" | "journaling" =>
        validOnboardingTopics.has(item),
      );

    return [...new Set(normalized)];
  } catch {
    return [];
  }
}

function stringifyPreferredTopics(
  preferredTopics: Array<"stoicism" | "epicureanism" | "mindfulness" | "psychology" | "habits" | "journaling">,
): string {
  const normalized = preferredTopics
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is "stoicism" | "epicureanism" | "mindfulness" | "psychology" | "habits" | "journaling" =>
      validOnboardingTopics.has(item),
    );

  return JSON.stringify([...new Set(normalized)].slice(0, 3));
}

function normalizeSocialLinks(
  socialLinks: Array<{ label: string; url: string }>,
): Array<{ label: string; url: string }> {
  return socialLinks
    .map((item) => ({
      label: item.label.trim(),
      url: item.url.trim(),
    }))
    .filter((item) => item.label.length > 0 && item.url.length > 0);
}

function stringifySocialLinks(socialLinks: Array<{ label: string; url: string }>): string {
  return JSON.stringify(normalizeSocialLinks(socialLinks));
}

function normalizeReflectionSourceType(value: string | null | undefined): ReflectionSourceType {
  if (value === "voice" || value === "upload") {
    return value;
  }
  return "text";
}

function normalizeReflectionStatus(value: string | null | undefined): ReflectionStatus {
  if (value === "processing" || value === "ready" || value === "failed") {
    return value;
  }
  return "draft";
}

function normalizeReflectionProcessingStep(value: string | null | undefined): ReflectionProcessingStep {
  if (value === "transcription" || value === "cleaning" || value === "refinement") {
    return value;
  }
  return "commentary";
}

function normalizeReflectionProcessingJobStatus(
  value: string | null | undefined,
): ReflectionProcessingJobStatus {
  if (value === "running" || value === "success" || value === "failed") {
    return value;
  }
  return "pending";
}

function normalizeReflectionTag(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .slice(0, 32);
}

function buildReflectionPreview(input: {
  refinedText: string | null;
  cleanTranscript: string | null;
  rawText: string;
  commentary: string | null;
}): string {
  const candidate = [input.refinedText, input.cleanTranscript, input.rawText, input.commentary]
    .map((value) => value?.replace(/\s+/g, " ").trim() ?? "")
    .find((value) => value.length > 0);

  if (!candidate) {
    return "No reflection text available yet.";
  }

  if (candidate.length <= 180) {
    return candidate;
  }

  return `${candidate.slice(0, 177).trimEnd()}...`;
}

function normalizeProfileVisibility(value: string): "public" | "private" | "contacts" {
  if (value === "public" || value === "contacts" || value === "private") {
    return value;
  }

  return "private";
}

function normalizeNotificationDigest(value: string): "immediate" | "daily" | "weekly" {
  if (value === "daily" || value === "weekly" || value === "immediate") {
    return value;
  }

  return "immediate";
}

function toNullableString(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toNullableNumber(value: number | null | undefined): number | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return value;
}

function normalizeAcademySlugPart(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "item";
}

function createAcademyWorkSlug(title: string, id: number): string {
  return `${normalizeAcademySlugPart(title)}-${id}`;
}

function normalizeLikeQuery(input: string): string {
  return input.trim().replace(/\s+/g, " ");
}

function sanitizeLikeValue(input: string): string {
  const collapsed = normalizeLikeQuery(input).replace(/[%_]/g, "");
  return `%${collapsed}%`;
}

function normalizeUsernameValue(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function scoreMatch(query: string, ...haystacks: Array<string | null | undefined>): number {
  const normalizedQuery = normalizeLikeQuery(query).toLowerCase();
  if (!normalizedQuery) {
    return 0;
  }

  let best = 0;

  for (const haystack of haystacks) {
    if (!haystack) {
      continue;
    }

    const normalizedHaystack = haystack.toLowerCase();
    if (normalizedHaystack === normalizedQuery) {
      best = Math.max(best, 100);
      continue;
    }

    if (normalizedHaystack.startsWith(normalizedQuery)) {
      best = Math.max(best, 85);
      continue;
    }

    if (normalizedHaystack.includes(normalizedQuery)) {
      best = Math.max(best, 70);
    }
  }

  return best;
}

function clampLimit(value: number | undefined, fallback: number, max = 200): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.floor(value), max));
}

function sortByWorkPriority(a: AcademyWorkRecord, b: AcademyWorkRecord): number {
  if (a.isPrimaryText !== b.isPrimaryText) {
    return a.isPrimaryText ? -1 : 1;
  }

  const aYear = a.publicationYear ?? Number.POSITIVE_INFINITY;
  const bYear = b.publicationYear ?? Number.POSITIVE_INFINITY;
  if (aYear !== bYear) {
    return aYear - bYear;
  }

  return a.title.localeCompare(b.title);
}

function sortByPathPriority(a: AcademyPathRecord, b: AcademyPathRecord): number {
  if (a.isFeatured !== b.isFeatured) {
    return a.isFeatured ? -1 : 1;
  }

  if (a.progressionOrder !== b.progressionOrder) {
    return a.progressionOrder - b.progressionOrder;
  }

  if (a.recommendationWeight !== b.recommendationWeight) {
    return b.recommendationWeight - a.recommendationWeight;
  }

  return a.title.localeCompare(b.title);
}

type AcademySearchIndexedRecord = {
  key: string;
  record: AcademySearchResultRecord;
  searchableText: string;
  tokens: Set<string>;
};

type AcademySearchIndexState = {
  version: number;
  records: AcademySearchIndexedRecord[];
  byKey: Map<string, AcademySearchIndexedRecord>;
  tokenToKeys: Map<string, string[]>;
};

type AcademySearchCacheEntry = {
  version: number;
  expiresAt: number;
  results: AcademySearchResultRecord[];
};

const ACADEMY_SEARCH_CACHE_TTL_MS = 60 * 1000;
const ACADEMY_SEARCH_MAX_CANDIDATES = 2400;

let academyKnowledgeVersion = 0;
let academySearchIndexState: AcademySearchIndexState | null = null;
const academySearchCache = new Map<string, AcademySearchCacheEntry>();

function academySearchResultKey(type: AcademySearchResultRecord["type"], id: number): string {
  return `${type}:${id}`;
}

function tokenizeAcademySearchText(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 2);
}

function academySearchCacheKey(query: string, limit: number): string {
  return `${query.toLowerCase()}::${limit}`;
}

function invalidateAcademySearchState(): void {
  academyKnowledgeVersion += 1;
  academySearchIndexState = null;
  academySearchCache.clear();
}

const defaultUserPreferences: Omit<UserPreferencesRecord, "id" | "userId" | "createdAt" | "updatedAt"> = {
  language: "en",
  timezone: "UTC",
  profileVisibility: "private",
  showEmail: false,
  showPhone: false,
  allowContact: true,
};

const defaultNotificationPreferences: Omit<
  UserNotificationPreferencesRecord,
  "id" | "userId" | "createdAt" | "updatedAt"
> = {
  emailChallenges: true,
  emailEvents: true,
  emailUpdates: true,
  emailMarketing: false,
  pushChallenges: true,
  pushEvents: false,
  pushUpdates: true,
  digest: "immediate",
};

const defaultUserProfile: Omit<UserProfileRecord, "id" | "userId" | "createdAt" | "updatedAt"> = {
  username: null,
  avatarType: "initials",
  avatarPreset: null,
  avatarImageKey: null,
  summary: "",
  phone: "",
  city: "",
  country: "",
  socialLinks: [],
};

const DEFAULT_CHAT_CONTEXT_CAPACITY = 24000;

function buildDefaultChatThreadContext(threadId: string): ChatThreadContextRecord {
  const timestamp = nowIso();
  return {
    id: `virtual-${threadId}`,
    threadId,
    summary: "",
    summarizedMessageCount: 0,
    estimatedPromptTokens: 0,
    contextCapacity: DEFAULT_CHAT_CONTEXT_CAPACITY,
    usagePercent: 0,
    state: "ok",
    autoSummariesCount: 0,
    lastSummarizedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function seedWelcomeNotifications(userId: string): void {
  const timestamp = nowIso();

  const welcomeNotifications = [
    {
      id: cryptoRandomId(),
      userId,
      title: "Welcome to Areti",
      body: "Start with one short reflection to ground your practice.",
      href: "/journal?title=First%20Reflection&mood=Grounded",
      readAt: null,
      createdAt: timestamp,
    },
    {
      id: cryptoRandomId(),
      userId,
      title: "Explore the Library",
      body: "Pick one lesson and apply it within 24 hours.",
      href: "/library",
      readAt: null,
      createdAt: timestamp,
    },
    {
      id: cryptoRandomId(),
      userId,
      title: "Meet the Community",
      body: "Join a circle and introduce your current practice focus.",
      href: "/community",
      readAt: null,
      createdAt: timestamp,
    },
  ];

  db.insert(userNotifications).values(welcomeNotifications).run();
}

function cryptoRandomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function findRepoRoot(startDir: string): string {
  let current = path.resolve(startDir);

  while (true) {
    const packageJsonPath = path.join(current, "package.json");

    try {
      const parsed = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
        workspaces?: string[];
      };

      if (Array.isArray(parsed.workspaces)) {
        return current;
      }
    } catch {
      // Continue walking up until root.
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return startDir;
    }

    current = parent;
  }
}

function resolveDefaultDbFileName(): string {
  if (process.env.NODE_ENV === "test") {
    return "ataraxia.test.db";
  }

  if (process.env.NODE_ENV === "production") {
    return "ataraxia.prod.db";
  }

  return "ataraxia.dev.db";
}

function resolveDatabasePath(): string {
  if (process.env.ATARAXIA_DB_PATH) {
    return process.env.ATARAXIA_DB_PATH;
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = findRepoRoot(here);

  return path.join(repoRoot, "data", resolveDefaultDbFileName());
}

function resolveMigrationsFolder(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const packageRoot = path.resolve(here, "..");
  return path.join(packageRoot, "drizzle");
}

function initializeSqlite(): Database.Database {
  const dbPath = resolveDatabasePath();

  mkdirSync(path.dirname(dbPath), { recursive: true });

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  return sqlite;
}

const sqlite = globalForDb.sqlite ?? initializeSqlite();
if (!globalForDb.sqlite) {
  globalForDb.sqlite = sqlite;
}

const db = drizzle(sqlite, {
  schema: {
    users,
    userProfiles,
    userPreferences,
    userNotificationPreferences,
    userDeletionAudit,
    userLegalConsents,
    emailVerificationChallenges,
    userOnboardingProfiles,
    userDevices,
    sessions,
    refreshSessions,
    mfaChallenges,
    userTotpSecrets,
    passkeyCredentials,
    adminAuditLogs,
    invitations,
    signupIntents,
    userNotifications,
    chatThreads,
    chatMessages,
    chatThreadBranches,
    chatThreadContexts,
    userCompanionPreferences,
    chatEvents,
    journalEntries,
    reflectionEntries,
    reflectionAudioAssets,
    reflectionTags,
    reflectionProcessingJobs,
    reflectionEvents,
    previewEvents,
    rateLimitBlockEvents,
    rateLimitPolicyOverrides,
    userContentCompletions,
    contentPillars,
    contentHighlights,
    libraryLessons,
    practiceRoutines,
    communityCircles,
    communityChallenges,
    communityResources,
    communityExperts,
    communityEvents,
    creatorVideos,
    academyDomains,
    academyTraditions,
    academyPersons,
    academyWorks,
    academyConcepts,
    academyPersonRelationships,
    academyConceptTraditions,
    academyConceptPersons,
    academyConceptWorks,
    academyPaths,
    academyPathItems,
  },
});

export function runMigrations() {
  if (globalForDb.migrated) {
    return;
  }

  migrate(db, {
    migrationsFolder: resolveMigrationsFolder(),
  });

  globalForDb.migrated = true;
}

runMigrations();

function ensureCompatibilitySchema(): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user_content_completions (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      content_kind text NOT NULL,
      content_slug text NOT NULL,
      completion_count integer DEFAULT 1 NOT NULL,
      last_completed_at text NOT NULL,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE cascade
    );
  `);

  sqlite.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS user_content_completions_user_kind_slug_unique
      ON user_content_completions (user_id, content_kind, content_slug);
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS chat_thread_contexts (
      id text PRIMARY KEY NOT NULL,
      thread_id text NOT NULL UNIQUE,
      summary text DEFAULT '' NOT NULL,
      summarized_message_count integer DEFAULT 0 NOT NULL,
      estimated_prompt_tokens integer DEFAULT 0 NOT NULL,
      context_capacity integer DEFAULT 24000 NOT NULL,
      usage_percent integer DEFAULT 0 NOT NULL,
      state text DEFAULT 'ok' NOT NULL,
      auto_summaries_count integer DEFAULT 0 NOT NULL,
      last_summarized_at text,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE cascade
    );
  `);

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS chat_thread_branches (
      id text PRIMARY KEY NOT NULL,
      thread_id text NOT NULL UNIQUE,
      source_thread_id text NOT NULL,
      source_message_id text NOT NULL,
      created_at text NOT NULL,
      FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE cascade,
      FOREIGN KEY (source_thread_id) REFERENCES chat_threads(id) ON DELETE cascade,
      FOREIGN KEY (source_message_id) REFERENCES chat_messages(id) ON DELETE cascade
    );
  `);

  sqlite.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS chat_thread_branches_source_thread_source_message_unique
      ON chat_thread_branches (source_thread_id, source_message_id, thread_id);
  `);
}

ensureCompatibilitySchema();

function seedAcademyKnowledge(): void {
  const timestamp = nowIso();

  db.transaction(() => {
    const domainCount = db.select({ count: count() }).from(academyDomains).get();
    if ((domainCount?.count ?? 0) === 0) {
      db.insert(academyDomains)
        .values(
          ACADEMY_KNOWLEDGE_SEED.domains.map((domain) => ({
            id: domain.id,
            slug: domain.slug,
            name: domain.name,
            descriptionShort: toNullableString(domain.description_short),
            createdAt: timestamp,
            updatedAt: timestamp,
          })),
        )
        .onConflictDoNothing()
        .run();
    }

    const traditionCount = db.select({ count: count() }).from(academyTraditions).get();
    if ((traditionCount?.count ?? 0) === 0) {
      db.insert(academyTraditions)
        .values(
          ACADEMY_KNOWLEDGE_SEED.traditions.map((tradition) => ({
            id: tradition.id,
            domainId: tradition.domain_id,
            parentTraditionId: toNullableNumber(tradition.parent_tradition_id),
            slug: tradition.slug,
            name: tradition.name,
            originRegion: toNullableString(tradition.origin_region),
            descriptionShort: toNullableString(tradition.description_short),
            createdAt: timestamp,
            updatedAt: timestamp,
          })),
        )
        .onConflictDoNothing()
        .run();
    }

    const personCount = db.select({ count: count() }).from(academyPersons).get();
    if ((personCount?.count ?? 0) === 0) {
      db.insert(academyPersons)
        .values(
          ACADEMY_KNOWLEDGE_SEED.persons.map((person) => ({
            id: person.id,
            slug: person.slug,
            displayName: person.display_name,
            birthYear: toNullableNumber(person.birth_year),
            deathYear: toNullableNumber(person.death_year),
            countryOrRegion: toNullableString(person.country_or_region),
            traditionId: toNullableNumber(person.tradition_id),
            roleType: toNullableString(person.role_type),
            isFounder: person.is_founder === true,
            credibilityBand: toNullableString(person.credibility_band),
            bioShort: toNullableString(person.bio_short),
            evidenceProfile: toNullableString(person.evidence_profile),
            claimRiskLevel: toNullableString(person.claim_risk_level),
            createdAt: timestamp,
            updatedAt: timestamp,
          })),
        )
        .onConflictDoNothing()
        .run();
    }

    const workCount = db.select({ count: count() }).from(academyWorks).get();
    if ((workCount?.count ?? 0) === 0) {
      db.insert(academyWorks)
        .values(
          ACADEMY_KNOWLEDGE_SEED.works.map((work) => ({
            id: work.id,
            slug: createAcademyWorkSlug(work.title, work.id),
            personId: toNullableNumber(work.person_id),
            traditionId: toNullableNumber(work.tradition_id),
            title: work.title,
            workType: toNullableString(work.work_type),
            publicationYear: toNullableNumber(work.publication_year),
            isPrimaryText: work.is_primary_text === true,
            summaryShort: toNullableString(work.summary_short),
            createdAt: timestamp,
            updatedAt: timestamp,
          })),
        )
        .onConflictDoNothing()
        .run();
    }

    const conceptCount = db.select({ count: count() }).from(academyConcepts).get();
    if ((conceptCount?.count ?? 0) === 0) {
      db.insert(academyConcepts)
        .values(
          ACADEMY_KNOWLEDGE_SEED.concepts.map((concept) => ({
            id: concept.id,
            slug: concept.slug,
            name: concept.name,
            description: toNullableString(concept.description),
            conceptFamily: toNullableString(concept.concept_family),
            createdAt: timestamp,
            updatedAt: timestamp,
          })),
        )
        .onConflictDoNothing()
        .run();
    }

    const relationshipCount = db.select({ count: count() }).from(academyPersonRelationships).get();
    if ((relationshipCount?.count ?? 0) === 0) {
      db.insert(academyPersonRelationships)
        .values(
          ACADEMY_KNOWLEDGE_SEED.person_relationships.map((relationship) => ({
            id: relationship.id,
            sourcePersonId: relationship.source_person_id,
            targetPersonId: relationship.target_person_id,
            relationshipType: relationship.relationship_type,
            notes: toNullableString(relationship.notes),
            createdAt: timestamp,
            updatedAt: timestamp,
          })),
        )
        .onConflictDoNothing()
        .run();
    }

    const conceptsBySlug = new Map(
      db
        .select({ id: academyConcepts.id, slug: academyConcepts.slug })
        .from(academyConcepts)
        .all()
        .map((row) => [row.slug, row.id] as const),
    );
    const traditionsBySlug = new Map(
      db
        .select({ id: academyTraditions.id, slug: academyTraditions.slug })
        .from(academyTraditions)
        .all()
        .map((row) => [row.slug, row.id] as const),
    );
    const personsBySlug = new Map(
      db
        .select({ id: academyPersons.id, slug: academyPersons.slug })
        .from(academyPersons)
        .all()
        .map((row) => [row.slug, row.id] as const),
    );

    const conceptTraditionCount = db.select({ count: count() }).from(academyConceptTraditions).get();
    if ((conceptTraditionCount?.count ?? 0) === 0) {
      const links = ACADEMY_CONCEPT_TRADITION_LINKS.map((link) => {
        const conceptId = conceptsBySlug.get(link.conceptSlug);
        const traditionId = traditionsBySlug.get(link.traditionSlug);

        if (!conceptId || !traditionId) {
          return null;
        }

        return {
          conceptId,
          traditionId,
          sortOrder: link.sortOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      }).filter(
        (
          link,
        ): link is {
          conceptId: number;
          traditionId: number;
          sortOrder: number;
          createdAt: string;
          updatedAt: string;
        } => link !== null,
      );

      if (links.length > 0) {
        db.insert(academyConceptTraditions).values(links).onConflictDoNothing().run();
      }
    }

    const conceptPersonCount = db.select({ count: count() }).from(academyConceptPersons).get();
    if ((conceptPersonCount?.count ?? 0) === 0) {
      const links = ACADEMY_CONCEPT_PERSON_LINKS.map((link) => {
        const conceptId = conceptsBySlug.get(link.conceptSlug);
        const personId = personsBySlug.get(link.personSlug);

        if (!conceptId || !personId) {
          return null;
        }

        return {
          conceptId,
          personId,
          sortOrder: link.sortOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      }).filter(
        (
          link,
        ): link is {
          conceptId: number;
          personId: number;
          sortOrder: number;
          createdAt: string;
          updatedAt: string;
        } => link !== null,
      );

      if (links.length > 0) {
        db.insert(academyConceptPersons).values(links).onConflictDoNothing().run();
      }
    }

    const conceptWorkCount = db.select({ count: count() }).from(academyConceptWorks).get();
    if ((conceptWorkCount?.count ?? 0) === 0) {
      const links = ACADEMY_CONCEPT_WORK_LINKS.map((link) => {
        const conceptId = conceptsBySlug.get(link.conceptSlug);
        if (!conceptId) {
          return null;
        }

        return {
          conceptId,
          workId: link.workId,
          sortOrder: link.sortOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      }).filter(
        (
          link,
        ): link is {
          conceptId: number;
          workId: number;
          sortOrder: number;
          createdAt: string;
          updatedAt: string;
        } => link !== null,
      );

      if (links.length > 0) {
        db.insert(academyConceptWorks).values(links).onConflictDoNothing().run();
      }
    }

    const pathCount = db.select({ count: count() }).from(academyPaths).get();
    if ((pathCount?.count ?? 0) === 0) {
      for (const seed of ACADEMY_PATHS_SEED) {
        db.insert(academyPaths)
          .values({
            slug: seed.slug,
            title: seed.title,
            summary: seed.summary,
            tone: seed.tone,
            difficultyLevel: seed.difficultyLevel,
            progressionOrder: seed.progressionOrder,
            recommendationWeight: seed.recommendationWeight,
            recommendationHint: seed.recommendationHint,
            isFeatured: seed.isFeatured,
            createdAt: timestamp,
            updatedAt: timestamp,
          })
          .onConflictDoNothing()
          .run();

        const path = db
          .select({ id: academyPaths.id })
          .from(academyPaths)
          .where(eq(academyPaths.slug, seed.slug))
          .limit(1)
          .get();

        if (!path) {
          continue;
        }

        const items = seed.items
          .map((item) => {
            let entityId: number | null = null;
            if (item.entityType === "tradition") {
              entityId = traditionsBySlug.get(String(item.slugOrWorkId)) ?? null;
            } else if (item.entityType === "person") {
              entityId = personsBySlug.get(String(item.slugOrWorkId)) ?? null;
            } else if (item.entityType === "concept") {
              entityId = conceptsBySlug.get(String(item.slugOrWorkId)) ?? null;
            } else if (item.entityType === "work") {
              entityId = typeof item.slugOrWorkId === "number" ? item.slugOrWorkId : null;
            }

            if (!entityId) {
              return null;
            }

            return {
              pathId: path.id,
              entityType: item.entityType,
              entityId,
              sortOrder: item.sortOrder,
              rationale: item.rationale,
              createdAt: timestamp,
              updatedAt: timestamp,
            };
          })
          .filter(
            (
              item,
            ): item is {
              pathId: number;
              entityType: AcademyPathEntityType;
              entityId: number;
              sortOrder: number;
              rationale: string;
              createdAt: string;
              updatedAt: string;
            } => item !== null,
          );

        if (items.length > 0) {
          db.insert(academyPathItems).values(items).onConflictDoNothing().run();
        }
      }
    }
  });
}

function seedIfEmpty(): void {
  const timestamp = nowIso();

  const pillarCount = db.select({ count: count() }).from(contentPillars).get();
  if ((pillarCount?.count ?? 0) === 0) {
    db.insert(contentPillars)
      .values(
        PILLAR_SEED.map((item) => ({
          ...item,
          status: "PUBLISHED" as ContentStatus,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      )
      .onConflictDoNothing()
      .run();
  }

  const highlightCount = db.select({ count: count() }).from(contentHighlights).get();
  if ((highlightCount?.count ?? 0) === 0) {
    db.insert(contentHighlights)
      .values(
        HIGHLIGHT_SEED.map((item) => ({
          ...item,
          status: "PUBLISHED" as ContentStatus,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      )
      .onConflictDoNothing()
      .run();
  }

  const circleCount = db.select({ count: count() }).from(communityCircles).get();
  if ((circleCount?.count ?? 0) === 0) {
    db.insert(communityCircles)
      .values(
        COMMUNITY_SEED.map((item) => ({
          ...item,
          status: "PUBLISHED" as ContentStatus,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      )
      .onConflictDoNothing()
      .run();
  }

  const challengeCount = db.select({ count: count() }).from(communityChallenges).get();
  if ((challengeCount?.count ?? 0) === 0) {
    db.insert(communityChallenges)
      .values(
        COMMUNITY_CHALLENGES_SEED.map((item) => ({
          ...item,
          status: "PUBLISHED" as ContentStatus,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      )
      .onConflictDoNothing()
      .run();
  }

  const resourceCount = db.select({ count: count() }).from(communityResources).get();
  if ((resourceCount?.count ?? 0) === 0) {
    db.insert(communityResources)
      .values(
        COMMUNITY_RESOURCES_SEED.map((item) => ({
          ...item,
          status: "PUBLISHED" as ContentStatus,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      )
      .onConflictDoNothing()
      .run();
  }

  const expertsCount = db.select({ count: count() }).from(communityExperts).get();
  if ((expertsCount?.count ?? 0) === 0) {
    db.insert(communityExperts)
      .values(
        COMMUNITY_EXPERTS_SEED.map((item) => ({
          ...item,
          status: "PUBLISHED" as ContentStatus,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      )
      .onConflictDoNothing()
      .run();
  }

  const eventsCount = db.select({ count: count() }).from(communityEvents).get();
  if ((eventsCount?.count ?? 0) === 0) {
    db.insert(communityEvents)
      .values(
        COMMUNITY_EVENTS_SEED.map((item) => ({
          ...item,
          status: "PUBLISHED" as ContentStatus,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      )
      .onConflictDoNothing()
      .run();
  }

  const videosCount = db.select({ count: count() }).from(creatorVideos).get();
  if ((videosCount?.count ?? 0) === 0) {
    db.insert(creatorVideos)
      .values(
        CREATOR_VIDEOS_SEED.map((item) => ({
          ...item,
          status: "PUBLISHED" as ContentStatus,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      )
      .onConflictDoNothing()
      .run();
  }

  seedAcademyKnowledge();
}

export function seedLibraryAndPracticesContent(): void {
  const timestamp = nowIso();

  db.transaction(() => {
    for (const item of LIBRARY_SEED) {
      const existing = db
        .select({ id: libraryLessons.id })
        .from(libraryLessons)
        .where(eq(libraryLessons.slug, item.slug))
        .limit(1)
        .get();

      if (existing) {
        db.update(libraryLessons)
          .set({
            title: item.title,
            tradition: item.tradition,
            level: item.level,
            minutes: item.minutes,
            summary: item.summary,
            content: item.content,
            status: "PUBLISHED",
            updatedAt: timestamp,
          })
          .where(eq(libraryLessons.id, existing.id))
          .run();
        continue;
      }

      db.insert(libraryLessons)
        .values({
          slug: item.slug,
          title: item.title,
          tradition: item.tradition,
          level: item.level,
          minutes: item.minutes,
          summary: item.summary,
          content: item.content,
          status: "PUBLISHED",
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .run();
    }

    for (const item of PRACTICE_SEED) {
      const existing = db
        .select({ id: practiceRoutines.id })
        .from(practiceRoutines)
        .where(eq(practiceRoutines.slug, item.slug))
        .limit(1)
        .get();

      if (existing) {
        db.update(practiceRoutines)
          .set({
            title: item.title,
            description: item.description,
            cadence: item.cadence,
            protocol: item.protocol,
            status: "PUBLISHED",
            updatedAt: timestamp,
          })
          .where(eq(practiceRoutines.id, existing.id))
          .run();
        continue;
      }

      db.insert(practiceRoutines)
        .values({
          slug: item.slug,
          title: item.title,
          description: item.description,
          cadence: item.cadence,
          protocol: item.protocol,
          status: "PUBLISHED",
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .run();
    }
  });
}

if (!globalForDb.seeded) {
  seedIfEmpty();
  globalForDb.seeded = true;
}

export function countUsers(): number {
  const row = db
    .select({ count: count() })
    .from(users)
    .where(isNull(users.deletedAt))
    .get();
  return row?.count ?? 0;
}

export function listActiveUserIds(limit = 2000): string[] {
  const rows = db
    .select({ id: users.id })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(asc(users.createdAt))
    .limit(Math.max(1, Math.min(limit, 10000)))
    .all();

  return rows.map((row) => row.id);
}

export function countVerifiedUsers(): number {
  const row = db
    .select({ count: count() })
    .from(users)
    .where(and(isNotNull(users.emailVerifiedAt), isNull(users.deletedAt)))
    .get();
  return row?.count ?? 0;
}

function buildAdminUserListWhereClause(searchQuery?: string): SQL<unknown> {
  const trimmedQuery = searchQuery?.trim() ?? "";
  const conditions: SQL<unknown>[] = [isNull(users.deletedAt)];

  if (trimmedQuery.length > 0) {
    const likeValue = `%${trimmedQuery}%`;
    conditions.push(
      or(
        like(users.email, likeValue),
        like(users.name, likeValue),
        like(userProfiles.username, likeValue),
      ) as SQL<unknown>,
    );
  }

  let whereClause = conditions[0] as SQL<unknown>;
  for (const condition of conditions.slice(1)) {
    whereClause = and(whereClause, condition) as SQL<unknown>;
  }

  return whereClause;
}

export function listAdminUsers(input: {
  limit: number;
  offset: number;
  query?: string;
}): {
  items: AdminUserListItemRecord[];
  total: number;
} {
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(input.limit)));
  const safeOffset = Math.max(0, Math.trunc(input.offset));
  const whereClause = buildAdminUserListWhereClause(input.query);

  const rows = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      username: userProfiles.username,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(whereClause)
    .orderBy(desc(users.createdAt))
    .limit(safeLimit)
    .offset(safeOffset)
    .all();

  const totalRow = db
    .select({ count: count() })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(whereClause)
    .get();

  return {
    items: rows,
    total: totalRow?.count ?? 0,
  };
}

function countInvitationsWhere(whereClause?: SQL<unknown>): number {
  const query = db.select({ count: count() }).from(invitations);
  if (!whereClause) {
    return query.get()?.count ?? 0;
  }

  return query.where(whereClause).get()?.count ?? 0;
}

export function getAdminOverviewStats(): AdminOverviewStatsRecord {
  const now = nowIso();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const soon = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const activeUsersWhere = isNull(users.deletedAt);
  const totalUsers = db.select({ count: count() }).from(users).where(activeUsersWhere).get()?.count ?? 0;
  const adminUsers =
    db
      .select({ count: count() })
      .from(users)
      .where(and(activeUsersWhere, eq(users.role, "admin")))
      .get()?.count ?? 0;
  const verifiedUsers =
    db
      .select({ count: count() })
      .from(users)
      .where(and(activeUsersWhere, isNotNull(users.emailVerifiedAt)))
      .get()?.count ?? 0;
  const usersCreatedLast7Days =
    db
      .select({ count: count() })
      .from(users)
      .where(and(activeUsersWhere, gt(users.createdAt, sevenDaysAgo)))
      .get()?.count ?? 0;

  const activeInvitationsWhere = and(
    isNull(invitations.revokedAt),
    isNull(invitations.usedAt),
    gt(invitations.expiresAt, now),
  );
  const expiredInvitationsWhere = and(
    isNull(invitations.revokedAt),
    isNull(invitations.usedAt),
    lt(invitations.expiresAt, now),
  );
  const expiringSoonInvitationsWhere = and(
    isNull(invitations.revokedAt),
    isNull(invitations.usedAt),
    gt(invitations.expiresAt, now),
    lt(invitations.expiresAt, soon),
  );

  const totalInvitations = countInvitationsWhere();
  const activeInvitations = countInvitationsWhere(activeInvitationsWhere);
  const usedInvitations = countInvitationsWhere(isNotNull(invitations.usedAt));
  const revokedInvitations = countInvitationsWhere(isNotNull(invitations.revokedAt));
  const expiredInvitations = countInvitationsWhere(expiredInvitationsWhere);
  const expiringSoonInvitations = countInvitationsWhere(expiringSoonInvitationsWhere);
  const invitesCreatedLast7Days = countInvitationsWhere(gt(invitations.createdAt, sevenDaysAgo));
  const invitesRedeemedLast7Days = countInvitationsWhere(gt(invitations.usedAt, sevenDaysAgo));

  return {
    users: {
      total: totalUsers,
      admins: adminUsers,
      nonAdmins: Math.max(0, totalUsers - adminUsers),
      verified: verifiedUsers,
      unverified: Math.max(0, totalUsers - verifiedUsers),
      createdLast7Days: usersCreatedLast7Days,
    },
    invitations: {
      total: totalInvitations,
      active: activeInvitations,
      used: usedInvitations,
      revoked: revokedInvitations,
      expired: expiredInvitations,
      expiringSoon: expiringSoonInvitations,
      createdLast7Days: invitesCreatedLast7Days,
      redeemedLast7Days: invitesRedeemedLast7Days,
    },
  };
}

export function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email)).limit(1).get() ?? null;
}

export function getUserById(userId: string): CurrentUser | null {
  const user = db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      onboardingCompletedAt: users.onboardingCompletedAt,
    })
    .from(users)
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .limit(1)
    .get();

  return user ?? null;
}

function insertUserWithDefaults(input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  timestamp: string;
}): void {
  db.insert(users)
    .values({
      id: input.id,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      mfaEnabled: false,
      passkeyEnabled: false,
      emailVerifiedAt: null,
      onboardingCompletedAt: null,
      deletedAt: null,
      anonymizedAt: null,
      createdAt: input.timestamp,
      updatedAt: input.timestamp,
    })
    .run();

  db.insert(userProfiles)
    .values({
      id: cryptoRandomId(),
      userId: input.id,
      username: null,
      summary: "",
      phone: "",
      city: "",
      country: "",
      socialLinksJson: "[]",
      createdAt: input.timestamp,
      updatedAt: input.timestamp,
    })
    .run();

  db.insert(userPreferences)
    .values({
      id: cryptoRandomId(),
      userId: input.id,
      language: defaultUserPreferences.language,
      timezone: defaultUserPreferences.timezone,
      profileVisibility: defaultUserPreferences.profileVisibility,
      showEmail: defaultUserPreferences.showEmail,
      showPhone: defaultUserPreferences.showPhone,
      allowContact: defaultUserPreferences.allowContact,
      createdAt: input.timestamp,
      updatedAt: input.timestamp,
    })
    .run();

  db.insert(userNotificationPreferences)
    .values({
      id: cryptoRandomId(),
      userId: input.id,
      emailChallenges: defaultNotificationPreferences.emailChallenges,
      emailEvents: defaultNotificationPreferences.emailEvents,
      emailUpdates: defaultNotificationPreferences.emailUpdates,
      emailMarketing: defaultNotificationPreferences.emailMarketing,
      pushChallenges: defaultNotificationPreferences.pushChallenges,
      pushEvents: defaultNotificationPreferences.pushEvents,
      pushUpdates: defaultNotificationPreferences.pushUpdates,
      digest: defaultNotificationPreferences.digest,
      createdAt: input.timestamp,
      updatedAt: input.timestamp,
    })
    .run();

  seedWelcomeNotifications(input.id);
}

export function createUser(input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}) {
  const timestamp = nowIso();
  insertUserWithDefaults({
    id: input.id,
    name: input.name,
    email: input.email,
    passwordHash: input.passwordHash,
    role: input.role,
    timestamp,
  });

  return getUserById(input.id);
}

export type InvitationRedemptionFailureReason =
  | "invalid_token"
  | "expired"
  | "revoked"
  | "already_used"
  | "email_mismatch";

export type CreateUserWithInvitationResult =
  | {
      ok: true;
      user: CurrentUser;
      invitation: InvitationRecord;
    }
  | {
      ok: false;
      reason: InvitationRedemptionFailureReason;
    };

const INVITE_CONSUME_CONFLICT_ERROR = "INVITE_CONSUME_CONFLICT";

export function createUserWithInvitation(input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  inviteTokenHash: string;
}): CreateUserWithInvitationResult {
  try {
    return db.transaction(() => {
      const timestamp = nowIso();
      const normalizedEmail = input.email.trim().toLowerCase();
      const invitation =
        db
          .select()
          .from(invitations)
          .where(eq(invitations.tokenHash, input.inviteTokenHash))
          .limit(1)
          .get() ?? null;

      if (!invitation) {
        return { ok: false, reason: "invalid_token" } as const;
      }

      if (invitation.revokedAt) {
        return { ok: false, reason: "revoked" } as const;
      }

      if (invitation.expiresAt <= timestamp) {
        return { ok: false, reason: "expired" } as const;
      }

      if (invitation.usedCount >= invitation.maxUses) {
        return { ok: false, reason: "already_used" } as const;
      }

      const inviteEmail = invitation.email?.trim().toLowerCase() ?? null;
      if (inviteEmail && inviteEmail !== normalizedEmail) {
        return { ok: false, reason: "email_mismatch" } as const;
      }

      insertUserWithDefaults({
        id: input.id,
        name: input.name,
        email: normalizedEmail,
        passwordHash: input.passwordHash,
        role: invitation.roleToGrant,
        timestamp,
      });

      const nextUsedCount = invitation.usedCount + 1;
      const consumed = db
        .update(invitations)
        .set({
          usedCount: nextUsedCount,
          usedAt: nextUsedCount >= invitation.maxUses ? timestamp : invitation.usedAt,
          usedByUserId: input.id,
        })
        .where(
          and(
            eq(invitations.id, invitation.id),
            eq(invitations.usedCount, invitation.usedCount),
            isNull(invitations.revokedAt),
            gt(invitations.expiresAt, timestamp),
            lt(invitations.usedCount, invitation.maxUses),
          ),
        )
        .run();

      if (consumed.changes <= 0) {
        throw new Error(INVITE_CONSUME_CONFLICT_ERROR);
      }

      const createdUser = getUserById(input.id);
      const refreshedInvitation =
        db.select().from(invitations).where(eq(invitations.id, invitation.id)).limit(1).get() ?? null;

      if (!createdUser || !refreshedInvitation) {
        throw new Error("Failed to complete invitation signup transaction.");
      }

      return {
        ok: true,
        user: createdUser,
        invitation: refreshedInvitation,
      } as const;
    });
  } catch (error) {
    if (error instanceof Error && error.message === INVITE_CONSUME_CONFLICT_ERROR) {
      return { ok: false, reason: "already_used" };
    }
    throw error;
  }
}

export function setUserRole(userId: string, role: UserRole): void {
  db.update(users)
    .set({
      role,
      updatedAt: nowIso(),
    })
    .where(eq(users.id, userId))
    .run();
}

export function promoteUserByEmail(email: string): {
  status: "not_found" | "already_admin" | "promoted";
  user: CurrentUser | null;
} {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = getUserByEmail(normalizedEmail);

  if (!existing || existing.deletedAt) {
    return {
      status: "not_found",
      user: null,
    };
  }

  const currentUser = getUserById(existing.id);
  if (!currentUser) {
    return {
      status: "not_found",
      user: null,
    };
  }

  if (currentUser.role === "admin") {
    return {
      status: "already_admin",
      user: currentUser,
    };
  }

  setUserRole(currentUser.id, "admin");
  return {
    status: "promoted",
    user: getUserById(currentUser.id),
  };
}

export function markUserEmailVerified(userId: string): CurrentUser | null {
  const timestamp = nowIso();

  db.update(users)
    .set({
      emailVerifiedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(eq(users.id, userId))
    .run();

  return getUserById(userId);
}

export function markUserOnboardingCompleted(userId: string): CurrentUser | null {
  const timestamp = nowIso();

  db.update(users)
    .set({
      onboardingCompletedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(eq(users.id, userId))
    .run();

  return getUserById(userId);
}

export function getUserAuthById(userId: string): UserAuthRecord | null {
  const user = db.select().from(users).where(eq(users.id, userId)).limit(1).get();
  return user ?? null;
}

export function updateUserPasswordHash(userId: string, passwordHash: string): boolean {
  const updated = db
    .update(users)
    .set({
      passwordHash,
      updatedAt: nowIso(),
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .run();

  return updated.changes > 0;
}

export function updateUserName(userId: string, name: string): CurrentUser | null {
  db.update(users)
    .set({
      name,
      updatedAt: nowIso(),
    })
    .where(and(eq(users.id, userId), isNull(users.deletedAt)))
    .run();

  return getUserById(userId);
}

export function getUserProfileByUserId(userId: string): UserProfileRecord {
  let profile = db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1)
    .get();

  if (!profile) {
    const timestamp = nowIso();
    db.insert(userProfiles)
      .values({
        id: cryptoRandomId(),
        userId,
        username: defaultUserProfile.username,
        avatarType: defaultUserProfile.avatarType,
        avatarPreset: defaultUserProfile.avatarPreset,
        avatarImageKey: defaultUserProfile.avatarImageKey,
        summary: defaultUserProfile.summary,
        phone: defaultUserProfile.phone,
        city: defaultUserProfile.city,
        country: defaultUserProfile.country,
        socialLinksJson: stringifySocialLinks(defaultUserProfile.socialLinks),
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();

    profile = db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1)
      .get();
  }

  if (!profile) {
    throw new Error("Failed to load user profile.");
  }

  return {
    id: profile.id,
    userId: profile.userId,
    username: profile.username,
    avatarType: normalizeAvatarType(profile.avatarType),
    avatarPreset: profile.avatarPreset,
    avatarImageKey: profile.avatarImageKey,
    summary: profile.summary,
    phone: profile.phone,
    city: profile.city,
    country: profile.country,
    socialLinks: parseSocialLinks(profile.socialLinksJson),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function isUsernameTaken(username: string, excludeUserId?: string): boolean {
  const normalized = username.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const existing =
    db
      .select({
        userId: userProfiles.userId,
      })
      .from(userProfiles)
      .where(eq(userProfiles.username, normalized))
      .limit(1)
      .get() ?? null;

  if (!existing) {
    return false;
  }

  if (excludeUserId && existing.userId === excludeUserId) {
    return false;
  }

  return true;
}

export function upsertUserProfile(
  userId: string,
  input: {
    username?: string | null;
    avatarType?: AvatarType;
    avatarPreset?: string | null;
    avatarImageKey?: string | null;
    summary?: string;
    phone?: string;
    city?: string;
    country?: string;
    socialLinks?: Array<{ label: string; url: string }>;
  },
): UserProfileRecord {
  const current = getUserProfileByUserId(userId);
  const timestamp = nowIso();
  const normalizedUsername = normalizeUsernameValue(input.username);

  db.update(userProfiles)
    .set({
      username: normalizedUsername === undefined ? current.username : normalizedUsername,
      avatarType: input.avatarType ?? current.avatarType,
      avatarPreset: input.avatarPreset === undefined ? current.avatarPreset : toNullableString(input.avatarPreset),
      avatarImageKey:
        input.avatarImageKey === undefined ? current.avatarImageKey : toNullableString(input.avatarImageKey),
      summary: input.summary ?? current.summary,
      phone: input.phone ?? current.phone,
      city: input.city ?? current.city,
      country: input.country ?? current.country,
      socialLinksJson: input.socialLinks
        ? stringifySocialLinks(input.socialLinks)
        : stringifySocialLinks(current.socialLinks),
      updatedAt: timestamp,
    })
    .where(eq(userProfiles.userId, userId))
    .run();

  return getUserProfileByUserId(userId);
}

export function getUserPreferencesByUserId(userId: string): UserPreferencesRecord {
  let preferences = db
    .select()
    .from(userPreferences)
    .where(eq(userPreferences.userId, userId))
    .limit(1)
    .get();

  if (!preferences) {
    const timestamp = nowIso();
    db.insert(userPreferences)
      .values({
        id: cryptoRandomId(),
        userId,
        language: defaultUserPreferences.language,
        timezone: defaultUserPreferences.timezone,
        profileVisibility: defaultUserPreferences.profileVisibility,
        showEmail: defaultUserPreferences.showEmail,
        showPhone: defaultUserPreferences.showPhone,
        allowContact: defaultUserPreferences.allowContact,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();

    preferences = db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1)
      .get();
  }

  if (!preferences) {
    throw new Error("Failed to load user preferences.");
  }

  return {
    id: preferences.id,
    userId: preferences.userId,
    language: preferences.language,
    timezone: preferences.timezone,
    profileVisibility: normalizeProfileVisibility(preferences.profileVisibility),
    showEmail: preferences.showEmail,
    showPhone: preferences.showPhone,
    allowContact: preferences.allowContact,
    createdAt: preferences.createdAt,
    updatedAt: preferences.updatedAt,
  };
}

export function upsertUserPreferences(
  userId: string,
  input: Partial<Pick<UserPreferencesRecord, "language" | "timezone" | "profileVisibility" | "showEmail" | "showPhone" | "allowContact">>,
): UserPreferencesRecord {
  const current = getUserPreferencesByUserId(userId);

  db.update(userPreferences)
    .set({
      language: input.language ?? current.language,
      timezone: input.timezone ?? current.timezone,
      profileVisibility: input.profileVisibility ?? current.profileVisibility,
      showEmail: input.showEmail ?? current.showEmail,
      showPhone: input.showPhone ?? current.showPhone,
      allowContact: input.allowContact ?? current.allowContact,
      updatedAt: nowIso(),
    })
    .where(eq(userPreferences.userId, userId))
    .run();

  return getUserPreferencesByUserId(userId);
}

export function getUserNotificationPreferencesByUserId(userId: string): UserNotificationPreferencesRecord {
  let preferences = db
    .select()
    .from(userNotificationPreferences)
    .where(eq(userNotificationPreferences.userId, userId))
    .limit(1)
    .get();

  if (!preferences) {
    const timestamp = nowIso();
    db.insert(userNotificationPreferences)
      .values({
        id: cryptoRandomId(),
        userId,
        emailChallenges: defaultNotificationPreferences.emailChallenges,
        emailEvents: defaultNotificationPreferences.emailEvents,
        emailUpdates: defaultNotificationPreferences.emailUpdates,
        emailMarketing: defaultNotificationPreferences.emailMarketing,
        pushChallenges: defaultNotificationPreferences.pushChallenges,
        pushEvents: defaultNotificationPreferences.pushEvents,
        pushUpdates: defaultNotificationPreferences.pushUpdates,
        digest: defaultNotificationPreferences.digest,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();

    preferences = db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId))
      .limit(1)
      .get();
  }

  if (!preferences) {
    throw new Error("Failed to load user notification preferences.");
  }

  return {
    id: preferences.id,
    userId: preferences.userId,
    emailChallenges: preferences.emailChallenges,
    emailEvents: preferences.emailEvents,
    emailUpdates: preferences.emailUpdates,
    emailMarketing: preferences.emailMarketing,
    pushChallenges: preferences.pushChallenges,
    pushEvents: preferences.pushEvents,
    pushUpdates: preferences.pushUpdates,
    digest: normalizeNotificationDigest(preferences.digest),
    createdAt: preferences.createdAt,
    updatedAt: preferences.updatedAt,
  };
}

export function upsertUserNotificationPreferences(
  userId: string,
  input: Partial<
    Pick<
      UserNotificationPreferencesRecord,
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
): UserNotificationPreferencesRecord {
  const current = getUserNotificationPreferencesByUserId(userId);

  db.update(userNotificationPreferences)
    .set({
      emailChallenges: input.emailChallenges ?? current.emailChallenges,
      emailEvents: input.emailEvents ?? current.emailEvents,
      emailUpdates: input.emailUpdates ?? current.emailUpdates,
      emailMarketing: input.emailMarketing ?? current.emailMarketing,
      pushChallenges: input.pushChallenges ?? current.pushChallenges,
      pushEvents: input.pushEvents ?? current.pushEvents,
      pushUpdates: input.pushUpdates ?? current.pushUpdates,
      digest: input.digest ?? current.digest,
      updatedAt: nowIso(),
    })
    .where(eq(userNotificationPreferences.userId, userId))
    .run();

  return getUserNotificationPreferencesByUserId(userId);
}

export function deleteSessionsByUserId(userId: string): number {
  const deleted = db.delete(sessions).where(eq(sessions.userId, userId)).run();
  return deleted.changes ?? 0;
}

export function deleteRefreshSessionsByUserId(userId: string): number {
  const deleted = db.delete(refreshSessions).where(eq(refreshSessions.userId, userId)).run();
  return deleted.changes ?? 0;
}

export function softDeleteUserAndAnonymize(input: { userId: string; reason: string }): boolean {
  const existing = db
    .select({
      id: users.id,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.id, input.userId))
    .limit(1)
    .get();

  if (!existing || existing.deletedAt) {
    return false;
  }

  const timestamp = nowIso();
  const alias = input.userId.slice(0, 12);
  const anonymizedName = `Deleted User ${alias}`;
  const anonymizedEmail = `deleted+${alias}@deleted.ataraxia.local`;

  db.transaction(() => {
    db.update(users)
      .set({
        name: anonymizedName,
        email: anonymizedEmail,
        passwordHash: `deleted:${cryptoRandomId()}`,
        mfaEnabled: false,
        passkeyEnabled: false,
        emailVerifiedAt: null,
        deletedAt: timestamp,
        anonymizedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(users.id, input.userId))
      .run();

    db.update(userProfiles)
      .set({
        username: null,
        summary: "",
        phone: "",
        city: "",
        country: "",
        socialLinksJson: "[]",
        updatedAt: timestamp,
      })
      .where(eq(userProfiles.userId, input.userId))
      .run();

    db.update(userDevices)
      .set({
        revokedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(and(eq(userDevices.userId, input.userId), isNull(userDevices.revokedAt)))
      .run();

    db.delete(sessions).where(eq(sessions.userId, input.userId)).run();
    db.delete(refreshSessions).where(eq(refreshSessions.userId, input.userId)).run();
    db.delete(passkeyCredentials).where(eq(passkeyCredentials.userId, input.userId)).run();
    db.delete(userTotpSecrets).where(eq(userTotpSecrets.userId, input.userId)).run();
    db.delete(mfaChallenges).where(eq(mfaChallenges.userId, input.userId)).run();
    db.delete(emailVerificationChallenges)
      .where(eq(emailVerificationChallenges.userId, input.userId))
      .run();

    db.insert(userDeletionAudit)
      .values({
        id: cryptoRandomId(),
        userId: input.userId,
        reason: input.reason,
        deletedAt: timestamp,
        createdAt: timestamp,
      })
      .run();
  });

  return true;
}

export function createUserLegalConsent(input: {
  id: string;
  userId: string;
  policyType: LegalPolicyType;
  policyVersion: string;
  acceptedAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): void {
  db.insert(userLegalConsents)
    .values({
      id: input.id,
      userId: input.userId,
      policyType: input.policyType,
      policyVersion: input.policyVersion,
      acceptedAt: input.acceptedAt,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      createdAt: nowIso(),
    })
    .run();
}

export function createEmailVerificationChallenge(input: {
  id: string;
  userId: string;
  tokenHash: string;
  codeHash: string;
  expiresAt: string;
}): EmailVerificationChallengeRecord {
  db
    .delete(emailVerificationChallenges)
    .where(
      and(
        eq(emailVerificationChallenges.userId, input.userId),
        isNull(emailVerificationChallenges.consumedAt),
      ),
    )
    .run();

  const timestamp = nowIso();

  db.insert(emailVerificationChallenges)
    .values({
      id: input.id,
      userId: input.userId,
      tokenHash: input.tokenHash,
      codeHash: input.codeHash,
      expiresAt: input.expiresAt,
      createdAt: timestamp,
      consumedAt: null,
      lastSentAt: timestamp,
      sendCount: 1,
    })
    .run();

  const created = db
    .select()
    .from(emailVerificationChallenges)
    .where(eq(emailVerificationChallenges.id, input.id))
    .limit(1)
    .get();

  if (!created) {
    throw new Error("Failed to create email verification challenge.");
  }

  return created;
}

export function getActiveEmailVerificationChallengeByTokenHash(
  tokenHash: string,
): EmailVerificationChallengeRecord | null {
  const existing = db
    .select()
    .from(emailVerificationChallenges)
    .where(
      and(
        eq(emailVerificationChallenges.tokenHash, tokenHash),
        isNull(emailVerificationChallenges.consumedAt),
        gt(emailVerificationChallenges.expiresAt, nowIso()),
      ),
    )
    .limit(1)
    .get();

  return existing ?? null;
}

export function getActiveEmailVerificationChallengeByCodeHash(
  userId: string,
  codeHash: string,
): EmailVerificationChallengeRecord | null {
  const existing = db
    .select()
    .from(emailVerificationChallenges)
    .where(
      and(
        eq(emailVerificationChallenges.userId, userId),
        eq(emailVerificationChallenges.codeHash, codeHash),
        isNull(emailVerificationChallenges.consumedAt),
        gt(emailVerificationChallenges.expiresAt, nowIso()),
      ),
    )
    .orderBy(desc(emailVerificationChallenges.createdAt))
    .limit(1)
    .get();

  return existing ?? null;
}

export function getLatestEmailVerificationChallengeByUserId(
  userId: string,
): EmailVerificationChallengeRecord | null {
  const existing = db
    .select()
    .from(emailVerificationChallenges)
    .where(
      and(
        eq(emailVerificationChallenges.userId, userId),
        isNull(emailVerificationChallenges.consumedAt),
      ),
    )
    .orderBy(desc(emailVerificationChallenges.createdAt))
    .limit(1)
    .get();

  return existing ?? null;
}

export function replaceEmailVerificationChallenge(input: {
  challengeId: string;
  tokenHash: string;
  codeHash: string;
  expiresAt: string;
}): EmailVerificationChallengeRecord | null {
  const existing = db
    .select({ sendCount: emailVerificationChallenges.sendCount })
    .from(emailVerificationChallenges)
    .where(eq(emailVerificationChallenges.id, input.challengeId))
    .limit(1)
    .get();

  if (!existing) {
    return null;
  }

  db.update(emailVerificationChallenges)
    .set({
      tokenHash: input.tokenHash,
      codeHash: input.codeHash,
      expiresAt: input.expiresAt,
      consumedAt: null,
      lastSentAt: nowIso(),
      sendCount: existing.sendCount + 1,
    })
    .where(eq(emailVerificationChallenges.id, input.challengeId))
    .run();

  return (
    db
      .select()
      .from(emailVerificationChallenges)
      .where(eq(emailVerificationChallenges.id, input.challengeId))
      .limit(1)
      .get() ?? null
  );
}

export function consumeEmailVerificationChallenge(challengeId: string): boolean {
  const timestamp = nowIso();

  const updated = db
    .update(emailVerificationChallenges)
    .set({ consumedAt: timestamp })
    .where(
      and(
        eq(emailVerificationChallenges.id, challengeId),
        isNull(emailVerificationChallenges.consumedAt),
      ),
    )
    .run();

  return updated.changes > 0;
}

function toOnboardingProfileRecord(profile: typeof userOnboardingProfiles.$inferSelect): OnboardingProfileRecord {
  const normalizedGoal =
    profile.primaryGoal === "reflect_more_clearly" ||
    profile.primaryGoal === "reduce_stress" ||
    profile.primaryGoal === "build_discipline" ||
    profile.primaryGoal === "explore_philosophy" ||
    profile.primaryGoal === "improve_emotional_awareness"
      ? profile.primaryGoal
      : "explore_philosophy";

  const normalizedLevel =
    profile.experienceLevel === "new_to_philosophy" ||
    profile.experienceLevel === "somewhat_familiar" ||
    profile.experienceLevel === "advanced"
      ? profile.experienceLevel
      : "new_to_philosophy";

  const preferredTopics = parsePreferredTopics(profile.preferredTopicsJson);

  return {
    id: profile.id,
    userId: profile.userId,
    primaryGoal: normalizedGoal,
    preferredTopics: preferredTopics.length > 0 ? preferredTopics : ["stoicism"],
    experienceLevel: normalizedLevel,
    primaryObjective: profile.primaryObjective,
    biggestDifficulty: profile.biggestDifficulty,
    mainNeed: profile.mainNeed,
    dailyTimeCommitment: profile.dailyTimeCommitment,
    coachingStyle: profile.coachingStyle,
    contemplativeExperience: profile.contemplativeExperience,
    preferredPracticeFormat: profile.preferredPracticeFormat,
    successDefinition30d: profile.successDefinition30d,
    notes: profile.notes,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function getUserOnboardingProfile(userId: string): OnboardingProfileRecord | null {
  const existing = db
    .select()
    .from(userOnboardingProfiles)
    .where(eq(userOnboardingProfiles.userId, userId))
    .limit(1)
    .get();

  return existing ? toOnboardingProfileRecord(existing) : null;
}

export function upsertUserOnboardingProfile(input: {
  id: string;
  userId: string;
  primaryGoal: "reflect_more_clearly" | "reduce_stress" | "build_discipline" | "explore_philosophy" | "improve_emotional_awareness";
  preferredTopics: Array<"stoicism" | "epicureanism" | "mindfulness" | "psychology" | "habits" | "journaling">;
  experienceLevel: "new_to_philosophy" | "somewhat_familiar" | "advanced";
  primaryObjective: string;
  biggestDifficulty?: string | null;
  mainNeed?: string | null;
  dailyTimeCommitment: string;
  coachingStyle?: string | null;
  contemplativeExperience?: string | null;
  preferredPracticeFormat: string;
  successDefinition30d?: string | null;
  notes?: string | null;
}): OnboardingProfileRecord {
  const defaultDeferredValue = "Deferred to progressive profiling";
  const defaultDailyTimeCommitment = "10 min";
  const defaultPreferredPracticeFormat = "A short practice";
  const biggestDifficulty = input.biggestDifficulty ?? defaultDeferredValue;
  const mainNeed = input.mainNeed ?? defaultDeferredValue;
  const coachingStyle = input.coachingStyle ?? defaultDeferredValue;
  const contemplativeExperience = input.contemplativeExperience ?? defaultDeferredValue;
  const successDefinition30d = input.successDefinition30d ?? defaultDeferredValue;
  const primaryObjective = input.primaryObjective || "Find meaning";
  const dailyTimeCommitment = input.dailyTimeCommitment || defaultDailyTimeCommitment;
  const preferredPracticeFormat = input.preferredPracticeFormat || defaultPreferredPracticeFormat;
  const preferredTopicsJson = stringifyPreferredTopics(input.preferredTopics);

  const existing = db
    .select({ id: userOnboardingProfiles.id })
    .from(userOnboardingProfiles)
    .where(eq(userOnboardingProfiles.userId, input.userId))
    .limit(1)
    .get();

  const timestamp = nowIso();

  if (existing) {
    db.update(userOnboardingProfiles)
      .set({
        primaryGoal: input.primaryGoal,
        preferredTopicsJson,
        experienceLevel: input.experienceLevel,
        primaryObjective,
        biggestDifficulty,
        mainNeed,
        dailyTimeCommitment,
        coachingStyle,
        contemplativeExperience,
        preferredPracticeFormat,
        successDefinition30d,
        notes: input.notes ?? null,
        updatedAt: timestamp,
      })
      .where(eq(userOnboardingProfiles.userId, input.userId))
      .run();
  } else {
    db.insert(userOnboardingProfiles)
      .values({
        id: input.id,
        userId: input.userId,
        primaryGoal: input.primaryGoal,
        preferredTopicsJson,
        experienceLevel: input.experienceLevel,
        primaryObjective,
        biggestDifficulty,
        mainNeed,
        dailyTimeCommitment,
        coachingStyle,
        contemplativeExperience,
        preferredPracticeFormat,
        successDefinition30d,
        notes: input.notes ?? null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();
  }

  const profile = db
    .select()
    .from(userOnboardingProfiles)
    .where(eq(userOnboardingProfiles.userId, input.userId))
    .limit(1)
    .get();

  if (!profile) {
    throw new Error("Failed to upsert user onboarding profile.");
  }

  return toOnboardingProfileRecord(profile);
}

export function createSession(input: {
  id: string;
  tokenHash: string;
  userId: string;
  deviceId?: string | null;
  expiresAt: string;
}): void {
  db.insert(sessions)
    .values({
      id: input.id,
      tokenHash: input.tokenHash,
      userId: input.userId,
      deviceId: input.deviceId ?? null,
      expiresAt: input.expiresAt,
      createdAt: nowIso(),
    })
    .run();
}

export function deleteSessionByTokenHash(tokenHash: string): void {
  db.delete(sessions).where(eq(sessions.tokenHash, tokenHash)).run();
}

export function deleteExpiredSessionsByUser(userId: string): void {
  db
    .delete(sessions)
    .where(and(eq(sessions.userId, userId), lt(sessions.expiresAt, nowIso())))
    .run();
}

export function getSessionUserByTokenHash(tokenHash: string): CurrentUser | null {
  const joined = db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
      userEmailVerifiedAt: users.emailVerifiedAt,
      userOnboardingCompletedAt: users.onboardingCompletedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, nowIso()), isNull(users.deletedAt)),
    )
    .limit(1)
    .get();

  if (!joined) {
    return null;
  }

  return {
    id: joined.userId,
    name: joined.userName,
    email: joined.userEmail,
    role: joined.userRole,
    emailVerifiedAt: joined.userEmailVerifiedAt,
    onboardingCompletedAt: joined.userOnboardingCompletedAt,
  };
}

export function createRefreshSession(input: {
  id: string;
  tokenHash: string;
  userId: string;
  deviceId?: string | null;
  expiresAt: string;
}): void {
  db.insert(refreshSessions)
    .values({
      id: input.id,
      tokenHash: input.tokenHash,
      userId: input.userId,
      deviceId: input.deviceId ?? null,
      expiresAt: input.expiresAt,
      createdAt: nowIso(),
      rotatedAt: null,
    })
    .run();
}

export function deleteRefreshSessionByTokenHash(tokenHash: string): void {
  db.delete(refreshSessions).where(eq(refreshSessions.tokenHash, tokenHash)).run();
}

export function deleteExpiredRefreshSessionsByUser(userId: string): void {
  db
    .delete(refreshSessions)
    .where(and(eq(refreshSessions.userId, userId), lt(refreshSessions.expiresAt, nowIso())))
    .run();
}

export function getRefreshSessionContextByTokenHash(tokenHash: string): RefreshSessionContext | null {
  const joined = db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
      userEmailVerifiedAt: users.emailVerifiedAt,
      userOnboardingCompletedAt: users.onboardingCompletedAt,
      deviceId: refreshSessions.deviceId,
    })
    .from(refreshSessions)
    .innerJoin(users, eq(refreshSessions.userId, users.id))
    .where(
      and(
        eq(refreshSessions.tokenHash, tokenHash),
        gt(refreshSessions.expiresAt, nowIso()),
        isNull(users.deletedAt),
      ),
    )
    .limit(1)
    .get();

  if (!joined) {
    return null;
  }

  return {
    user: {
      id: joined.userId,
      name: joined.userName,
      email: joined.userEmail,
      role: joined.userRole,
      emailVerifiedAt: joined.userEmailVerifiedAt,
      onboardingCompletedAt: joined.userOnboardingCompletedAt,
    },
    deviceId: joined.deviceId,
  };
}

export function getRefreshSessionUserByTokenHash(tokenHash: string): CurrentUser | null {
  const context = getRefreshSessionContextByTokenHash(tokenHash);
  return context?.user ?? null;
}

export function rotateRefreshSessionByTokenHash(
  oldTokenHash: string,
  replacement: {
    id: string;
    tokenHash: string;
    userId: string;
    deviceId?: string | null;
    expiresAt: string;
  },
): boolean {
  const existing = db
    .select({
      id: refreshSessions.id,
    })
    .from(refreshSessions)
    .where(and(eq(refreshSessions.tokenHash, oldTokenHash), gt(refreshSessions.expiresAt, nowIso())))
    .limit(1)
    .get();

  if (!existing) {
    return false;
  }

  db.transaction(() => {
    db.update(refreshSessions)
      .set({ rotatedAt: nowIso() })
      .where(eq(refreshSessions.id, existing.id))
      .run();

    db.delete(refreshSessions).where(eq(refreshSessions.id, existing.id)).run();

    db.insert(refreshSessions)
      .values({
        id: replacement.id,
        tokenHash: replacement.tokenHash,
        userId: replacement.userId,
        deviceId: replacement.deviceId ?? null,
        expiresAt: replacement.expiresAt,
        createdAt: nowIso(),
        rotatedAt: null,
      })
      .run();
  });

  return true;
}

export function getSecuritySettingsByUserId(userId: string): SecuritySettings | null {
  const row = db
    .select({
      mfaEnabled: users.mfaEnabled,
      passkeyEnabled: users.passkeyEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)
    .get();

  if (!row) {
    return null;
  }

  return {
    mfaEnabled: row.mfaEnabled,
    passkeyEnabled: row.passkeyEnabled,
  };
}

export function setUserMfaEnabled(userId: string, enabled: boolean): void {
  db.update(users)
    .set({
      mfaEnabled: enabled,
      updatedAt: nowIso(),
    })
    .where(eq(users.id, userId))
    .run();
}

export function setUserPasskeyEnabled(userId: string, enabled: boolean): void {
  db.update(users)
    .set({
      passkeyEnabled: enabled,
      updatedAt: nowIso(),
    })
    .where(eq(users.id, userId))
    .run();
}

export function listPasskeyCredentialsByUserId(userId: string): PasskeyCredentialRecord[] {
  const rows = db
    .select()
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.userId, userId))
    .orderBy(desc(passkeyCredentials.createdAt))
    .all();

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    credentialId: row.credentialId,
    nickname: row.nickname,
    publicKey: row.publicKey,
    counter: row.counter,
    transports: parseTransports(row.transports),
    lastUsedAt: row.lastUsedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export function getPasskeyCredentialByCredentialId(
  credentialId: string,
): PasskeyCredentialRecord | null {
  const row = db
    .select()
    .from(passkeyCredentials)
    .where(eq(passkeyCredentials.credentialId, credentialId))
    .limit(1)
    .get();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userId: row.userId,
    credentialId: row.credentialId,
    nickname: row.nickname,
    publicKey: row.publicKey,
    counter: row.counter,
    transports: parseTransports(row.transports),
    lastUsedAt: row.lastUsedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createPasskeyCredential(input: {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  nickname?: string | null;
  transports?: string[];
}): void {
  const timestamp = nowIso();

  db.insert(passkeyCredentials)
    .values({
      id: input.id,
      userId: input.userId,
      credentialId: input.credentialId,
      nickname: input.nickname ?? null,
      publicKey: input.publicKey,
      counter: input.counter,
      transports: JSON.stringify(input.transports ?? []),
      lastUsedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function updatePasskeyCredential(input: {
  credentialId: string;
  publicKey: string;
  counter: number;
  nickname?: string | null;
  transports?: string[];
}): void {
  db.update(passkeyCredentials)
    .set({
      publicKey: input.publicKey,
      counter: input.counter,
      nickname: input.nickname ?? null,
      transports: JSON.stringify(input.transports ?? []),
      updatedAt: nowIso(),
    })
    .where(eq(passkeyCredentials.credentialId, input.credentialId))
    .run();
}

export function updatePasskeyCredentialCounter(
  credentialId: string,
  counter: number,
): void {
  db.update(passkeyCredentials)
    .set({
      counter,
      lastUsedAt: nowIso(),
      updatedAt: nowIso(),
    })
    .where(eq(passkeyCredentials.credentialId, credentialId))
    .run();
}

export function renamePasskeyCredentialById(
  userId: string,
  passkeyId: string,
  nickname: string,
): boolean {
  const existing = db
    .select({ id: passkeyCredentials.id })
    .from(passkeyCredentials)
    .where(and(eq(passkeyCredentials.id, passkeyId), eq(passkeyCredentials.userId, userId)))
    .limit(1)
    .get();

  if (!existing) {
    return false;
  }

  db.update(passkeyCredentials)
    .set({
      nickname,
      updatedAt: nowIso(),
    })
    .where(eq(passkeyCredentials.id, passkeyId))
    .run();

  return true;
}

export function deletePasskeyCredentialById(userId: string, passkeyId: string): boolean {
  const existing = db
    .select({ id: passkeyCredentials.id })
    .from(passkeyCredentials)
    .where(and(eq(passkeyCredentials.id, passkeyId), eq(passkeyCredentials.userId, userId)))
    .limit(1)
    .get();

  if (!existing) {
    return false;
  }

  db.delete(passkeyCredentials).where(eq(passkeyCredentials.id, passkeyId)).run();
  return true;
}

export function upsertUserTotpSecret(input: {
  id: string;
  userId: string;
  secret: string;
  verifiedAt?: string | null;
}): void {
  const existing = db
    .select({ id: userTotpSecrets.id })
    .from(userTotpSecrets)
    .where(eq(userTotpSecrets.userId, input.userId))
    .limit(1)
    .get();

  if (existing) {
    db.update(userTotpSecrets)
      .set({
        secret: input.secret,
        verifiedAt: input.verifiedAt ?? null,
        updatedAt: nowIso(),
      })
      .where(eq(userTotpSecrets.userId, input.userId))
      .run();
    return;
  }

  const timestamp = nowIso();
  db.insert(userTotpSecrets)
    .values({
      id: input.id,
      userId: input.userId,
      secret: input.secret,
      verifiedAt: input.verifiedAt ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function getUserTotpSecret(userId: string): {
  id: string;
  userId: string;
  secret: string;
  verifiedAt: string | null;
} | null {
  const existing = db
    .select({
      id: userTotpSecrets.id,
      userId: userTotpSecrets.userId,
      secret: userTotpSecrets.secret,
      verifiedAt: userTotpSecrets.verifiedAt,
    })
    .from(userTotpSecrets)
    .where(eq(userTotpSecrets.userId, userId))
    .limit(1)
    .get();

  return existing ?? null;
}

export function markUserTotpVerified(userId: string): void {
  db.update(userTotpSecrets)
    .set({
      verifiedAt: nowIso(),
      updatedAt: nowIso(),
    })
    .where(eq(userTotpSecrets.userId, userId))
    .run();
}

export function deleteUserTotpSecret(userId: string): void {
  db.delete(userTotpSecrets).where(eq(userTotpSecrets.userId, userId)).run();
}

export function createMfaChallenge(input: {
  id: string;
  userId: string;
  codeHash: string;
  expiresAt: string;
}): void {
  db.insert(mfaChallenges)
    .values({
      id: input.id,
      userId: input.userId,
      codeHash: input.codeHash,
      expiresAt: input.expiresAt,
      createdAt: nowIso(),
    })
    .run();
}

export function useMfaChallenge(input: {
  id: string;
  userId: string;
  codeHash: string;
}): boolean {
  const existing = db
    .select({
      id: mfaChallenges.id,
    })
    .from(mfaChallenges)
    .where(
      and(
        eq(mfaChallenges.id, input.id),
        eq(mfaChallenges.userId, input.userId),
        eq(mfaChallenges.codeHash, input.codeHash),
        gt(mfaChallenges.expiresAt, nowIso()),
      ),
    )
    .limit(1)
    .get();

  if (!existing) {
    return false;
  }

  db.delete(mfaChallenges).where(eq(mfaChallenges.id, existing.id)).run();
  return true;
}

export function createJournalEntry(input: {
  id: string;
  userId: string;
  title: string;
  body: string;
  mood: string;
}) {
  const timestamp = nowIso();

  db.insert(journalEntries)
    .values({
      id: input.id,
      userId: input.userId,
      title: input.title,
      body: input.body,
      mood: input.mood,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  db.insert(userNotifications)
    .values({
      id: cryptoRandomId(),
      userId: input.userId,
      title: "Reflection saved",
      body: `Your entry "${input.title}" was stored successfully.`,
      href: "/journal",
      readAt: null,
      createdAt: timestamp,
    })
    .run();
}

export function listJournalEntriesByUser(userId: string, limit: number) {
  return db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.createdAt))
    .limit(limit)
    .all();
}

export function countJournalEntriesByUser(userId: string): number {
  const row = db
    .select({ count: count() })
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .get();

  return row?.count ?? 0;
}

function buildReflectionEntryWhereClause(input: {
  userId: string;
  search?: string;
  favoriteOnly?: boolean;
  status?: ReflectionStatus;
}) {
  const filters: SQL[] = [
    eq(reflectionEntries.userId, input.userId),
    isNull(reflectionEntries.deletedAt),
  ];

  if (input.favoriteOnly) {
    filters.push(eq(reflectionEntries.isFavorite, true));
  }

  if (input.status) {
    filters.push(eq(reflectionEntries.status, input.status));
  }

  const search = input.search?.trim();
  if (search && search.length > 0) {
    const pattern = `%${search}%`;
    filters.push(
      or(
        like(reflectionEntries.title, pattern),
        like(reflectionEntries.rawText, pattern),
        like(reflectionEntries.cleanTranscript, pattern),
        like(reflectionEntries.refinedText, pattern),
        like(reflectionEntries.commentary, pattern),
      ) as SQL,
    );
  }

  return and(...filters);
}

function listReflectionTagsByReflectionIds(reflectionIds: string[]): Map<string, ReflectionTagRecord[]> {
  const byReflectionId = new Map<string, ReflectionTagRecord[]>();

  if (reflectionIds.length === 0) {
    return byReflectionId;
  }

  const rows = db
    .select()
    .from(reflectionTags)
    .where(inArray(reflectionTags.reflectionId, reflectionIds))
    .orderBy(asc(reflectionTags.createdAt))
    .all();

  for (const row of rows) {
    const tags = byReflectionId.get(row.reflectionId) ?? [];
    tags.push({
      id: row.id,
      reflectionId: row.reflectionId,
      tag: row.tag,
      createdAt: row.createdAt,
    });
    byReflectionId.set(row.reflectionId, tags);
  }

  return byReflectionId;
}

function listReflectionAudioAssetsByReflectionIds(
  reflectionIds: string[],
): Map<string, ReflectionAudioAssetRecord[]> {
  const byReflectionId = new Map<string, ReflectionAudioAssetRecord[]>();

  if (reflectionIds.length === 0) {
    return byReflectionId;
  }

  const rows = db
    .select()
    .from(reflectionAudioAssets)
    .where(inArray(reflectionAudioAssets.reflectionId, reflectionIds))
    .orderBy(asc(reflectionAudioAssets.createdAt))
    .all();

  for (const row of rows) {
    const assets = byReflectionId.get(row.reflectionId) ?? [];
    assets.push({
      id: row.id,
      reflectionId: row.reflectionId,
      storageKey: row.storageKey,
      fileName: row.fileName,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      durationSeconds: row.durationSeconds ?? null,
      createdAt: row.createdAt,
    });
    byReflectionId.set(row.reflectionId, assets);
  }

  return byReflectionId;
}

function listReflectionProcessingJobsByReflectionIds(
  reflectionIds: string[],
): Map<string, ReflectionProcessingJobRecord[]> {
  const byReflectionId = new Map<string, ReflectionProcessingJobRecord[]>();

  if (reflectionIds.length === 0) {
    return byReflectionId;
  }

  const rows = db
    .select()
    .from(reflectionProcessingJobs)
    .where(inArray(reflectionProcessingJobs.reflectionId, reflectionIds))
    .orderBy(asc(reflectionProcessingJobs.createdAt))
    .all();

  for (const row of rows) {
    const jobs = byReflectionId.get(row.reflectionId) ?? [];
    jobs.push({
      id: row.id,
      reflectionId: row.reflectionId,
      step: normalizeReflectionProcessingStep(row.step),
      status: normalizeReflectionProcessingJobStatus(row.status),
      errorMessage: row.errorMessage ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
    byReflectionId.set(row.reflectionId, jobs);
  }

  return byReflectionId;
}

function hydrateReflectionEntryRecord(
  row: typeof reflectionEntries.$inferSelect,
  relations?: {
    tags?: Map<string, ReflectionTagRecord[]>;
    audioAssets?: Map<string, ReflectionAudioAssetRecord[]>;
    processingJobs?: Map<string, ReflectionProcessingJobRecord[]>;
  },
): ReflectionEntryRecord {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    sourceType: normalizeReflectionSourceType(row.sourceType),
    rawText: row.rawText,
    cleanTranscript: row.cleanTranscript ?? null,
    refinedText: row.refinedText ?? null,
    commentary: row.commentary ?? null,
    commentaryMode: row.commentaryMode ?? null,
    language: row.language,
    isFavorite: row.isFavorite,
    status: normalizeReflectionStatus(row.status),
    processingError: row.processingError ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null,
    tags: relations?.tags?.get(row.id) ?? [],
    audioAssets: relations?.audioAssets?.get(row.id) ?? [],
    processingJobs: relations?.processingJobs?.get(row.id) ?? [],
  };
}

export function createReflectionEntry(input: {
  id: string;
  userId: string;
  title: string;
  sourceType: ReflectionSourceType;
  rawText: string;
  commentaryMode?: string | null;
  language?: string;
  status?: ReflectionStatus;
}): ReflectionEntryRecord {
  const timestamp = nowIso();
  const created = {
    id: input.id,
    userId: input.userId,
    title: input.title.trim(),
    sourceType: input.sourceType,
    rawText: input.rawText.trim(),
    cleanTranscript: null,
    refinedText: null,
    commentary: null,
    commentaryMode: input.commentaryMode?.trim() || null,
    language: input.language?.trim() || "en",
    isFavorite: false,
    status: input.status ?? "draft",
    processingError: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  } satisfies typeof reflectionEntries.$inferInsert;

  db.insert(reflectionEntries).values(created).run();
  return hydrateReflectionEntryRecord(created);
}

export function attachReflectionAudioAsset(input: {
  id: string;
  reflectionId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number | null;
}): ReflectionAudioAssetRecord {
  const created = {
    id: input.id,
    reflectionId: input.reflectionId,
    storageKey: input.storageKey,
    fileName: input.fileName,
    mimeType: input.mimeType,
    sizeBytes: Math.max(0, Math.trunc(input.sizeBytes)),
    durationSeconds: input.durationSeconds ?? null,
    createdAt: nowIso(),
  } satisfies typeof reflectionAudioAssets.$inferInsert;

  db.insert(reflectionAudioAssets).values(created).run();

  return {
    id: created.id,
    reflectionId: created.reflectionId,
    storageKey: created.storageKey,
    fileName: created.fileName,
    mimeType: created.mimeType,
    sizeBytes: created.sizeBytes,
    durationSeconds: created.durationSeconds,
    createdAt: created.createdAt,
  };
}

export function setReflectionTags(reflectionId: string, tags: string[]): ReflectionTagRecord[] {
  const normalized = Array.from(
    new Set(tags.map((tag) => normalizeReflectionTag(tag)).filter((tag) => tag.length > 0)),
  ).slice(0, 16);
  const timestamp = nowIso();

  db.transaction(() => {
    db.delete(reflectionTags).where(eq(reflectionTags.reflectionId, reflectionId)).run();

    if (normalized.length === 0) {
      return;
    }

    db.insert(reflectionTags)
      .values(
        normalized.map((tag) => ({
          id: cryptoRandomId(),
          reflectionId,
          tag,
          createdAt: timestamp,
        })),
      )
      .run();
  });

  return db
    .select()
    .from(reflectionTags)
    .where(eq(reflectionTags.reflectionId, reflectionId))
    .orderBy(asc(reflectionTags.createdAt))
    .all()
    .map((row) => ({
      id: row.id,
      reflectionId: row.reflectionId,
      tag: row.tag,
      createdAt: row.createdAt,
    }));
}

export function countReflectionsByUser(input: {
  userId: string;
  search?: string;
  favoriteOnly?: boolean;
  status?: ReflectionStatus;
}): number {
  const row = db
    .select({ count: count() })
    .from(reflectionEntries)
    .where(buildReflectionEntryWhereClause(input))
    .get();

  return row?.count ?? 0;
}

export function listReflectionsByUser(input: {
  userId: string;
  limit: number;
  offset: number;
  search?: string;
  favoriteOnly?: boolean;
  status?: ReflectionStatus;
}): ReflectionListItemRecord[] {
  const rows = db
    .select()
    .from(reflectionEntries)
    .where(buildReflectionEntryWhereClause(input))
    .orderBy(desc(reflectionEntries.createdAt))
    .limit(Math.max(1, Math.min(100, input.limit)))
    .offset(Math.max(0, input.offset))
    .all();

  if (rows.length === 0) {
    return [];
  }

  const reflectionIds = rows.map((row) => row.id);
  const tagsByReflectionId = listReflectionTagsByReflectionIds(reflectionIds);
  const assetsByReflectionId = listReflectionAudioAssetsByReflectionIds(reflectionIds);

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    title: row.title,
    sourceType: normalizeReflectionSourceType(row.sourceType),
    status: normalizeReflectionStatus(row.status),
    isFavorite: row.isFavorite,
    commentary: row.commentary ?? null,
    cleanTranscript: row.cleanTranscript ?? null,
    refinedText: row.refinedText ?? null,
    rawText: row.rawText,
    language: row.language,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    preview: buildReflectionPreview({
      rawText: row.rawText,
      cleanTranscript: row.cleanTranscript ?? null,
      refinedText: row.refinedText ?? null,
      commentary: row.commentary ?? null,
    }),
    tags: (tagsByReflectionId.get(row.id) ?? []).map((tag) => tag.tag),
    hasAudio: (assetsByReflectionId.get(row.id)?.length ?? 0) > 0,
  }));
}

export function getReflectionById(reflectionId: string): ReflectionEntryRecord | null {
  const row = db
    .select()
    .from(reflectionEntries)
    .where(eq(reflectionEntries.id, reflectionId))
    .limit(1)
    .get();

  if (!row || row.deletedAt) {
    return null;
  }

  const reflectionIds = [row.id];
  const tagsByReflectionId = listReflectionTagsByReflectionIds(reflectionIds);
  const assetsByReflectionId = listReflectionAudioAssetsByReflectionIds(reflectionIds);
  const jobsByReflectionId = listReflectionProcessingJobsByReflectionIds(reflectionIds);

  return hydrateReflectionEntryRecord(row, {
    tags: tagsByReflectionId,
    audioAssets: assetsByReflectionId,
    processingJobs: jobsByReflectionId,
  });
}

export function getReflectionByIdForUser(
  userId: string,
  reflectionId: string,
): ReflectionEntryRecord | null {
  const row = db
    .select()
    .from(reflectionEntries)
    .where(
      and(
        eq(reflectionEntries.id, reflectionId),
        eq(reflectionEntries.userId, userId),
        isNull(reflectionEntries.deletedAt),
      ),
    )
    .limit(1)
    .get();

  if (!row) {
    return null;
  }

  const reflectionIds = [row.id];
  const tagsByReflectionId = listReflectionTagsByReflectionIds(reflectionIds);
  const assetsByReflectionId = listReflectionAudioAssetsByReflectionIds(reflectionIds);
  const jobsByReflectionId = listReflectionProcessingJobsByReflectionIds(reflectionIds);

  return hydrateReflectionEntryRecord(row, {
    tags: tagsByReflectionId,
    audioAssets: assetsByReflectionId,
    processingJobs: jobsByReflectionId,
  });
}

export function listReflectionProcessingJobs(
  reflectionId: string,
): ReflectionProcessingJobRecord[] {
  return db
    .select()
    .from(reflectionProcessingJobs)
    .where(eq(reflectionProcessingJobs.reflectionId, reflectionId))
    .orderBy(asc(reflectionProcessingJobs.createdAt))
    .all()
    .map((row) => ({
      id: row.id,
      reflectionId: row.reflectionId,
      step: normalizeReflectionProcessingStep(row.step),
      status: normalizeReflectionProcessingJobStatus(row.status),
      errorMessage: row.errorMessage ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
}

export function upsertReflectionProcessingJob(input: {
  reflectionId: string;
  step: ReflectionProcessingStep;
  status: ReflectionProcessingJobStatus;
  errorMessage?: string | null;
}): ReflectionProcessingJobRecord {
  const existing = db
    .select()
    .from(reflectionProcessingJobs)
    .where(
      and(
        eq(reflectionProcessingJobs.reflectionId, input.reflectionId),
        eq(reflectionProcessingJobs.step, input.step),
      ),
    )
    .orderBy(desc(reflectionProcessingJobs.createdAt))
    .limit(1)
    .get();
  const timestamp = nowIso();

  if (existing) {
    db.update(reflectionProcessingJobs)
      .set({
        status: input.status,
        errorMessage: input.errorMessage ?? null,
        updatedAt: timestamp,
      })
      .where(eq(reflectionProcessingJobs.id, existing.id))
      .run();

    return {
      id: existing.id,
      reflectionId: existing.reflectionId,
      step: normalizeReflectionProcessingStep(existing.step),
      status: input.status,
      errorMessage: input.errorMessage ?? null,
      createdAt: existing.createdAt,
      updatedAt: timestamp,
    };
  }

  const created = {
    id: cryptoRandomId(),
    reflectionId: input.reflectionId,
    step: input.step,
    status: input.status,
    errorMessage: input.errorMessage ?? null,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies typeof reflectionProcessingJobs.$inferInsert;

  db.insert(reflectionProcessingJobs).values(created).run();

  return {
    id: created.id,
    reflectionId: created.reflectionId,
    step: created.step,
    status: created.status,
    errorMessage: created.errorMessage,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
  };
}

export function updateReflectionById(
  reflectionId: string,
  input: {
    title?: string;
    rawText?: string;
    cleanTranscript?: string | null;
    refinedText?: string | null;
    commentary?: string | null;
    commentaryMode?: string | null;
    language?: string;
    isFavorite?: boolean;
    status?: ReflectionStatus;
    processingError?: string | null;
    deletedAt?: string | null;
  },
): ReflectionEntryRecord | null {
  const existing = db
    .select()
    .from(reflectionEntries)
    .where(eq(reflectionEntries.id, reflectionId))
    .limit(1)
    .get();

  if (!existing) {
    return null;
  }

  const updated = {
    title: input.title?.trim() ?? existing.title,
    rawText: input.rawText?.trim() ?? existing.rawText,
    cleanTranscript:
      input.cleanTranscript === undefined ? existing.cleanTranscript : input.cleanTranscript,
    refinedText: input.refinedText === undefined ? existing.refinedText : input.refinedText,
    commentary: input.commentary === undefined ? existing.commentary : input.commentary,
    commentaryMode:
      input.commentaryMode === undefined ? existing.commentaryMode : input.commentaryMode,
    language: input.language?.trim() || existing.language,
    isFavorite: input.isFavorite ?? existing.isFavorite,
    status: input.status ?? normalizeReflectionStatus(existing.status),
    processingError:
      input.processingError === undefined ? existing.processingError : input.processingError,
    deletedAt: input.deletedAt === undefined ? existing.deletedAt : input.deletedAt,
    updatedAt: nowIso(),
  } satisfies Partial<typeof reflectionEntries.$inferInsert>;

  db.update(reflectionEntries).set(updated).where(eq(reflectionEntries.id, reflectionId)).run();
  return getReflectionById(reflectionId);
}

export function updateReflectionByIdForUser(
  userId: string,
  reflectionId: string,
  input: {
    title?: string;
    refinedText?: string | null;
    commentary?: string | null;
    commentaryMode?: string | null;
    isFavorite?: boolean;
    status?: ReflectionStatus;
  },
): ReflectionEntryRecord | null {
  const existing = getReflectionByIdForUser(userId, reflectionId);
  if (!existing) {
    return null;
  }

  return updateReflectionById(reflectionId, {
    title: input.title ?? existing.title,
    refinedText: input.refinedText === undefined ? existing.refinedText : input.refinedText,
    commentary: input.commentary === undefined ? existing.commentary : input.commentary,
    commentaryMode:
      input.commentaryMode === undefined ? existing.commentaryMode : input.commentaryMode,
    isFavorite: input.isFavorite ?? existing.isFavorite,
    status: input.status ?? existing.status,
  });
}

export function softDeleteReflectionByIdForUser(userId: string, reflectionId: string): boolean {
  const existing = getReflectionByIdForUser(userId, reflectionId);
  if (!existing) {
    return false;
  }

  updateReflectionById(reflectionId, {
    deletedAt: nowIso(),
  });
  return true;
}

export function getLatestReflectionAudioAsset(
  reflectionId: string,
): ReflectionAudioAssetRecord | null {
  const row = db
    .select()
    .from(reflectionAudioAssets)
    .where(eq(reflectionAudioAssets.reflectionId, reflectionId))
    .orderBy(desc(reflectionAudioAssets.createdAt))
    .limit(1)
    .get();

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    reflectionId: row.reflectionId,
    storageKey: row.storageKey,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    durationSeconds: row.durationSeconds ?? null,
    createdAt: row.createdAt,
  };
}

export function createReflectionEvent(input: {
  id: string;
  userId: string;
  reflectionId?: string | null;
  eventType: ReflectionEventType;
  metadataJson?: string;
}): void {
  db.insert(reflectionEvents)
    .values({
      id: input.id,
      userId: input.userId,
      reflectionId: input.reflectionId ?? null,
      eventType: input.eventType,
      metadataJson: input.metadataJson ?? "{}",
      createdAt: nowIso(),
    })
    .run();
}

export function trackContentCompletionByUser(
  userId: string,
  input: { contentKind: ContentCompletionKind; contentSlug: string },
): ContentCompletionRecord {
  const normalizedSlug = input.contentSlug.trim().toLowerCase();
  const timestamp = nowIso();

  const existing = db
    .select()
    .from(userContentCompletions)
    .where(
      and(
        eq(userContentCompletions.userId, userId),
        eq(userContentCompletions.contentKind, input.contentKind),
        eq(userContentCompletions.contentSlug, normalizedSlug),
      ),
    )
    .limit(1)
    .get();

  if (existing) {
    const completionCount = Math.max(1, existing.completionCount + 1);

    db.update(userContentCompletions)
      .set({
        completionCount,
        lastCompletedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(userContentCompletions.id, existing.id))
      .run();
  } else {
    db.insert(userContentCompletions)
      .values({
        id: cryptoRandomId(),
        userId,
        contentKind: input.contentKind,
        contentSlug: normalizedSlug,
        completionCount: 1,
        lastCompletedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();
  }

  const tracked = db
    .select()
    .from(userContentCompletions)
    .where(
      and(
        eq(userContentCompletions.userId, userId),
        eq(userContentCompletions.contentKind, input.contentKind),
        eq(userContentCompletions.contentSlug, normalizedSlug),
      ),
    )
    .limit(1)
    .get();

  if (!tracked) {
    throw new Error("Failed to persist content completion.");
  }

  return tracked;
}

export function getUserContentCompletionSummary(userId: string): UserContentCompletionSummary {
  const lessonsCompletedRow = db
    .select({ count: count() })
    .from(userContentCompletions)
    .where(
      and(
        eq(userContentCompletions.userId, userId),
        eq(userContentCompletions.contentKind, "lesson"),
      ),
    )
    .get();

  const weekThreshold = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const practicesCompletedThisWeekRow = db
    .select({ count: count() })
    .from(userContentCompletions)
    .where(
      and(
        eq(userContentCompletions.userId, userId),
        eq(userContentCompletions.contentKind, "practice"),
        gt(userContentCompletions.lastCompletedAt, weekThreshold),
      ),
    )
    .get();

  const totalLessonsRow = db
    .select({ count: count() })
    .from(libraryLessons)
    .where(eq(libraryLessons.status, "PUBLISHED"))
    .get();

  return {
    lessonsCompleted: lessonsCompletedRow?.count ?? 0,
    practicesCompletedThisWeek: practicesCompletedThisWeekRow?.count ?? 0,
    totalLessons: totalLessonsRow?.count ?? 0,
  };
}

export function listRecentContentCompletionsByUser(
  userId: string,
  limit: number,
): RecentContentCompletionItem[] {
  return db
    .select({
      contentKind: userContentCompletions.contentKind,
      contentSlug: userContentCompletions.contentSlug,
      completionCount: userContentCompletions.completionCount,
      lastCompletedAt: userContentCompletions.lastCompletedAt,
    })
    .from(userContentCompletions)
    .where(eq(userContentCompletions.userId, userId))
    .orderBy(desc(userContentCompletions.lastCompletedAt))
    .limit(limit)
    .all();
}

export function listContentCompletionsByUser(userId: string, limit = 300): ContentCompletionRecord[] {
  return db
    .select()
    .from(userContentCompletions)
    .where(eq(userContentCompletions.userId, userId))
    .orderBy(desc(userContentCompletions.lastCompletedAt))
    .limit(Math.max(1, Math.min(limit, 500)))
    .all();
}

export function getLandingContent() {
  return {
    pillars: db
      .select()
      .from(contentPillars)
      .where(eq(contentPillars.status, "PUBLISHED"))
      .orderBy(asc(contentPillars.id))
      .all(),
    highlights: db
      .select()
      .from(contentHighlights)
      .where(eq(contentHighlights.status, "PUBLISHED"))
      .orderBy(asc(contentHighlights.id))
      .all(),
  };
}

export function getLibraryLessons(query?: string) {
  const normalized = query?.trim();

  if (!normalized) {
    return db
      .select()
      .from(libraryLessons)
      .where(eq(libraryLessons.status, "PUBLISHED"))
      .orderBy(desc(libraryLessons.id))
      .all();
  }

  const likeValue = `%${normalized}%`;

  return db
    .select()
    .from(libraryLessons)
    .where(
      and(
        eq(libraryLessons.status, "PUBLISHED"),
        or(
          like(libraryLessons.title, likeValue),
          like(libraryLessons.tradition, likeValue),
          like(libraryLessons.summary, likeValue),
          like(libraryLessons.content, likeValue),
        ),
      ),
    )
    .orderBy(desc(libraryLessons.id))
    .all();
}

export function getLibraryLessonBySlug(slug: string) {
  return (
    db
      .select()
      .from(libraryLessons)
      .where(and(eq(libraryLessons.slug, slug), eq(libraryLessons.status, "PUBLISHED")))
      .limit(1)
      .get() ?? null
  );
}

export function getPracticeRoutines() {
  return db
    .select()
    .from(practiceRoutines)
    .where(eq(practiceRoutines.status, "PUBLISHED"))
    .orderBy(asc(practiceRoutines.id))
    .all();
}

export function getPracticeRoutineBySlug(slug: string) {
  return (
    db
      .select()
      .from(practiceRoutines)
      .where(and(eq(practiceRoutines.slug, slug), eq(practiceRoutines.status, "PUBLISHED")))
      .limit(1)
      .get() ?? null
  );
}

export function getCommunityCircles() {
  return db
    .select()
    .from(communityCircles)
    .where(eq(communityCircles.status, "PUBLISHED"))
    .orderBy(asc(communityCircles.id))
    .all();
}

export function getCommunityChallenges() {
  return db
    .select()
    .from(communityChallenges)
    .where(eq(communityChallenges.status, "PUBLISHED"))
    .orderBy(asc(communityChallenges.id))
    .all();
}

export function getCommunityResources() {
  return db
    .select()
    .from(communityResources)
    .where(eq(communityResources.status, "PUBLISHED"))
    .orderBy(asc(communityResources.id))
    .all();
}

export function getCommunityExperts() {
  return db
    .select()
    .from(communityExperts)
    .where(eq(communityExperts.status, "PUBLISHED"))
    .orderBy(asc(communityExperts.id))
    .all();
}

export function getCommunityEvents() {
  return db
    .select()
    .from(communityEvents)
    .where(eq(communityEvents.status, "PUBLISHED"))
    .orderBy(asc(communityEvents.id))
    .all();
}

export function getCreatorVideos() {
  return db
    .select()
    .from(creatorVideos)
    .where(eq(creatorVideos.status, "PUBLISHED"))
    .orderBy(desc(creatorVideos.id))
    .all();
}

function orderByIds<T extends { id: number }>(rows: T[], idsInOrder: number[]): T[] {
  const byId = new Map(rows.map((row) => [row.id, row] as const));
  return idsInOrder
    .map((id) => byId.get(id) ?? null)
    .filter((row): row is T => row !== null);
}

function selectAcademyPathItems(pathId: number): AcademyPathItemRecord[] {
  return db
    .select()
    .from(academyPathItems)
    .where(eq(academyPathItems.pathId, pathId))
    .orderBy(asc(academyPathItems.sortOrder), asc(academyPathItems.id))
    .all();
}

function resolveAcademyPathItems(items: AcademyPathItemRecord[]): AcademyPathResolvedItemRecord[] {
  const traditionIds = items.filter((item) => item.entityType === "tradition").map((item) => item.entityId);
  const personIds = items.filter((item) => item.entityType === "person").map((item) => item.entityId);
  const workIds = items.filter((item) => item.entityType === "work").map((item) => item.entityId);
  const conceptIds = items.filter((item) => item.entityType === "concept").map((item) => item.entityId);

  const traditions =
    traditionIds.length > 0
      ? db
          .select()
          .from(academyTraditions)
          .where(inArray(academyTraditions.id, traditionIds))
          .all()
      : [];
  const persons =
    personIds.length > 0
      ? db
          .select()
          .from(academyPersons)
          .where(inArray(academyPersons.id, personIds))
          .all()
      : [];
  const works =
    workIds.length > 0
      ? db
          .select()
          .from(academyWorks)
          .where(inArray(academyWorks.id, workIds))
          .all()
      : [];
  const concepts =
    conceptIds.length > 0
      ? db
          .select()
          .from(academyConcepts)
          .where(inArray(academyConcepts.id, conceptIds))
          .all()
      : [];

  const traditionsById = new Map(traditions.map((item) => [item.id, item] as const));
  const personsById = new Map(persons.map((item) => [item.id, item] as const));
  const worksById = new Map(works.map((item) => [item.id, item] as const));
  const conceptsById = new Map(concepts.map((item) => [item.id, item] as const));

  return items.map((item) => ({
    ...item,
    tradition: item.entityType === "tradition" ? (traditionsById.get(item.entityId) ?? null) : null,
    person: item.entityType === "person" ? (personsById.get(item.entityId) ?? null) : null,
    work: item.entityType === "work" ? (worksById.get(item.entityId) ?? null) : null,
    concept: item.entityType === "concept" ? (conceptsById.get(item.entityId) ?? null) : null,
  }));
}

export function getAcademyKnowledgeOverview(): {
  domainCount: number;
  traditionCount: number;
  personCount: number;
  workCount: number;
  conceptCount: number;
  relationshipCount: number;
  conceptLinkCount: number;
  pathCount: number;
} {
  const domainCount = db.select({ count: count() }).from(academyDomains).get()?.count ?? 0;
  const traditionCount = db.select({ count: count() }).from(academyTraditions).get()?.count ?? 0;
  const personCount = db.select({ count: count() }).from(academyPersons).get()?.count ?? 0;
  const workCount = db.select({ count: count() }).from(academyWorks).get()?.count ?? 0;
  const conceptCount = db.select({ count: count() }).from(academyConcepts).get()?.count ?? 0;
  const relationshipCount = db.select({ count: count() }).from(academyPersonRelationships).get()?.count ?? 0;
  const conceptTraditionCount = db.select({ count: count() }).from(academyConceptTraditions).get()?.count ?? 0;
  const conceptPersonCount = db.select({ count: count() }).from(academyConceptPersons).get()?.count ?? 0;
  const conceptWorkCount = db.select({ count: count() }).from(academyConceptWorks).get()?.count ?? 0;
  const pathCount = db.select({ count: count() }).from(academyPaths).get()?.count ?? 0;

  return {
    domainCount,
    traditionCount,
    personCount,
    workCount,
    conceptCount,
    relationshipCount,
    conceptLinkCount: conceptTraditionCount + conceptPersonCount + conceptWorkCount,
    pathCount,
  };
}

export function getAcademyDomains(options?: {
  q?: string;
  limit?: number;
}): AcademyDomainRecord[] {
  const q = options?.q?.trim() ?? "";
  const limit = clampLimit(options?.limit, 200);

  if (!q) {
    return db.select().from(academyDomains).orderBy(asc(academyDomains.name)).limit(limit).all();
  }

  const likeValue = sanitizeLikeValue(q);
  return db
    .select()
    .from(academyDomains)
    .where(
      or(
        like(academyDomains.slug, likeValue),
        like(academyDomains.name, likeValue),
        like(academyDomains.descriptionShort, likeValue),
      ),
    )
    .orderBy(asc(academyDomains.name))
    .limit(limit)
    .all();
}

export function getAcademyDomainBySlug(slug: string): AcademyDomainRecord | null {
  return (
    db.select().from(academyDomains).where(eq(academyDomains.slug, slug)).limit(1).get() ?? null
  );
}

export function getAcademyTraditions(options?: {
  q?: string;
  limit?: number;
  domainId?: number;
  domainSlug?: string;
  parentTraditionId?: number | null;
}): AcademyTraditionRecord[] {
  const q = options?.q?.trim() ?? "";
  const limit = clampLimit(options?.limit, 200);

  let domainId = options?.domainId;
  if (!domainId && options?.domainSlug) {
    const domain = getAcademyDomainBySlug(options.domainSlug);
    domainId = domain?.id;
  }

  const predicates: SQL[] = [];
  if (domainId) {
    predicates.push(eq(academyTraditions.domainId, domainId));
  }
  if (typeof options?.parentTraditionId === "number") {
    predicates.push(eq(academyTraditions.parentTraditionId, options.parentTraditionId));
  } else if (options?.parentTraditionId === null) {
    predicates.push(isNull(academyTraditions.parentTraditionId));
  }
  if (q) {
    const likeValue = sanitizeLikeValue(q);
    predicates.push(
      or(
        like(academyTraditions.slug, likeValue),
        like(academyTraditions.name, likeValue),
        like(academyTraditions.originRegion, likeValue),
        like(academyTraditions.descriptionShort, likeValue),
      )!,
    );
  }

  return db
    .select()
    .from(academyTraditions)
    .where(predicates.length > 0 ? and(...predicates) : undefined)
    .orderBy(asc(academyTraditions.name))
    .limit(limit)
    .all();
}

export function getAcademyTraditionBySlug(slug: string): AcademyTraditionRecord | null {
  return (
    db
      .select()
      .from(academyTraditions)
      .where(eq(academyTraditions.slug, slug))
      .limit(1)
      .get() ?? null
  );
}

export function getAcademyTraditionById(id: number): AcademyTraditionRecord | null {
  return (
    db
      .select()
      .from(academyTraditions)
      .where(eq(academyTraditions.id, id))
      .limit(1)
      .get() ?? null
  );
}

export function getAcademyPersons(options?: {
  q?: string;
  limit?: number;
  traditionId?: number;
  domainId?: number;
  credibilityBand?: string;
}): AcademyPersonRecord[] {
  const q = options?.q?.trim() ?? "";
  const limit = clampLimit(options?.limit, 200);

  let traditionIds: number[] | null = null;
  if (typeof options?.domainId === "number") {
    traditionIds = getAcademyTraditions({ domainId: options.domainId, limit: 500 }).map((tradition) => tradition.id);
    if (traditionIds.length === 0) {
      return [];
    }
  }

  const predicates: SQL[] = [];
  if (options?.traditionId) {
    predicates.push(eq(academyPersons.traditionId, options.traditionId));
  } else if (traditionIds && traditionIds.length > 0) {
    predicates.push(inArray(academyPersons.traditionId, traditionIds));
  }
  if (options?.credibilityBand) {
    predicates.push(eq(academyPersons.credibilityBand, options.credibilityBand));
  }
  if (q) {
    const likeValue = sanitizeLikeValue(q);
    predicates.push(
      or(
        like(academyPersons.slug, likeValue),
        like(academyPersons.displayName, likeValue),
        like(academyPersons.roleType, likeValue),
        like(academyPersons.bioShort, likeValue),
      )!,
    );
  }

  const persons = db
    .select()
    .from(academyPersons)
    .where(predicates.length > 0 ? and(...predicates) : undefined)
    .orderBy(asc(academyPersons.displayName))
    .limit(limit)
    .all();

  return persons;
}

export function getAcademyPersonBySlug(slug: string): AcademyPersonRecord | null {
  return db.select().from(academyPersons).where(eq(academyPersons.slug, slug)).limit(1).get() ?? null;
}

export function getAcademyPersonById(id: number): AcademyPersonRecord | null {
  return db.select().from(academyPersons).where(eq(academyPersons.id, id)).limit(1).get() ?? null;
}

export function getAcademyWorks(options?: {
  q?: string;
  limit?: number;
  personId?: number;
  traditionId?: number;
  isPrimaryText?: boolean;
}): AcademyWorkRecord[] {
  const q = options?.q?.trim() ?? "";
  const limit = clampLimit(options?.limit, 200);
  const predicates: SQL[] = [];

  if (typeof options?.personId === "number") {
    predicates.push(eq(academyWorks.personId, options.personId));
  }
  if (typeof options?.traditionId === "number") {
    predicates.push(eq(academyWorks.traditionId, options.traditionId));
  }
  if (typeof options?.isPrimaryText === "boolean") {
    predicates.push(eq(academyWorks.isPrimaryText, options.isPrimaryText));
  }
  if (q) {
    const likeValue = sanitizeLikeValue(q);
    predicates.push(
      or(
        like(academyWorks.slug, likeValue),
        like(academyWorks.title, likeValue),
        like(academyWorks.workType, likeValue),
        like(academyWorks.summaryShort, likeValue),
      )!,
    );
  }

  const works = db
    .select()
    .from(academyWorks)
    .where(predicates.length > 0 ? and(...predicates) : undefined)
    .orderBy(asc(academyWorks.publicationYear), asc(academyWorks.title))
    .limit(limit)
    .all();

  return works.sort(sortByWorkPriority);
}

export function getAcademyWorkBySlug(slug: string): AcademyWorkRecord | null {
  return db.select().from(academyWorks).where(eq(academyWorks.slug, slug)).limit(1).get() ?? null;
}

export function getAcademyWorkById(id: number): AcademyWorkRecord | null {
  return db.select().from(academyWorks).where(eq(academyWorks.id, id)).limit(1).get() ?? null;
}

export function getAcademyConcepts(options?: {
  q?: string;
  limit?: number;
  conceptFamily?: string;
  traditionId?: number;
  personId?: number;
  workId?: number;
}): AcademyConceptRecord[] {
  const q = options?.q?.trim() ?? "";
  const limit = clampLimit(options?.limit, 200);
  const predicates: SQL[] = [];

  if (options?.conceptFamily) {
    predicates.push(eq(academyConcepts.conceptFamily, options.conceptFamily));
  }
  if (q) {
    const likeValue = sanitizeLikeValue(q);
    predicates.push(
      or(
        like(academyConcepts.slug, likeValue),
        like(academyConcepts.name, likeValue),
        like(academyConcepts.description, likeValue),
        like(academyConcepts.conceptFamily, likeValue),
      )!,
    );
  }

  let concepts = db
    .select()
    .from(academyConcepts)
    .where(predicates.length > 0 ? and(...predicates) : undefined)
    .orderBy(asc(academyConcepts.name))
    .all();

  if (typeof options?.traditionId === "number") {
    const conceptIds = new Set(
      db
        .select({ conceptId: academyConceptTraditions.conceptId })
        .from(academyConceptTraditions)
        .where(eq(academyConceptTraditions.traditionId, options.traditionId))
        .all()
        .map((row) => row.conceptId),
    );
    concepts = concepts.filter((concept) => conceptIds.has(concept.id));
  }

  if (typeof options?.personId === "number") {
    const conceptIds = new Set(
      db
        .select({ conceptId: academyConceptPersons.conceptId })
        .from(academyConceptPersons)
        .where(eq(academyConceptPersons.personId, options.personId))
        .all()
        .map((row) => row.conceptId),
    );
    concepts = concepts.filter((concept) => conceptIds.has(concept.id));
  }

  if (typeof options?.workId === "number") {
    const conceptIds = new Set(
      db
        .select({ conceptId: academyConceptWorks.conceptId })
        .from(academyConceptWorks)
        .where(eq(academyConceptWorks.workId, options.workId))
        .all()
        .map((row) => row.conceptId),
    );
    concepts = concepts.filter((concept) => conceptIds.has(concept.id));
  }

  return concepts.slice(0, limit);
}

export function getAcademyConceptBySlug(slug: string): AcademyConceptRecord | null {
  return db.select().from(academyConcepts).where(eq(academyConcepts.slug, slug)).limit(1).get() ?? null;
}

export function getAcademyConceptById(id: number): AcademyConceptRecord | null {
  return db.select().from(academyConcepts).where(eq(academyConcepts.id, id)).limit(1).get() ?? null;
}

export function getAcademyPersonRelationships(options?: {
  personId?: number;
  relationshipType?: string;
  limit?: number;
}): AcademyPersonRelationshipRecord[] {
  const limit = clampLimit(options?.limit, 200);
  const predicates: SQL[] = [];

  if (typeof options?.personId === "number") {
    predicates.push(
      or(
        eq(academyPersonRelationships.sourcePersonId, options.personId),
        eq(academyPersonRelationships.targetPersonId, options.personId),
      )!,
    );
  }
  if (options?.relationshipType) {
    predicates.push(eq(academyPersonRelationships.relationshipType, options.relationshipType));
  }

  return db
    .select()
    .from(academyPersonRelationships)
    .where(predicates.length > 0 ? and(...predicates) : undefined)
    .orderBy(asc(academyPersonRelationships.relationshipType), asc(academyPersonRelationships.id))
    .limit(limit)
    .all();
}

export function getAcademyConceptLinksBySlug(conceptSlug: string): AcademyConceptLinksRecord | null {
  const concept = getAcademyConceptBySlug(conceptSlug);
  if (!concept) {
    return null;
  }

  const traditionLinks = db
    .select()
    .from(academyConceptTraditions)
    .where(eq(academyConceptTraditions.conceptId, concept.id))
    .orderBy(asc(academyConceptTraditions.sortOrder), asc(academyConceptTraditions.id))
    .all();
  const personLinks = db
    .select()
    .from(academyConceptPersons)
    .where(eq(academyConceptPersons.conceptId, concept.id))
    .orderBy(asc(academyConceptPersons.sortOrder), asc(academyConceptPersons.id))
    .all();
  const workLinks = db
    .select()
    .from(academyConceptWorks)
    .where(eq(academyConceptWorks.conceptId, concept.id))
    .orderBy(asc(academyConceptWorks.sortOrder), asc(academyConceptWorks.id))
    .all();

  const traditionIds = traditionLinks.map((link) => link.traditionId);
  const personIds = personLinks.map((link) => link.personId);
  const workIds = workLinks.map((link) => link.workId);

  const traditions =
    traditionIds.length > 0
      ? orderByIds(
          db
            .select()
            .from(academyTraditions)
            .where(inArray(academyTraditions.id, traditionIds))
            .all(),
          traditionIds,
        )
      : [];
  const persons =
    personIds.length > 0
      ? orderByIds(
          db
            .select()
            .from(academyPersons)
            .where(inArray(academyPersons.id, personIds))
            .all(),
          personIds,
        )
      : [];
  const works =
    workIds.length > 0
      ? orderByIds(
          db
            .select()
            .from(academyWorks)
            .where(inArray(academyWorks.id, workIds))
            .all(),
          workIds,
        )
      : [];

  return {
    concept,
    traditions,
    persons,
    works,
  };
}

export function getAcademyPaths(options?: {
  q?: string;
  featuredOnly?: boolean;
  limit?: number;
  includeItems?: boolean;
}): Array<AcademyPathRecord | AcademyPathDetailRecord> {
  const q = options?.q?.trim() ?? "";
  const limit = clampLimit(options?.limit, 80);
  const predicates: SQL[] = [];

  if (options?.featuredOnly) {
    predicates.push(eq(academyPaths.isFeatured, true));
  }
  if (q) {
    const likeValue = sanitizeLikeValue(q);
    predicates.push(
      or(
        like(academyPaths.slug, likeValue),
        like(academyPaths.title, likeValue),
        like(academyPaths.summary, likeValue),
        like(academyPaths.recommendationHint, likeValue),
      )!,
    );
  }

  const rows = db
    .select()
    .from(academyPaths)
    .where(predicates.length > 0 ? and(...predicates) : undefined)
    .orderBy(desc(academyPaths.isFeatured), asc(academyPaths.progressionOrder), desc(academyPaths.recommendationWeight))
    .limit(limit)
    .all()
    .sort(sortByPathPriority);

  if (!options?.includeItems) {
    return rows;
  }

  return rows.map((path) => {
    const items = resolveAcademyPathItems(selectAcademyPathItems(path.id));
    return {
      ...path,
      items,
    };
  });
}

export function getAcademyPathBySlug(slug: string): AcademyPathDetailRecord | null {
  const path = db.select().from(academyPaths).where(eq(academyPaths.slug, slug)).limit(1).get();
  if (!path) {
    return null;
  }

  return {
    ...path,
    items: resolveAcademyPathItems(selectAcademyPathItems(path.id)),
  };
}

export function getAcademyPathById(id: number): AcademyPathDetailRecord | null {
  const path = db.select().from(academyPaths).where(eq(academyPaths.id, id)).limit(1).get();
  if (!path) {
    return null;
  }

  return {
    ...path,
    items: resolveAcademyPathItems(selectAcademyPathItems(path.id)),
  };
}

function buildAcademySearchIndex(): AcademySearchIndexState {
  const domains = db.select().from(academyDomains).all();
  const traditions = db.select().from(academyTraditions).all();
  const persons = db.select().from(academyPersons).all();
  const works = db.select().from(academyWorks).all();
  const concepts = db.select().from(academyConcepts).all();

  const raw: AcademySearchResultRecord[] = [
    ...domains.map((domain) => ({
      type: "domain" as const,
      id: domain.id,
      slug: domain.slug,
      title: domain.name,
      subtitle: "Domain",
      summary: domain.descriptionShort ?? "Academy domain",
      score: 0,
      tags: ["domain"],
    })),
    ...traditions.map((tradition) => ({
      type: "tradition" as const,
      id: tradition.id,
      slug: tradition.slug,
      title: tradition.name,
      subtitle: tradition.originRegion ?? "Tradition",
      summary: tradition.descriptionShort ?? "Academy tradition",
      score: 0,
      tags: ["tradition"],
    })),
    ...persons.map((person) => ({
      type: "person" as const,
      id: person.id,
      slug: person.slug,
      title: person.displayName,
      subtitle: person.roleType ?? "Thinker",
      summary: person.bioShort ?? "Academy thinker",
      score: 0,
      tags: [person.credibilityBand ?? "uncategorized"],
    })),
    ...works.map((work) => ({
      type: "work" as const,
      id: work.id,
      slug: work.slug,
      title: work.title,
      subtitle: work.workType ?? "Work",
      summary: work.summaryShort ?? "Academy work",
      score: 0,
      tags: [work.isPrimaryText ? "primary" : "secondary"],
    })),
    ...concepts.map((concept) => ({
      type: "concept" as const,
      id: concept.id,
      slug: concept.slug,
      title: concept.name,
      subtitle: concept.conceptFamily ?? "Concept",
      summary: concept.description ?? "Academy concept",
      score: 0,
      tags: [concept.conceptFamily ?? "concept"],
    })),
  ];

  const records: AcademySearchIndexedRecord[] = raw.map((record) => {
    const searchableText = [record.title, record.slug, record.subtitle, record.summary, ...record.tags]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const tokens = new Set(tokenizeAcademySearchText(searchableText));

    return {
      key: academySearchResultKey(record.type, record.id),
      record,
      searchableText,
      tokens,
    };
  });

  const tokenToKeys = new Map<string, string[]>();
  for (const item of records) {
    for (const token of item.tokens) {
      const existing = tokenToKeys.get(token) ?? [];
      existing.push(item.key);
      tokenToKeys.set(token, existing);
    }
  }

  return {
    version: academyKnowledgeVersion,
    records,
    byKey: new Map(records.map((item) => [item.key, item] as const)),
    tokenToKeys,
  };
}

function getAcademySearchIndex(): AcademySearchIndexState {
  if (!academySearchIndexState || academySearchIndexState.version !== academyKnowledgeVersion) {
    academySearchIndexState = buildAcademySearchIndex();
  }

  return academySearchIndexState;
}

function scoreAcademySearchIndexedRecord(
  query: string,
  queryTokens: string[],
  indexed: AcademySearchIndexedRecord,
): number {
  const baseScore = scoreMatch(
    query,
    indexed.record.title,
    indexed.record.slug,
    indexed.record.subtitle,
    indexed.record.summary,
  );

  if (baseScore <= 0) {
    return 0;
  }

  let tokenMatches = 0;
  for (const token of queryTokens) {
    if (indexed.tokens.has(token)) {
      tokenMatches += 1;
    }
  }

  const coverageBonus =
    queryTokens.length > 0 ? Math.round((tokenMatches / queryTokens.length) * 24) : 0;
  const containsQueryBonus = indexed.searchableText.includes(query.toLowerCase()) ? 6 : 0;

  return baseScore + coverageBonus + containsQueryBonus;
}

export function searchAcademyKnowledge(query: string, limit = 40): AcademySearchResultRecord[] {
  const normalizedQuery = normalizeLikeQuery(query);
  if (!normalizedQuery) {
    return [];
  }

  const limited = clampLimit(limit, 40, 120);
  const cacheKey = academySearchCacheKey(normalizedQuery, limited);
  const cached = academySearchCache.get(cacheKey);

  if (cached && cached.version === academyKnowledgeVersion && cached.expiresAt > Date.now()) {
    return cached.results.slice(0, limited);
  }

  const queryTokens = tokenizeAcademySearchText(normalizedQuery);
  const index = getAcademySearchIndex();

  const typeOrder: Record<AcademySearchResultRecord["type"], number> = {
    tradition: 1,
    person: 2,
    work: 3,
    concept: 4,
    domain: 5,
  };

  let candidates: AcademySearchIndexedRecord[] = [];

  if (queryTokens.length === 0) {
    candidates = index.records.slice(0, ACADEMY_SEARCH_MAX_CANDIDATES);
  } else {
    const candidateKeys = new Set<string>();
    for (const token of queryTokens) {
      const keys = index.tokenToKeys.get(token) ?? [];
      for (const key of keys) {
        candidateKeys.add(key);
        if (candidateKeys.size >= ACADEMY_SEARCH_MAX_CANDIDATES) {
          break;
        }
      }
      if (candidateKeys.size >= ACADEMY_SEARCH_MAX_CANDIDATES) {
        break;
      }
    }

    if (candidateKeys.size === 0) {
      candidates = index.records.slice(0, ACADEMY_SEARCH_MAX_CANDIDATES);
    } else {
      candidates = [...candidateKeys]
        .map((key) => index.byKey.get(key) ?? null)
        .filter((item): item is AcademySearchIndexedRecord => item !== null);
    }
  }

  const ranked = candidates
    .map((item) => {
      const score = scoreAcademySearchIndexedRecord(normalizedQuery, queryTokens, item);
      if (score <= 0) {
        return null;
      }

      return {
        ...item.record,
        score,
      };
    })
    .filter((result): result is AcademySearchResultRecord => result !== null)
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      const aTypeOrder = typeOrder[a.type] ?? 99;
      const bTypeOrder = typeOrder[b.type] ?? 99;
      if (aTypeOrder !== bTypeOrder) {
        return aTypeOrder - bTypeOrder;
      }

      return a.title.localeCompare(b.title);
    })
    .slice(0, limited);

  academySearchCache.set(cacheKey, {
    version: academyKnowledgeVersion,
    expiresAt: Date.now() + ACADEMY_SEARCH_CACHE_TTL_MS,
    results: ranked,
  });

  return ranked;
}

export function queryAcademyKnowledge(input: AcademyKnowledgeQueryInput = {}): AcademyKnowledgeQueryResult {
  const entity = input.entity ?? "all";
  const q = input.q?.trim() ?? "";
  const limit = clampLimit(input.limit, 40, 120);

  const domainQuery = entity === "all" || entity === "domains";
  const traditionQuery = entity === "all" || entity === "traditions";
  const personQuery = entity === "all" || entity === "persons";
  const workQuery = entity === "all" || entity === "works";
  const conceptQuery = entity === "all" || entity === "concepts";
  const pathQuery = entity === "all" || entity === "paths";

  let domains = domainQuery ? getAcademyDomains({ q, limit }) : [];
  let traditions = traditionQuery
    ? getAcademyTraditions({
        q,
        limit,
        domainId: input.domainId,
      })
    : [];
  let persons = personQuery
    ? getAcademyPersons({
        q,
        limit,
        traditionId: input.traditionId,
        domainId: input.domainId,
      })
    : [];
  let works = workQuery
    ? getAcademyWorks({
        q,
        limit,
        personId: input.personId,
        traditionId: input.traditionId,
      })
    : [];
  let concepts = conceptQuery
    ? getAcademyConcepts({
        q,
        limit,
        traditionId: input.traditionId,
        personId: input.personId,
      })
    : [];
  let paths = pathQuery
    ? (getAcademyPaths({
        q,
        limit,
        includeItems: true,
      }) as AcademyPathDetailRecord[])
    : [];

  if (input.slug) {
    const slug = input.slug.trim();
    if (domainQuery) {
      domains = domains.filter((item) => item.slug === slug);
    }
    if (traditionQuery) {
      traditions = traditions.filter((item) => item.slug === slug);
    }
    if (personQuery) {
      persons = persons.filter((item) => item.slug === slug);
    }
    if (workQuery) {
      works = works.filter((item) => item.slug === slug);
    }
    if (conceptQuery) {
      concepts = concepts.filter((item) => item.slug === slug);
    }
    if (pathQuery) {
      paths = paths.filter((item) => item.slug === slug);
    }
  }

  if (typeof input.conceptId === "number" && conceptQuery) {
    concepts = concepts.filter((item) => item.id === input.conceptId);
  }

  if (typeof input.pathId === "number" && pathQuery) {
    paths = paths.filter((item) => item.id === input.pathId);
  }

  const conceptLinks: AcademyConceptLinksRecord[] = [];
  if (input.includeRelations && concepts.length > 0) {
    for (const concept of concepts) {
      const links = getAcademyConceptLinksBySlug(concept.slug);
      if (links) {
        conceptLinks.push(links);
      }
    }
  }

  return {
    entity,
    q,
    domains,
    traditions,
    persons,
    works,
    concepts,
    paths,
    conceptLinks,
  };
}

export function getAcademyCurationSnapshot(options?: { limit?: number }): AcademyCurationSnapshotRecord {
  const limit = clampLimit(options?.limit, 300, 1000);

  return {
    domains: db.select().from(academyDomains).orderBy(asc(academyDomains.name)).limit(limit).all(),
    traditions: db
      .select()
      .from(academyTraditions)
      .orderBy(asc(academyTraditions.name))
      .limit(limit)
      .all(),
    persons: db
      .select()
      .from(academyPersons)
      .orderBy(asc(academyPersons.displayName))
      .limit(limit)
      .all(),
    works: db.select().from(academyWorks).orderBy(asc(academyWorks.title)).limit(limit).all(),
    concepts: db.select().from(academyConcepts).orderBy(asc(academyConcepts.name)).limit(limit).all(),
    paths: getAcademyPaths({
      includeItems: true,
      limit,
    }) as AcademyPathDetailRecord[],
    personRelationships: db
      .select()
      .from(academyPersonRelationships)
      .orderBy(asc(academyPersonRelationships.relationshipType), asc(academyPersonRelationships.id))
      .limit(limit)
      .all(),
    conceptTraditionLinks: db
      .select()
      .from(academyConceptTraditions)
      .orderBy(asc(academyConceptTraditions.conceptId), asc(academyConceptTraditions.sortOrder))
      .limit(limit)
      .all(),
    conceptPersonLinks: db
      .select()
      .from(academyConceptPersons)
      .orderBy(asc(academyConceptPersons.conceptId), asc(academyConceptPersons.sortOrder))
      .limit(limit)
      .all(),
    conceptWorkLinks: db
      .select()
      .from(academyConceptWorks)
      .orderBy(asc(academyConceptWorks.conceptId), asc(academyConceptWorks.sortOrder))
      .limit(limit)
      .all(),
  };
}

export function updateAcademyPathCuration(
  pathId: number,
  input: AcademyPathCurationPatchInput,
): AcademyPathDetailRecord | null {
  const existing = getAcademyPathById(pathId);
  if (!existing) {
    return null;
  }

  const now = nowIso();
  const patch: Partial<{
    title: string;
    summary: string;
    tone: AcademyPathTone;
    difficultyLevel: AcademyPathDifficulty;
    progressionOrder: number;
    recommendationWeight: number;
    recommendationHint: string;
    isFeatured: boolean;
    updatedAt: string;
  }> = {
    updatedAt: now,
  };

  if (typeof input.title === "string") {
    patch.title = input.title.trim();
  }
  if (typeof input.summary === "string") {
    patch.summary = input.summary.trim();
  }
  if (input.tone) {
    patch.tone = input.tone;
  }
  if (input.difficultyLevel) {
    patch.difficultyLevel = input.difficultyLevel;
  }
  if (typeof input.progressionOrder === "number" && Number.isFinite(input.progressionOrder)) {
    patch.progressionOrder = Math.trunc(input.progressionOrder);
  }
  if (typeof input.recommendationWeight === "number" && Number.isFinite(input.recommendationWeight)) {
    patch.recommendationWeight = Math.trunc(input.recommendationWeight);
  }
  if (typeof input.recommendationHint === "string") {
    patch.recommendationHint = input.recommendationHint.trim();
  }
  if (typeof input.isFeatured === "boolean") {
    patch.isFeatured = input.isFeatured;
  }

  db.update(academyPaths).set(patch).where(eq(academyPaths.id, pathId)).run();
  invalidateAcademySearchState();
  return getAcademyPathById(pathId);
}

export function replaceAcademyPathItems(
  pathId: number,
  items: AcademyPathItemCurationInput[],
): AcademyPathDetailRecord | null {
  const existing = getAcademyPathById(pathId);
  if (!existing) {
    return null;
  }

  const timestamp = nowIso();
  const normalizedItems = items
    .map((item, index) => ({
      pathId,
      entityType: item.entityType,
      entityId: item.entityId,
      sortOrder:
        typeof item.sortOrder === "number" && Number.isFinite(item.sortOrder)
          ? Math.trunc(item.sortOrder)
          : index,
      rationale: item.rationale?.trim() ?? "",
      createdAt: timestamp,
      updatedAt: timestamp,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({
      ...item,
      sortOrder: index,
    }));

  db.transaction(() => {
    db.delete(academyPathItems).where(eq(academyPathItems.pathId, pathId)).run();

    if (normalizedItems.length > 0) {
      db.insert(academyPathItems).values(normalizedItems).run();
    }

    db.update(academyPaths)
      .set({
        updatedAt: timestamp,
      })
      .where(eq(academyPaths.id, pathId))
      .run();
  });

  invalidateAcademySearchState();
  return getAcademyPathById(pathId);
}

export function updateAcademyPersonEditorialMetadata(
  personId: number,
  input: AcademyPersonEditorialPatchInput,
): AcademyPersonRecord | null {
  const existing = getAcademyPersonById(personId);
  if (!existing) {
    return null;
  }

  const patch: Partial<{
    credibilityBand: string | null;
    evidenceProfile: string | null;
    claimRiskLevel: string | null;
    bioShort: string | null;
    updatedAt: string;
  }> = {
    updatedAt: nowIso(),
  };

  if (input.credibilityBand !== undefined) {
    patch.credibilityBand = toNullableString(input.credibilityBand);
  }
  if (input.evidenceProfile !== undefined) {
    patch.evidenceProfile = toNullableString(input.evidenceProfile);
  }
  if (input.claimRiskLevel !== undefined) {
    patch.claimRiskLevel = toNullableString(input.claimRiskLevel);
  }
  if (input.bioShort !== undefined) {
    patch.bioShort = toNullableString(input.bioShort);
  }

  db.update(academyPersons).set(patch).where(eq(academyPersons.id, personId)).run();
  invalidateAcademySearchState();
  return getAcademyPersonById(personId);
}

function nextAcademyPersonRelationshipId(): number {
  const latest = db
    .select({ id: academyPersonRelationships.id })
    .from(academyPersonRelationships)
    .orderBy(desc(academyPersonRelationships.id))
    .limit(1)
    .get();

  return (latest?.id ?? 0) + 1;
}

export function upsertAcademyPersonRelationship(
  input: AcademyPersonRelationshipUpsertInput,
): AcademyPersonRelationshipRecord | null {
  const now = nowIso();
  const notes = toNullableString(input.notes);
  const normalizedType = normalizeLikeQuery(input.relationshipType);

  if (!normalizedType) {
    return null;
  }

  const existingById =
    typeof input.id === "number"
      ? (db
          .select()
          .from(academyPersonRelationships)
          .where(eq(academyPersonRelationships.id, input.id))
          .limit(1)
          .get() ?? null)
      : null;

  if (existingById) {
    db.update(academyPersonRelationships)
      .set({
        sourcePersonId: input.sourcePersonId,
        targetPersonId: input.targetPersonId,
        relationshipType: normalizedType,
        notes,
        updatedAt: now,
      })
      .where(eq(academyPersonRelationships.id, existingById.id))
      .run();

    invalidateAcademySearchState();

    return (
      db
        .select()
        .from(academyPersonRelationships)
        .where(eq(academyPersonRelationships.id, existingById.id))
        .limit(1)
        .get() ?? null
    );
  }

  const existingByNaturalKey =
    db
      .select()
      .from(academyPersonRelationships)
      .where(
        and(
          eq(academyPersonRelationships.sourcePersonId, input.sourcePersonId),
          eq(academyPersonRelationships.targetPersonId, input.targetPersonId),
          eq(academyPersonRelationships.relationshipType, normalizedType),
        ),
      )
      .limit(1)
      .get() ?? null;

  if (existingByNaturalKey) {
    db.update(academyPersonRelationships)
      .set({
        notes,
        updatedAt: now,
      })
      .where(eq(academyPersonRelationships.id, existingByNaturalKey.id))
      .run();

    invalidateAcademySearchState();
    return (
      db
        .select()
        .from(academyPersonRelationships)
        .where(eq(academyPersonRelationships.id, existingByNaturalKey.id))
        .limit(1)
        .get() ?? null
    );
  }

  const id = typeof input.id === "number" ? input.id : nextAcademyPersonRelationshipId();
  db.insert(academyPersonRelationships)
    .values({
      id,
      sourcePersonId: input.sourcePersonId,
      targetPersonId: input.targetPersonId,
      relationshipType: normalizedType,
      notes,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  invalidateAcademySearchState();

  return (
    db
      .select()
      .from(academyPersonRelationships)
      .where(eq(academyPersonRelationships.id, id))
      .limit(1)
      .get() ?? null
  );
}

export function deleteAcademyPersonRelationshipById(id: number): boolean {
  const existing =
    db
      .select({ id: academyPersonRelationships.id })
      .from(academyPersonRelationships)
      .where(eq(academyPersonRelationships.id, id))
      .limit(1)
      .get() ?? null;

  if (!existing) {
    return false;
  }

  db.delete(academyPersonRelationships).where(eq(academyPersonRelationships.id, id)).run();
  invalidateAcademySearchState();
  return true;
}

export function upsertAcademyConceptRelation(input: AcademyConceptRelationUpsertInput): void {
  const sortOrder =
    typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder) ? Math.trunc(input.sortOrder) : 0;
  const timestamp = nowIso();

  switch (input.entityType) {
    case "tradition":
      db.insert(academyConceptTraditions)
        .values({
          conceptId: input.conceptId,
          traditionId: input.entityId,
          sortOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .onConflictDoUpdate({
          target: [academyConceptTraditions.conceptId, academyConceptTraditions.traditionId],
          set: {
            sortOrder,
            updatedAt: timestamp,
          },
        })
        .run();
      break;
    case "person":
      db.insert(academyConceptPersons)
        .values({
          conceptId: input.conceptId,
          personId: input.entityId,
          sortOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .onConflictDoUpdate({
          target: [academyConceptPersons.conceptId, academyConceptPersons.personId],
          set: {
            sortOrder,
            updatedAt: timestamp,
          },
        })
        .run();
      break;
    case "work":
      db.insert(academyConceptWorks)
        .values({
          conceptId: input.conceptId,
          workId: input.entityId,
          sortOrder,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .onConflictDoUpdate({
          target: [academyConceptWorks.conceptId, academyConceptWorks.workId],
          set: {
            sortOrder,
            updatedAt: timestamp,
          },
        })
        .run();
      break;
  }

  invalidateAcademySearchState();
}

export function deleteAcademyConceptRelation(input: {
  conceptId: number;
  entityType: AcademyConceptRelationEntityType;
  entityId: number;
}): boolean {
  if (input.entityType === "tradition") {
    const existing =
      db
        .select({ id: academyConceptTraditions.id })
        .from(academyConceptTraditions)
        .where(
          and(
            eq(academyConceptTraditions.conceptId, input.conceptId),
            eq(academyConceptTraditions.traditionId, input.entityId),
          ),
        )
        .limit(1)
        .get() ?? null;

    if (!existing) {
      return false;
    }

    db.delete(academyConceptTraditions)
      .where(
        and(
          eq(academyConceptTraditions.conceptId, input.conceptId),
          eq(academyConceptTraditions.traditionId, input.entityId),
        ),
      )
      .run();
    invalidateAcademySearchState();
    return true;
  }

  if (input.entityType === "person") {
    const existing =
      db
        .select({ id: academyConceptPersons.id })
        .from(academyConceptPersons)
        .where(
          and(
            eq(academyConceptPersons.conceptId, input.conceptId),
            eq(academyConceptPersons.personId, input.entityId),
          ),
        )
        .limit(1)
        .get() ?? null;

    if (!existing) {
      return false;
    }

    db.delete(academyConceptPersons)
      .where(
        and(
          eq(academyConceptPersons.conceptId, input.conceptId),
          eq(academyConceptPersons.personId, input.entityId),
        ),
      )
      .run();
    invalidateAcademySearchState();
    return true;
  }

  const existing =
    db
      .select({ id: academyConceptWorks.id })
      .from(academyConceptWorks)
      .where(
        and(
          eq(academyConceptWorks.conceptId, input.conceptId),
          eq(academyConceptWorks.workId, input.entityId),
        ),
      )
      .limit(1)
      .get() ?? null;

  if (!existing) {
    return false;
  }

  db.delete(academyConceptWorks)
    .where(
      and(
        eq(academyConceptWorks.conceptId, input.conceptId),
        eq(academyConceptWorks.workId, input.entityId),
      ),
    )
    .run();
  invalidateAcademySearchState();
  return true;
}

export function listAllContentAdmin() {
  return {
    pillars: db.select().from(contentPillars).orderBy(asc(contentPillars.id)).all(),
    highlights: db.select().from(contentHighlights).orderBy(asc(contentHighlights.id)).all(),
    lessons: db.select().from(libraryLessons).orderBy(desc(libraryLessons.id)).all(),
    practices: db.select().from(practiceRoutines).orderBy(asc(practiceRoutines.id)).all(),
    community: db.select().from(communityCircles).orderBy(asc(communityCircles.id)).all(),
    challenges: db.select().from(communityChallenges).orderBy(asc(communityChallenges.id)).all(),
    resources: db.select().from(communityResources).orderBy(asc(communityResources.id)).all(),
    experts: db.select().from(communityExperts).orderBy(asc(communityExperts.id)).all(),
    events: db.select().from(communityEvents).orderBy(asc(communityEvents.id)).all(),
    videos: db.select().from(creatorVideos).orderBy(desc(creatorVideos.id)).all(),
  };
}

export function createLesson(input: {
  slug: string;
  title: string;
  tradition: string;
  level: string;
  minutes: number;
  summary: string;
  content: string;
  status: ContentStatus;
}) {
  const timestamp = nowIso();

  db.insert(libraryLessons)
    .values({
      slug: input.slug,
      title: input.title,
      tradition: input.tradition,
      level: input.level,
      minutes: input.minutes,
      summary: input.summary,
      content: input.content,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function updateLesson(
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
) {
  db.update(libraryLessons)
    .set({
      slug: input.slug,
      title: input.title,
      tradition: input.tradition,
      level: input.level,
      minutes: input.minutes,
      summary: input.summary,
      content: input.content,
      status: input.status,
      updatedAt: nowIso(),
    })
    .where(eq(libraryLessons.id, id))
    .run();
}

export function deleteLesson(id: number) {
  db.delete(libraryLessons).where(eq(libraryLessons.id, id)).run();
}

export function setLessonStatus(id: number, status: ContentStatus) {
  db.update(libraryLessons)
    .set({
      status,
      updatedAt: nowIso(),
    })
    .where(eq(libraryLessons.id, id))
    .run();
}

export function createPractice(input: {
  slug: string;
  title: string;
  description: string;
  cadence: string;
  protocol: string;
  status: ContentStatus;
}) {
  const timestamp = nowIso();

  db.insert(practiceRoutines)
    .values({
      slug: input.slug,
      title: input.title,
      description: input.description,
      cadence: input.cadence,
      protocol: input.protocol,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function updatePractice(
  id: number,
  input: {
    slug: string;
    title: string;
    description: string;
    cadence: string;
    protocol: string;
    status: ContentStatus;
  },
) {
  db.update(practiceRoutines)
    .set({
      slug: input.slug,
      title: input.title,
      description: input.description,
      cadence: input.cadence,
      protocol: input.protocol,
      status: input.status,
      updatedAt: nowIso(),
    })
    .where(eq(practiceRoutines.id, id))
    .run();
}

export function deletePractice(id: number) {
  db.delete(practiceRoutines).where(eq(practiceRoutines.id, id)).run();
}

export function setPracticeStatus(id: number, status: ContentStatus) {
  db.update(practiceRoutines)
    .set({
      status,
      updatedAt: nowIso(),
    })
    .where(eq(practiceRoutines.id, id))
    .run();
}

export function createCommunity(input: {
  slug: string;
  name: string;
  focus: string;
  schedule: string;
  status: ContentStatus;
}) {
  const timestamp = nowIso();

  db.insert(communityCircles)
    .values({
      slug: input.slug,
      name: input.name,
      focus: input.focus,
      schedule: input.schedule,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function updateCommunity(
  id: number,
  input: {
    slug: string;
    name: string;
    focus: string;
    schedule: string;
    status: ContentStatus;
  },
) {
  db.update(communityCircles)
    .set({
      slug: input.slug,
      name: input.name,
      focus: input.focus,
      schedule: input.schedule,
      status: input.status,
      updatedAt: nowIso(),
    })
    .where(eq(communityCircles.id, id))
    .run();
}

export function deleteCommunity(id: number) {
  db.delete(communityCircles).where(eq(communityCircles.id, id)).run();
}

export function setCommunityStatus(id: number, status: ContentStatus) {
  db.update(communityCircles)
    .set({
      status,
      updatedAt: nowIso(),
    })
    .where(eq(communityCircles.id, id))
    .run();
}

export function createPillar(input: {
  slug: string;
  title: string;
  description: string;
  status: ContentStatus;
}) {
  const timestamp = nowIso();

  db.insert(contentPillars)
    .values({
      slug: input.slug,
      title: input.title,
      description: input.description,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function updatePillar(
  id: number,
  input: {
    slug: string;
    title: string;
    description: string;
    status: ContentStatus;
  },
) {
  db.update(contentPillars)
    .set({
      slug: input.slug,
      title: input.title,
      description: input.description,
      status: input.status,
      updatedAt: nowIso(),
    })
    .where(eq(contentPillars.id, id))
    .run();
}

export function deletePillar(id: number) {
  db.delete(contentPillars).where(eq(contentPillars.id, id)).run();
}

export function setPillarStatus(id: number, status: ContentStatus) {
  db.update(contentPillars)
    .set({
      status,
      updatedAt: nowIso(),
    })
    .where(eq(contentPillars.id, id))
    .run();
}

export function createHighlight(input: {
  slug: string;
  description: string;
  status: ContentStatus;
}) {
  const timestamp = nowIso();

  db.insert(contentHighlights)
    .values({
      slug: input.slug,
      description: input.description,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function updateHighlight(
  id: number,
  input: {
    slug: string;
    description: string;
    status: ContentStatus;
  },
) {
  db.update(contentHighlights)
    .set({
      slug: input.slug,
      description: input.description,
      status: input.status,
      updatedAt: nowIso(),
    })
    .where(eq(contentHighlights.id, id))
    .run();
}

export function deleteHighlight(id: number) {
  db.delete(contentHighlights).where(eq(contentHighlights.id, id)).run();
}

export function setHighlightStatus(id: number, status: ContentStatus) {
  db.update(contentHighlights)
    .set({
      status,
      updatedAt: nowIso(),
    })
    .where(eq(contentHighlights.id, id))
    .run();
}

export function createCommunityChallenge(input: {
  slug: string;
  title: string;
  duration: string;
  summary: string;
  status: ContentStatus;
}) {
  const timestamp = nowIso();

  db.insert(communityChallenges)
    .values({
      slug: input.slug,
      title: input.title,
      duration: input.duration,
      summary: input.summary,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function updateCommunityChallenge(
  id: number,
  input: {
    slug: string;
    title: string;
    duration: string;
    summary: string;
    status: ContentStatus;
  },
) {
  db.update(communityChallenges)
    .set({
      slug: input.slug,
      title: input.title,
      duration: input.duration,
      summary: input.summary,
      status: input.status,
      updatedAt: nowIso(),
    })
    .where(eq(communityChallenges.id, id))
    .run();
}

export function deleteCommunityChallenge(id: number) {
  db.delete(communityChallenges).where(eq(communityChallenges.id, id)).run();
}

export function setCommunityChallengeStatus(id: number, status: ContentStatus) {
  db.update(communityChallenges)
    .set({
      status,
      updatedAt: nowIso(),
    })
    .where(eq(communityChallenges.id, id))
    .run();
}

export function createCommunityResource(input: {
  slug: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  status: ContentStatus;
}) {
  const timestamp = nowIso();

  db.insert(communityResources)
    .values({
      slug: input.slug,
      title: input.title,
      description: input.description,
      href: input.href,
      cta: input.cta,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function updateCommunityResource(
  id: number,
  input: {
    slug: string;
    title: string;
    description: string;
    href: string;
    cta: string;
    status: ContentStatus;
  },
) {
  db.update(communityResources)
    .set({
      slug: input.slug,
      title: input.title,
      description: input.description,
      href: input.href,
      cta: input.cta,
      status: input.status,
      updatedAt: nowIso(),
    })
    .where(eq(communityResources.id, id))
    .run();
}

export function deleteCommunityResource(id: number) {
  db.delete(communityResources).where(eq(communityResources.id, id)).run();
}

export function setCommunityResourceStatus(id: number, status: ContentStatus) {
  db.update(communityResources)
    .set({
      status,
      updatedAt: nowIso(),
    })
    .where(eq(communityResources.id, id))
    .run();
}

export function createCommunityExpert(input: {
  slug: string;
  name: string;
  focus: string;
  status: ContentStatus;
}) {
  const timestamp = nowIso();

  db.insert(communityExperts)
    .values({
      slug: input.slug,
      name: input.name,
      focus: input.focus,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function updateCommunityExpert(
  id: number,
  input: {
    slug: string;
    name: string;
    focus: string;
    status: ContentStatus;
  },
) {
  db.update(communityExperts)
    .set({
      slug: input.slug,
      name: input.name,
      focus: input.focus,
      status: input.status,
      updatedAt: nowIso(),
    })
    .where(eq(communityExperts.id, id))
    .run();
}

export function deleteCommunityExpert(id: number) {
  db.delete(communityExperts).where(eq(communityExperts.id, id)).run();
}

export function setCommunityExpertStatus(id: number, status: ContentStatus) {
  db.update(communityExperts)
    .set({
      status,
      updatedAt: nowIso(),
    })
    .where(eq(communityExperts.id, id))
    .run();
}

export function createCommunityEvent(input: {
  slug: string;
  title: string;
  schedule: string;
  summary: string;
  status: ContentStatus;
}) {
  const timestamp = nowIso();

  db.insert(communityEvents)
    .values({
      slug: input.slug,
      title: input.title,
      schedule: input.schedule,
      summary: input.summary,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function updateCommunityEvent(
  id: number,
  input: {
    slug: string;
    title: string;
    schedule: string;
    summary: string;
    status: ContentStatus;
  },
) {
  db.update(communityEvents)
    .set({
      slug: input.slug,
      title: input.title,
      schedule: input.schedule,
      summary: input.summary,
      status: input.status,
      updatedAt: nowIso(),
    })
    .where(eq(communityEvents.id, id))
    .run();
}

export function deleteCommunityEvent(id: number) {
  db.delete(communityEvents).where(eq(communityEvents.id, id)).run();
}

export function setCommunityEventStatus(id: number, status: ContentStatus) {
  db.update(communityEvents)
    .set({
      status,
      updatedAt: nowIso(),
    })
    .where(eq(communityEvents.id, id))
    .run();
}

export function createCreatorVideo(input: {
  slug: string;
  title: string;
  format: string;
  summary: string;
  videoUrl: string;
  status: ContentStatus;
}) {
  const timestamp = nowIso();

  db.insert(creatorVideos)
    .values({
      slug: input.slug,
      title: input.title,
      format: input.format,
      summary: input.summary,
      videoUrl: input.videoUrl,
      status: input.status,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();
}

export function updateCreatorVideo(
  id: number,
  input: {
    slug: string;
    title: string;
    format: string;
    summary: string;
    videoUrl: string;
    status: ContentStatus;
  },
) {
  db.update(creatorVideos)
    .set({
      slug: input.slug,
      title: input.title,
      format: input.format,
      summary: input.summary,
      videoUrl: input.videoUrl,
      status: input.status,
      updatedAt: nowIso(),
    })
    .where(eq(creatorVideos.id, id))
    .run();
}

export function deleteCreatorVideo(id: number) {
  db.delete(creatorVideos).where(eq(creatorVideos.id, id)).run();
}

export function setCreatorVideoStatus(id: number, status: ContentStatus) {
  db.update(creatorVideos)
    .set({
      status,
      updatedAt: nowIso(),
    })
    .where(eq(creatorVideos.id, id))
    .run();
}

export function createNotification(input: {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
}): void {
  db.insert(userNotifications)
    .values({
      id: input.id,
      userId: input.userId,
      title: input.title,
      body: input.body,
      href: input.href,
      readAt: null,
      createdAt: nowIso(),
    })
    .run();
}

export function createNotificationIfRecentDuplicateAbsent(input: {
  id: string;
  userId: string;
  title: string;
  body: string;
  href: string;
  dedupeWithinHours?: number;
}): boolean {
  const dedupeHours = Math.max(1, Math.min(input.dedupeWithinHours ?? 24, 24 * 30));
  const threshold = new Date(Date.now() - dedupeHours * 60 * 60 * 1000).toISOString();
  const recentDuplicate = db
    .select({ id: userNotifications.id })
    .from(userNotifications)
    .where(
      and(
        eq(userNotifications.userId, input.userId),
        eq(userNotifications.title, input.title),
        eq(userNotifications.href, input.href),
        gt(userNotifications.createdAt, threshold),
      ),
    )
    .limit(1)
    .get();

  if (recentDuplicate) {
    return false;
  }

  db.insert(userNotifications)
    .values({
      id: input.id,
      userId: input.userId,
      title: input.title,
      body: input.body,
      href: input.href,
      readAt: null,
      createdAt: nowIso(),
    })
    .run();

  return true;
}

export function listNotificationsByUser(userId: string, limit: number): {
  items: NotificationRecord[];
  unreadCount: number;
} {
  const items = db
    .select()
    .from(userNotifications)
    .where(eq(userNotifications.userId, userId))
    .orderBy(desc(userNotifications.createdAt))
    .limit(limit)
    .all();

  const unread = db
    .select({ count: count() })
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), isNull(userNotifications.readAt)))
    .get();

  return {
    items,
    unreadCount: unread?.count ?? 0,
  };
}

export function markNotificationRead(userId: string, notificationId: string): boolean {
  const existing = db
    .select({ id: userNotifications.id, readAt: userNotifications.readAt })
    .from(userNotifications)
    .where(and(eq(userNotifications.userId, userId), eq(userNotifications.id, notificationId)))
    .limit(1)
    .get();

  if (!existing) {
    return false;
  }

  if (!existing.readAt) {
    db.update(userNotifications)
      .set({ readAt: nowIso() })
      .where(eq(userNotifications.id, notificationId))
      .run();
  }

  return true;
}

export function markAllNotificationsRead(userId: string): number {
  const updated = db
    .update(userNotifications)
    .set({ readAt: nowIso() })
    .where(and(eq(userNotifications.userId, userId), isNull(userNotifications.readAt)))
    .run();

  return updated.changes ?? 0;
}

export function getSessionDeviceByTokenHash(tokenHash: string): {
  sessionId: string;
  deviceId: string | null;
} | null {
  const row = db
    .select({
      sessionId: sessions.id,
      deviceId: sessions.deviceId,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, nowIso()), isNull(users.deletedAt)))
    .limit(1)
    .get();

  return row ?? null;
}

export function upsertUserDevice(input: {
  id: string;
  userId: string;
  fingerprint: string;
  label: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}): string {
  const existing = db
    .select({ id: userDevices.id })
    .from(userDevices)
    .where(
      and(
        eq(userDevices.userId, input.userId),
        eq(userDevices.fingerprint, input.fingerprint),
        isNull(userDevices.revokedAt),
      ),
    )
    .limit(1)
    .get();

  if (existing) {
    db.update(userDevices)
      .set({
        label: input.label,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        lastSeenAt: nowIso(),
        updatedAt: nowIso(),
      })
      .where(eq(userDevices.id, existing.id))
      .run();
    return existing.id;
  }

  const timestamp = nowIso();
  db.insert(userDevices)
    .values({
      id: input.id,
      userId: input.userId,
      fingerprint: input.fingerprint,
      label: input.label,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
      revokedAt: null,
      lastSeenAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  return input.id;
}

export function listUserDevicesByUserId(userId: string): UserDeviceRecord[] {
  return db
    .select({
      id: userDevices.id,
      userId: userDevices.userId,
      label: userDevices.label,
      ipAddress: userDevices.ipAddress,
      userAgent: userDevices.userAgent,
      lastSeenAt: userDevices.lastSeenAt,
      revokedAt: userDevices.revokedAt,
      createdAt: userDevices.createdAt,
      updatedAt: userDevices.updatedAt,
    })
    .from(userDevices)
    .where(eq(userDevices.userId, userId))
    .orderBy(desc(userDevices.lastSeenAt))
    .all();
}

export function revokeUserDevice(userId: string, deviceId: string): boolean {
  const existing = db
    .select({ id: userDevices.id, revokedAt: userDevices.revokedAt })
    .from(userDevices)
    .where(and(eq(userDevices.userId, userId), eq(userDevices.id, deviceId)))
    .limit(1)
    .get();

  if (!existing) {
    return false;
  }

  const timestamp = nowIso();
  db.transaction(() => {
    db.update(userDevices)
      .set({
        revokedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(userDevices.id, deviceId))
      .run();

    db.delete(sessions).where(eq(sessions.deviceId, deviceId)).run();
    db.delete(refreshSessions).where(eq(refreshSessions.deviceId, deviceId)).run();
  });

  return true;
}

function normalizeChatMessagePreview(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, 180);
}

function listChatThreadBranchesByThreadIds(
  userId: string,
  threadIds: string[],
): Record<string, ChatThreadBranchRecord> {
  if (threadIds.length === 0) {
    return {};
  }

  const branchRows = db
    .select({
      id: chatThreadBranches.id,
      threadId: chatThreadBranches.threadId,
      sourceThreadId: chatThreadBranches.sourceThreadId,
      sourceMessageId: chatThreadBranches.sourceMessageId,
      createdAt: chatThreadBranches.createdAt,
    })
    .from(chatThreadBranches)
    .where(inArray(chatThreadBranches.threadId, threadIds))
    .all();

  if (branchRows.length === 0) {
    return {};
  }

  const sourceThreadIds = Array.from(new Set(branchRows.map((row) => row.sourceThreadId)));
  const sourceMessageIds = Array.from(new Set(branchRows.map((row) => row.sourceMessageId)));

  const sourceThreads = db
    .select({
      id: chatThreads.id,
      userId: chatThreads.userId,
      title: chatThreads.title,
    })
    .from(chatThreads)
    .where(inArray(chatThreads.id, sourceThreadIds))
    .all()
    .filter((row) => row.userId === userId);
  const sourceThreadById = new Map(sourceThreads.map((row) => [row.id, row]));

  const sourceMessages = db
    .select({
      id: chatMessages.id,
      threadId: chatMessages.threadId,
      content: chatMessages.content,
    })
    .from(chatMessages)
    .where(inArray(chatMessages.id, sourceMessageIds))
    .all();
  const sourceMessageById = new Map(sourceMessages.map((row) => [row.id, row]));

  const resolved: Record<string, ChatThreadBranchRecord> = {};

  for (const row of branchRows) {
    const sourceThread = sourceThreadById.get(row.sourceThreadId);
    const sourceMessage = sourceMessageById.get(row.sourceMessageId);

    if (!sourceThread || !sourceMessage || sourceMessage.threadId !== row.sourceThreadId) {
      continue;
    }

    resolved[row.threadId] = {
      id: row.id,
      threadId: row.threadId,
      sourceThreadId: row.sourceThreadId,
      sourceThreadTitle: sourceThread.title,
      sourceMessageId: row.sourceMessageId,
      sourceMessagePreview: normalizeChatMessagePreview(sourceMessage.content),
      createdAt: row.createdAt,
    };
  }

  return resolved;
}

export function listChatThreadsByUser(
  userId: string,
  scope: ChatThreadScope = "active",
): ChatThreadRecord[] {
  const scopeFilter =
    scope === "all"
      ? eq(chatThreads.userId, userId)
      : and(
          eq(chatThreads.userId, userId),
          eq(chatThreads.archived, scope === "archived"),
        );

  const rows = db
    .select({
      id: chatThreads.id,
      userId: chatThreads.userId,
      title: chatThreads.title,
      archived: chatThreads.archived,
      createdAt: chatThreads.createdAt,
      updatedAt: chatThreads.updatedAt,
      contextId: chatThreadContexts.id,
      contextThreadId: chatThreadContexts.threadId,
      contextSummary: chatThreadContexts.summary,
      contextSummarizedMessageCount: chatThreadContexts.summarizedMessageCount,
      contextEstimatedPromptTokens: chatThreadContexts.estimatedPromptTokens,
      contextCapacity: chatThreadContexts.contextCapacity,
      contextUsagePercent: chatThreadContexts.usagePercent,
      contextState: chatThreadContexts.state,
      contextAutoSummariesCount: chatThreadContexts.autoSummariesCount,
      contextLastSummarizedAt: chatThreadContexts.lastSummarizedAt,
      contextCreatedAt: chatThreadContexts.createdAt,
      contextUpdatedAt: chatThreadContexts.updatedAt,
    })
    .from(chatThreads)
    .leftJoin(chatThreadContexts, eq(chatThreadContexts.threadId, chatThreads.id))
    .where(scopeFilter)
    .orderBy(desc(chatThreads.updatedAt))
    .all();

  const branchByThreadId = listChatThreadBranchesByThreadIds(
    userId,
    rows.map((row) => row.id),
  );

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    title: row.title,
    archived: row.archived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    context: row.contextId
      ? {
          id: row.contextId,
          threadId: row.contextThreadId ?? row.id,
          summary: row.contextSummary ?? "",
          summarizedMessageCount: row.contextSummarizedMessageCount ?? 0,
          estimatedPromptTokens: row.contextEstimatedPromptTokens ?? 0,
          contextCapacity: row.contextCapacity ?? DEFAULT_CHAT_CONTEXT_CAPACITY,
          usagePercent: row.contextUsagePercent ?? 0,
          state: normalizeChatContextState(row.contextState),
          autoSummariesCount: row.contextAutoSummariesCount ?? 0,
          lastSummarizedAt: row.contextLastSummarizedAt ?? null,
          createdAt: row.contextCreatedAt ?? row.createdAt,
          updatedAt: row.contextUpdatedAt ?? row.updatedAt,
        }
      : buildDefaultChatThreadContext(row.id),
    branch: branchByThreadId[row.id] ?? null,
  }));
}

export function getChatThreadByIdForUser(
  userId: string,
  threadId: string,
): ChatThreadRecord | null {
  const row = db
    .select({
      id: chatThreads.id,
      userId: chatThreads.userId,
      title: chatThreads.title,
      archived: chatThreads.archived,
      createdAt: chatThreads.createdAt,
      updatedAt: chatThreads.updatedAt,
      contextId: chatThreadContexts.id,
      contextThreadId: chatThreadContexts.threadId,
      contextSummary: chatThreadContexts.summary,
      contextSummarizedMessageCount: chatThreadContexts.summarizedMessageCount,
      contextEstimatedPromptTokens: chatThreadContexts.estimatedPromptTokens,
      contextCapacity: chatThreadContexts.contextCapacity,
      contextUsagePercent: chatThreadContexts.usagePercent,
      contextState: chatThreadContexts.state,
      contextAutoSummariesCount: chatThreadContexts.autoSummariesCount,
      contextLastSummarizedAt: chatThreadContexts.lastSummarizedAt,
      contextCreatedAt: chatThreadContexts.createdAt,
      contextUpdatedAt: chatThreadContexts.updatedAt,
    })
    .from(chatThreads)
    .leftJoin(chatThreadContexts, eq(chatThreadContexts.threadId, chatThreads.id))
    .where(and(eq(chatThreads.userId, userId), eq(chatThreads.id, threadId)))
    .limit(1)
    .get();

  if (!row) {
    return null;
  }

  const branch = listChatThreadBranchesByThreadIds(userId, [row.id])[row.id] ?? null;

  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    archived: row.archived,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    context: row.contextId
      ? {
          id: row.contextId,
          threadId: row.contextThreadId ?? row.id,
          summary: row.contextSummary ?? "",
          summarizedMessageCount: row.contextSummarizedMessageCount ?? 0,
          estimatedPromptTokens: row.contextEstimatedPromptTokens ?? 0,
          contextCapacity: row.contextCapacity ?? DEFAULT_CHAT_CONTEXT_CAPACITY,
          usagePercent: row.contextUsagePercent ?? 0,
          state: normalizeChatContextState(row.contextState),
          autoSummariesCount: row.contextAutoSummariesCount ?? 0,
          lastSummarizedAt: row.contextLastSummarizedAt ?? null,
          createdAt: row.contextCreatedAt ?? row.createdAt,
          updatedAt: row.contextUpdatedAt ?? row.updatedAt,
        }
      : buildDefaultChatThreadContext(row.id),
    branch,
  };
}

export function createChatThread(input: {
  id: string;
  userId: string;
  title: string;
}): ChatThreadRecord {
  const timestamp = nowIso();
  const contextId = cryptoRandomId();

  db.transaction(() => {
    db.insert(chatThreads)
      .values({
        id: input.id,
        userId: input.userId,
        title: input.title,
        archived: false,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();

    db.insert(chatThreadContexts)
      .values({
        id: contextId,
        threadId: input.id,
        summary: "",
        summarizedMessageCount: 0,
        estimatedPromptTokens: 0,
        contextCapacity: DEFAULT_CHAT_CONTEXT_CAPACITY,
        usagePercent: 0,
        state: "ok",
        autoSummariesCount: 0,
        lastSummarizedAt: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .run();
  });

  return {
    id: input.id,
    userId: input.userId,
    title: input.title,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
    context: {
      id: contextId,
      threadId: input.id,
      summary: "",
      summarizedMessageCount: 0,
      estimatedPromptTokens: 0,
      contextCapacity: DEFAULT_CHAT_CONTEXT_CAPACITY,
      usagePercent: 0,
      state: "ok",
      autoSummariesCount: 0,
      lastSummarizedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    branch: null,
  };
}

export function createChatThreadBranch(input: {
  id: string;
  threadId: string;
  sourceThreadId: string;
  sourceMessageId: string;
}): ChatThreadBranchRecord | null {
  const targetThread = db
    .select({
      id: chatThreads.id,
      userId: chatThreads.userId,
    })
    .from(chatThreads)
    .where(eq(chatThreads.id, input.threadId))
    .limit(1)
    .get();
  if (!targetThread) {
    return null;
  }

  const sourceThread = db
    .select({
      id: chatThreads.id,
      userId: chatThreads.userId,
      title: chatThreads.title,
    })
    .from(chatThreads)
    .where(eq(chatThreads.id, input.sourceThreadId))
    .limit(1)
    .get();
  if (!sourceThread || sourceThread.userId !== targetThread.userId) {
    return null;
  }

  const sourceMessage = db
    .select({
      id: chatMessages.id,
      threadId: chatMessages.threadId,
      content: chatMessages.content,
    })
    .from(chatMessages)
    .where(eq(chatMessages.id, input.sourceMessageId))
    .limit(1)
    .get();
  if (!sourceMessage || sourceMessage.threadId !== sourceThread.id) {
    return null;
  }

  const timestamp = nowIso();

  db.insert(chatThreadBranches)
    .values({
      id: input.id,
      threadId: input.threadId,
      sourceThreadId: input.sourceThreadId,
      sourceMessageId: input.sourceMessageId,
      createdAt: timestamp,
    })
    .run();

  return {
    id: input.id,
    threadId: input.threadId,
    sourceThreadId: input.sourceThreadId,
    sourceThreadTitle: sourceThread.title,
    sourceMessageId: input.sourceMessageId,
    sourceMessagePreview: normalizeChatMessagePreview(sourceMessage.content),
    createdAt: timestamp,
  };
}

export function updateChatThread(
  userId: string,
  threadId: string,
  input: { title?: string; archived?: boolean },
): boolean {
  const existing = getChatThreadByIdForUser(userId, threadId);
  if (!existing) {
    return false;
  }

  db.update(chatThreads)
    .set({
      title: input.title ?? existing.title,
      archived: input.archived ?? existing.archived,
      updatedAt: nowIso(),
    })
    .where(eq(chatThreads.id, threadId))
    .run();

  return true;
}

export function deleteChatThread(userId: string, threadId: string): boolean {
  const existing = getChatThreadByIdForUser(userId, threadId);
  if (!existing) {
    return false;
  }

  db.delete(chatThreads).where(eq(chatThreads.id, threadId)).run();
  return true;
}

export function listChatMessagesForThread(
  userId: string,
  threadId: string,
): ChatMessageRecord[] | null {
  const thread = getChatThreadByIdForUser(userId, threadId);

  if (!thread) {
    return null;
  }

  return db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.threadId, threadId))
    .orderBy(asc(chatMessages.createdAt))
    .all();
}

export function createChatMessage(input: {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
}): void {
  db.transaction(() => {
    db.insert(chatMessages)
      .values({
        id: input.id,
        threadId: input.threadId,
        role: input.role,
        content: input.content,
        createdAt: nowIso(),
      })
      .run();

    db.update(chatThreads)
      .set({
        updatedAt: nowIso(),
      })
      .where(eq(chatThreads.id, input.threadId))
      .run();
  });
}

function normalizeChatContextState(value: string | null | undefined): ChatContextState {
  if (value === "warning" || value === "degraded") {
    return value;
  }
  return "ok";
}

export function getChatThreadContextByThreadId(threadId: string): ChatThreadContextRecord | null {
  const existing = db
    .select()
    .from(chatThreadContexts)
    .where(eq(chatThreadContexts.threadId, threadId))
    .limit(1)
    .get();

  if (!existing) {
    return null;
  }

  return {
    ...existing,
    state: normalizeChatContextState(existing.state),
  };
}

export function upsertChatThreadContext(input: {
  threadId: string;
  summary?: string;
  summarizedMessageCount?: number;
  estimatedPromptTokens?: number;
  contextCapacity?: number;
  usagePercent?: number;
  state?: ChatContextState;
  autoSummariesCount?: number;
  lastSummarizedAt?: string | null;
}): ChatThreadContextRecord {
  const existing = getChatThreadContextByThreadId(input.threadId);
  const fallback = buildDefaultChatThreadContext(input.threadId);
  const now = nowIso();

  const nextRecord: ChatThreadContextRecord = {
    id: existing?.id ?? cryptoRandomId(),
    threadId: input.threadId,
    summary: input.summary ?? existing?.summary ?? fallback.summary,
    summarizedMessageCount:
      input.summarizedMessageCount ?? existing?.summarizedMessageCount ?? fallback.summarizedMessageCount,
    estimatedPromptTokens:
      input.estimatedPromptTokens ?? existing?.estimatedPromptTokens ?? fallback.estimatedPromptTokens,
    contextCapacity: input.contextCapacity ?? existing?.contextCapacity ?? fallback.contextCapacity,
    usagePercent: input.usagePercent ?? existing?.usagePercent ?? fallback.usagePercent,
    state: input.state ?? existing?.state ?? fallback.state,
    autoSummariesCount: input.autoSummariesCount ?? existing?.autoSummariesCount ?? fallback.autoSummariesCount,
    lastSummarizedAt:
      input.lastSummarizedAt === undefined
        ? (existing?.lastSummarizedAt ?? fallback.lastSummarizedAt)
        : input.lastSummarizedAt,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  db.transaction(() => {
    if (existing) {
      db.update(chatThreadContexts)
        .set({
          summary: nextRecord.summary,
          summarizedMessageCount: nextRecord.summarizedMessageCount,
          estimatedPromptTokens: nextRecord.estimatedPromptTokens,
          contextCapacity: nextRecord.contextCapacity,
          usagePercent: nextRecord.usagePercent,
          state: nextRecord.state,
          autoSummariesCount: nextRecord.autoSummariesCount,
          lastSummarizedAt: nextRecord.lastSummarizedAt,
          updatedAt: nextRecord.updatedAt,
        })
        .where(eq(chatThreadContexts.threadId, input.threadId))
        .run();
      return;
    }

    db.insert(chatThreadContexts)
      .values({
        id: nextRecord.id,
        threadId: nextRecord.threadId,
        summary: nextRecord.summary,
        summarizedMessageCount: nextRecord.summarizedMessageCount,
        estimatedPromptTokens: nextRecord.estimatedPromptTokens,
        contextCapacity: nextRecord.contextCapacity,
        usagePercent: nextRecord.usagePercent,
        state: nextRecord.state,
        autoSummariesCount: nextRecord.autoSummariesCount,
        lastSummarizedAt: nextRecord.lastSummarizedAt,
        createdAt: nextRecord.createdAt,
        updatedAt: nextRecord.updatedAt,
      })
      .run();
  });

  return nextRecord;
}

export function getUserCompanionPreferences(userId: string): CompanionPreferencesRecord | null {
  const existing = db
    .select()
    .from(userCompanionPreferences)
    .where(eq(userCompanionPreferences.userId, userId))
    .limit(1)
    .get();

  return existing ?? null;
}

export function upsertUserCompanionPreferences(
  userId: string,
  customInstructions: string,
): CompanionPreferencesRecord {
  const existing = getUserCompanionPreferences(userId);
  const timestamp = nowIso();

  if (existing) {
    db.update(userCompanionPreferences)
      .set({
        customInstructions,
        updatedAt: timestamp,
      })
      .where(eq(userCompanionPreferences.userId, userId))
      .run();

    return {
      ...existing,
      customInstructions,
      updatedAt: timestamp,
    };
  }

  const created: CompanionPreferencesRecord = {
    id: cryptoRandomId(),
    userId,
    customInstructions,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  db.insert(userCompanionPreferences).values(created).run();

  return created;
}

export function createChatEvent(input: {
  id: string;
  userId: string;
  threadId?: string | null;
  eventType: ChatEventType;
  payloadJson: string;
}): void {
  db.insert(chatEvents)
    .values({
      id: input.id,
      userId: input.userId,
      threadId: input.threadId ?? null,
      eventType: input.eventType,
      payloadJson: input.payloadJson,
      createdAt: nowIso(),
    })
    .run();
}

export function listChatEvents(input: {
  limit: number;
  threadId?: string;
  userId?: string;
  eventTypes?: ChatEventType[];
  sinceCreatedAt?: string;
}): ChatEventRecord[] {
  const filters: SQL[] = [];
  const eventTypes = input.eventTypes ?? [];

  if (input.threadId) {
    filters.push(eq(chatEvents.threadId, input.threadId));
  }

  if (input.userId) {
    filters.push(eq(chatEvents.userId, input.userId));
  }

  if (eventTypes.length === 1) {
    filters.push(eq(chatEvents.eventType, eventTypes[0]));
  } else if (eventTypes.length > 1) {
    const eventTypeFilters = eventTypes.map((eventType) => eq(chatEvents.eventType, eventType));
    const compoundFilter = or(...eventTypeFilters);
    if (compoundFilter) {
      filters.push(compoundFilter);
    }
  }

  if (input.sinceCreatedAt) {
    filters.push(gt(chatEvents.createdAt, input.sinceCreatedAt));
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  const query = db.select().from(chatEvents);
  const rows = whereClause
    ? query.where(whereClause).orderBy(desc(chatEvents.createdAt)).limit(input.limit).all()
    : query.orderBy(desc(chatEvents.createdAt)).limit(input.limit).all();

  return rows.map((row) => ({
    ...row,
    eventType: row.eventType as ChatEventType,
  }));
}

export function createPreviewEvent(input: {
  id: string;
  sessionId: string;
  eventType: PreviewEventType;
  path: string;
  referrer?: string | null;
  metadataJson?: string;
}): void {
  purgePreviewEventsOlderThanDays(90);

  db.insert(previewEvents)
    .values({
      id: input.id,
      sessionId: input.sessionId,
      eventType: input.eventType,
      path: input.path,
      referrer: input.referrer ?? null,
      metadataJson: input.metadataJson ?? "{}",
      createdAt: nowIso(),
    })
    .run();
}

export function purgePreviewEventsOlderThanDays(days: number): number {
  const safeDays = Number.isFinite(days) && days > 0 ? days : 90;
  const floor = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();
  const deleted = db.delete(previewEvents).where(lt(previewEvents.createdAt, floor)).run();
  return deleted.changes ?? 0;
}

export function listPreviewEventsByDays(days: number): PreviewEventRecord[] {
  const safeDays = Number.isFinite(days) && days > 0 ? days : 30;
  const floor = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();

  return db
    .select()
    .from(previewEvents)
    .where(gt(previewEvents.createdAt, floor))
    .orderBy(desc(previewEvents.createdAt))
    .all()
    .map((row) => ({
      ...row,
      eventType: row.eventType as PreviewEventType,
    }));
}

export function createRateLimitBlockEvent(input: {
  id: string;
  policyKey: string;
  route: string;
  method: string;
  ipHash: string;
  ipMasked?: string | null;
  userId?: string | null;
  country?: string | null;
  plan?: string | null;
  trustLevel?: string | null;
  blocked?: boolean;
  retryAfterSeconds: number;
  requestCount: number;
  limitValue: number;
  windowSeconds: number;
  scopeType: string;
  userAgent?: string | null;
  requestId?: string | null;
}): void {
  db.insert(rateLimitBlockEvents)
    .values({
      id: input.id,
      policyKey: input.policyKey,
      route: input.route,
      method: input.method,
      ipHash: input.ipHash,
      ipMasked: input.ipMasked ?? null,
      userId: input.userId ?? null,
      country: input.country ?? null,
      plan: input.plan ?? null,
      trustLevel: input.trustLevel ?? null,
      blocked: input.blocked ?? true,
      retryAfterSeconds: input.retryAfterSeconds,
      requestCount: input.requestCount,
      limitValue: input.limitValue,
      windowSeconds: input.windowSeconds,
      scopeType: input.scopeType,
      userAgent: input.userAgent ?? null,
      requestId: input.requestId ?? null,
      createdAt: nowIso(),
    })
    .run();
}

export function listRateLimitBlockEvents(input: {
  limit: number;
  policyKey?: string;
  route?: string;
  userId?: string;
  ipHash?: string;
  method?: string;
  fromCreatedAt?: string;
  toCreatedAt?: string;
  blocked?: boolean;
}): RateLimitBlockEventRecord[] {
  const safeLimit = Math.max(1, Math.min(input.limit, 500));
  const filters: SQL[] = [];

  if (input.policyKey) {
    filters.push(eq(rateLimitBlockEvents.policyKey, input.policyKey));
  }

  if (input.route) {
    filters.push(eq(rateLimitBlockEvents.route, input.route));
  }

  if (input.userId) {
    filters.push(eq(rateLimitBlockEvents.userId, input.userId));
  }

  if (input.ipHash) {
    filters.push(eq(rateLimitBlockEvents.ipHash, input.ipHash));
  }

  if (input.method) {
    filters.push(eq(rateLimitBlockEvents.method, input.method.toUpperCase()));
  }

  if (typeof input.blocked === "boolean") {
    filters.push(eq(rateLimitBlockEvents.blocked, input.blocked));
  }

  if (input.fromCreatedAt) {
    const fromClause = or(
      eq(rateLimitBlockEvents.createdAt, input.fromCreatedAt),
      gt(rateLimitBlockEvents.createdAt, input.fromCreatedAt),
    );
    if (fromClause) {
      filters.push(fromClause);
    }
  }

  if (input.toCreatedAt) {
    const toClause = or(
      eq(rateLimitBlockEvents.createdAt, input.toCreatedAt),
      lt(rateLimitBlockEvents.createdAt, input.toCreatedAt),
    );
    if (toClause) {
      filters.push(toClause);
    }
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const query = db.select().from(rateLimitBlockEvents);
  const rows = whereClause
    ? query.where(whereClause).orderBy(desc(rateLimitBlockEvents.createdAt)).limit(safeLimit).all()
    : query.orderBy(desc(rateLimitBlockEvents.createdAt)).limit(safeLimit).all();

  return rows;
}

export function listActiveRateLimitPolicyOverrides(input: {
  policyKey: string;
  asOf?: string;
}): RateLimitPolicyOverrideRecord[] {
  const now = input.asOf ?? nowIso();
  const activeStartsClause = or(
    isNull(rateLimitPolicyOverrides.startsAt),
    eq(rateLimitPolicyOverrides.startsAt, now),
    lt(rateLimitPolicyOverrides.startsAt, now),
  );
  const activeEndsClause = or(
    isNull(rateLimitPolicyOverrides.endsAt),
    eq(rateLimitPolicyOverrides.endsAt, now),
    gt(rateLimitPolicyOverrides.endsAt, now),
  );
  const activeEnabledClause = or(
    isNull(rateLimitPolicyOverrides.enabled),
    eq(rateLimitPolicyOverrides.enabled, true),
  );

  const rows = db
    .select()
    .from(rateLimitPolicyOverrides)
    .where(
      and(
        eq(rateLimitPolicyOverrides.policyKey, input.policyKey),
        activeStartsClause,
        activeEndsClause,
        activeEnabledClause,
      ),
    )
    .orderBy(desc(rateLimitPolicyOverrides.updatedAt))
    .all();

  return rows.map((row) => ({
    ...row,
    scopeType: row.scopeType as RateLimitOverrideScopeType,
  }));
}

export function createSystemJobRun(input: {
  id: string;
  jobName: string;
  status: string;
}): SystemJobRunRecord {
  const startedAt = nowIso();
  db.insert(systemJobRuns)
    .values({
      id: input.id,
      jobName: input.jobName,
      status: input.status,
      usersScanned: 0,
      usersWithDigestEnabled: 0,
      notificationsCreated: 0,
      duplicatesSkipped: 0,
      startedAt,
      finishedAt: null,
      errorMessage: null,
    })
    .run();

  return {
    id: input.id,
    jobName: input.jobName,
    status: input.status,
    usersScanned: 0,
    usersWithDigestEnabled: 0,
    notificationsCreated: 0,
    duplicatesSkipped: 0,
    startedAt,
    finishedAt: null,
    errorMessage: null,
  };
}

export function finishSystemJobRun(
  id: string,
  input: {
    status: "success" | "error" | "skipped";
    usersScanned?: number;
    usersWithDigestEnabled?: number;
    notificationsCreated?: number;
    duplicatesSkipped?: number;
    errorMessage?: string | null;
  },
): boolean {
  const existing = db
    .select({ id: systemJobRuns.id })
    .from(systemJobRuns)
    .where(eq(systemJobRuns.id, id))
    .limit(1)
    .get();

  if (!existing) {
    return false;
  }

  db.update(systemJobRuns)
    .set({
      status: input.status,
      usersScanned: input.usersScanned ?? 0,
      usersWithDigestEnabled: input.usersWithDigestEnabled ?? 0,
      notificationsCreated: input.notificationsCreated ?? 0,
      duplicatesSkipped: input.duplicatesSkipped ?? 0,
      finishedAt: nowIso(),
      errorMessage: input.errorMessage ?? null,
    })
    .where(eq(systemJobRuns.id, id))
    .run();

  return true;
}

export function listSystemJobRuns(input: {
  jobName?: string;
  status?: string;
  days?: number;
  limit: number;
}): SystemJobRunRecord[] {
  const safeLimit = Math.max(1, Math.min(input.limit, 500));
  let whereClause: SQL<unknown> | undefined;

  if (input.jobName) {
    whereClause = eq(systemJobRuns.jobName, input.jobName);
  }

  if (input.status) {
    const statusClause = eq(systemJobRuns.status, input.status);
    whereClause = whereClause ? and(whereClause, statusClause) : statusClause;
  }

  if (input.days && Number.isFinite(input.days) && input.days > 0) {
    const floor = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000).toISOString();
    const daysClause = gt(systemJobRuns.startedAt, floor);
    whereClause = whereClause ? and(whereClause, daysClause) : daysClause;
  }

  const rows = whereClause
    ? db
        .select()
        .from(systemJobRuns)
        .where(whereClause)
        .orderBy(desc(systemJobRuns.startedAt))
        .limit(safeLimit)
        .all()
    : db
        .select()
        .from(systemJobRuns)
        .orderBy(desc(systemJobRuns.startedAt))
        .limit(safeLimit)
        .all();

  return rows;
}

export function createInvitation(input: {
  id: string;
  tokenHash: string;
  email?: string | null;
  roleToGrant?: UserRole;
  maxUses?: number;
  expiresAt: string;
  createdByUserId: string;
}): InvitationRecord {
  const timestamp = nowIso();
  const normalizedEmail = input.email ? input.email.trim().toLowerCase() : null;

  db.insert(invitations)
    .values({
      id: input.id,
      tokenHash: input.tokenHash,
      email: normalizedEmail,
      roleToGrant: input.roleToGrant ?? "user",
      maxUses: input.maxUses ?? 1,
      usedCount: 0,
      expiresAt: input.expiresAt,
      createdByUserId: input.createdByUserId,
      createdAt: timestamp,
      usedAt: null,
      usedByUserId: null,
      revokedAt: null,
    })
    .run();

  const created = db.select().from(invitations).where(eq(invitations.id, input.id)).limit(1).get();
  if (!created) {
    throw new Error("Failed to create invitation.");
  }

  return created;
}

export function getInvitationByTokenHash(tokenHash: string): InvitationRecord | null {
  const invitation =
    db.select().from(invitations).where(eq(invitations.tokenHash, tokenHash)).limit(1).get() ?? null;
  return invitation;
}

export function createSignupIntent(input: {
  id: string;
  email: string;
  flowType: SignupFlowType;
  inviteId?: string | null;
  inviteTokenHash?: string | null;
  verificationTokenHash: string;
  verificationCodeHash: string;
  verificationExpiresAt: string;
  expiresAt: string;
  legalAcceptedAt?: string | null;
  legalTermsVersion?: string | null;
  privacyVersion?: string | null;
  locale?: string | null;
}): SignupIntentRecord {
  const timestamp = nowIso();
  const normalizedEmail = input.email.trim().toLowerCase();

  db.delete(signupIntents)
    .where(and(eq(signupIntents.email, normalizedEmail), isNull(signupIntents.completedAt)))
    .run();

  db.insert(signupIntents)
    .values({
      id: input.id,
      email: normalizedEmail,
      flowType: input.flowType,
      inviteId: input.inviteId ?? null,
      inviteTokenHash: input.inviteTokenHash ?? null,
      verificationTokenHash: input.verificationTokenHash,
      verificationCodeHash: input.verificationCodeHash,
      verificationExpiresAt: input.verificationExpiresAt,
      verificationSentAt: timestamp,
      verificationSendCount: 1,
      emailVerifiedAt: null,
      completionTokenHash: null,
      completionExpiresAt: null,
      legalAcceptedAt: input.legalAcceptedAt ?? null,
      legalTermsVersion: input.legalTermsVersion ?? null,
      privacyVersion: input.privacyVersion ?? null,
      locale: input.locale ?? null,
      expiresAt: input.expiresAt,
      completedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  const created = db.select().from(signupIntents).where(eq(signupIntents.id, input.id)).limit(1).get();
  if (!created) {
    throw new Error("Failed to create signup intent.");
  }

  return created;
}

export function getLatestActiveSignupIntentByEmail(email: string): SignupIntentRecord | null {
  const normalizedEmail = email.trim().toLowerCase();

  const intent =
    db
      .select()
      .from(signupIntents)
      .where(
        and(
          eq(signupIntents.email, normalizedEmail),
          isNull(signupIntents.completedAt),
          gt(signupIntents.expiresAt, nowIso()),
        ),
      )
      .orderBy(desc(signupIntents.createdAt))
      .limit(1)
      .get() ?? null;

  return intent;
}

export function getActiveSignupIntentByVerificationTokenHash(tokenHash: string): SignupIntentRecord | null {
  const intent =
    db
      .select()
      .from(signupIntents)
      .where(
        and(
          eq(signupIntents.verificationTokenHash, tokenHash),
          isNull(signupIntents.completedAt),
          gt(signupIntents.expiresAt, nowIso()),
          gt(signupIntents.verificationExpiresAt, nowIso()),
        ),
      )
      .limit(1)
      .get() ?? null;

  return intent;
}

export function getActiveSignupIntentByEmailAndVerificationCodeHash(
  email: string,
  codeHash: string,
): SignupIntentRecord | null {
  const normalizedEmail = email.trim().toLowerCase();

  const intent =
    db
      .select()
      .from(signupIntents)
      .where(
        and(
          eq(signupIntents.email, normalizedEmail),
          eq(signupIntents.verificationCodeHash, codeHash),
          isNull(signupIntents.completedAt),
          gt(signupIntents.expiresAt, nowIso()),
          gt(signupIntents.verificationExpiresAt, nowIso()),
        ),
      )
      .orderBy(desc(signupIntents.createdAt))
      .limit(1)
      .get() ?? null;

  return intent;
}

export function replaceSignupIntentVerificationChallenge(input: {
  intentId: string;
  verificationTokenHash: string;
  verificationCodeHash: string;
  verificationExpiresAt: string;
}): SignupIntentRecord | null {
  const existing =
    db
      .select({
        verificationSendCount: signupIntents.verificationSendCount,
      })
      .from(signupIntents)
      .where(eq(signupIntents.id, input.intentId))
      .limit(1)
      .get() ?? null;

  if (!existing) {
    return null;
  }

  const timestamp = nowIso();
  db.update(signupIntents)
    .set({
      verificationTokenHash: input.verificationTokenHash,
      verificationCodeHash: input.verificationCodeHash,
      verificationExpiresAt: input.verificationExpiresAt,
      verificationSentAt: timestamp,
      verificationSendCount: existing.verificationSendCount + 1,
      updatedAt: timestamp,
    })
    .where(eq(signupIntents.id, input.intentId))
    .run();

  return db.select().from(signupIntents).where(eq(signupIntents.id, input.intentId)).limit(1).get() ?? null;
}

export function markSignupIntentEmailVerified(input: {
  intentId: string;
  completionTokenHash: string;
  completionExpiresAt: string;
}): SignupIntentRecord | null {
  const timestamp = nowIso();
  const updated = db
    .update(signupIntents)
    .set({
      emailVerifiedAt: timestamp,
      completionTokenHash: input.completionTokenHash,
      completionExpiresAt: input.completionExpiresAt,
      updatedAt: timestamp,
    })
    .where(
      and(
        eq(signupIntents.id, input.intentId),
        isNull(signupIntents.completedAt),
        gt(signupIntents.expiresAt, timestamp),
      ),
    )
    .run();

  if (updated.changes <= 0) {
    return null;
  }

  return db.select().from(signupIntents).where(eq(signupIntents.id, input.intentId)).limit(1).get() ?? null;
}

export function getActiveSignupIntentByCompletionTokenHash(tokenHash: string): SignupIntentRecord | null {
  const now = nowIso();
  const intent =
    db
      .select()
      .from(signupIntents)
      .where(
        and(
          eq(signupIntents.completionTokenHash, tokenHash),
          isNull(signupIntents.completedAt),
          isNotNull(signupIntents.emailVerifiedAt),
          gt(signupIntents.expiresAt, now),
          gt(signupIntents.completionExpiresAt, now),
        ),
      )
      .limit(1)
      .get() ?? null;

  return intent;
}

export function setSignupIntentLocale(intentId: string, locale: string | null): SignupIntentRecord | null {
  const timestamp = nowIso();
  const updated = db
    .update(signupIntents)
    .set({
      locale,
      updatedAt: timestamp,
    })
    .where(eq(signupIntents.id, intentId))
    .run();

  if (updated.changes <= 0) {
    return null;
  }

  return db.select().from(signupIntents).where(eq(signupIntents.id, intentId)).limit(1).get() ?? null;
}

export function setSignupIntentLegalAcceptance(input: {
  intentId: string;
  acceptedAt: string;
  legalTermsVersion: string;
  privacyVersion: string;
}): SignupIntentRecord | null {
  const updated = db
    .update(signupIntents)
    .set({
      legalAcceptedAt: input.acceptedAt,
      legalTermsVersion: input.legalTermsVersion,
      privacyVersion: input.privacyVersion,
      updatedAt: nowIso(),
    })
    .where(eq(signupIntents.id, input.intentId))
    .run();

  if (updated.changes <= 0) {
    return null;
  }

  return db.select().from(signupIntents).where(eq(signupIntents.id, input.intentId)).limit(1).get() ?? null;
}

export function markSignupIntentCompleted(intentId: string): SignupIntentRecord | null {
  const timestamp = nowIso();
  const updated = db
    .update(signupIntents)
    .set({
      completedAt: timestamp,
      updatedAt: timestamp,
    })
    .where(and(eq(signupIntents.id, intentId), isNull(signupIntents.completedAt)))
    .run();

  if (updated.changes <= 0) {
    return null;
  }

  return db.select().from(signupIntents).where(eq(signupIntents.id, intentId)).limit(1).get() ?? null;
}

export function listInvitations(input: {
  limit: number;
  offset: number;
}): {
  items: InvitationRecord[];
  total: number;
} {
  const safeLimit = Math.max(1, Math.min(200, Math.trunc(input.limit)));
  const safeOffset = Math.max(0, Math.trunc(input.offset));

  const items = db
    .select()
    .from(invitations)
    .orderBy(desc(invitations.createdAt))
    .limit(safeLimit)
    .offset(safeOffset)
    .all();

  const totalRow = db.select({ count: count() }).from(invitations).get();

  return {
    items,
    total: totalRow?.count ?? 0,
  };
}

export function revokeInvitationById(invitationId: string): {
  invitation: InvitationRecord | null;
  revoked: boolean;
} {
  const timestamp = nowIso();
  const updated = db
    .update(invitations)
    .set({
      revokedAt: timestamp,
    })
    .where(and(eq(invitations.id, invitationId), isNull(invitations.revokedAt)))
    .run();

  const invitation = db.select().from(invitations).where(eq(invitations.id, invitationId)).limit(1).get() ?? null;

  return {
    invitation,
    revoked: updated.changes > 0,
  };
}

export function createAdminAuditLog(input: {
  id: string;
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  payloadJson: string;
}): void {
  db.insert(adminAuditLogs)
    .values({
      id: input.id,
      adminUserId: input.adminUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      payloadJson: input.payloadJson,
      createdAt: nowIso(),
    })
    .run();
}

export function listAdminAuditLogs(limit: number) {
  return db
    .select()
    .from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(limit)
    .all();
}

export const contentDb = db;
