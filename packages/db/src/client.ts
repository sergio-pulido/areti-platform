import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { and, asc, count, desc, eq, gt, isNotNull, isNull, like, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import {
  adminAuditLogs,
  chatEvents,
  chatMessages,
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
  userContentCompletions,
  libraryLessons,
  mfaChallenges,
  passkeyCredentials,
  previewEvents,
  practiceRoutines,
  refreshSessions,
  sessions,
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
  type ContentCompletionKind,
  type ContentStatus,
  type LegalPolicyType,
  type PreviewEventType,
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

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  emailVerifiedAt: string | null;
  onboardingCompletedAt: string | null;
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

export type ChatThreadRecord = {
  id: string;
  userId: string;
  title: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatMessageRecord = {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type ChatThreadScope = "active" | "archived" | "all";

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
  | "message_provider_error";

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
  summary: "",
  phone: "",
  city: "",
  country: "",
  socialLinks: [],
};

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
    userNotifications,
    chatThreads,
    chatMessages,
    userCompanionPreferences,
    chatEvents,
    journalEntries,
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
}

ensureCompatibilitySchema();

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

export function countVerifiedUsers(): number {
  const row = db
    .select({ count: count() })
    .from(users)
    .where(and(isNotNull(users.emailVerifiedAt), isNull(users.deletedAt)))
    .get();
  return row?.count ?? 0;
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

export function createUser(input: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}) {
  const timestamp = nowIso();

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
      createdAt: timestamp,
      updatedAt: timestamp,
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
      createdAt: timestamp,
      updatedAt: timestamp,
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
      createdAt: timestamp,
      updatedAt: timestamp,
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
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  seedWelcomeNotifications(input.id);

  return getUserById(input.id);
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
    summary: profile.summary,
    phone: profile.phone,
    city: profile.city,
    country: profile.country,
    socialLinks: parseSocialLinks(profile.socialLinksJson),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function upsertUserProfile(
  userId: string,
  input: {
    username?: string | null;
    summary?: string;
    phone?: string;
    city?: string;
    country?: string;
    socialLinks?: Array<{ label: string; url: string }>;
  },
): UserProfileRecord {
  const current = getUserProfileByUserId(userId);
  const timestamp = nowIso();

  db.update(userProfiles)
    .set({
      username: input.username === undefined ? current.username : input.username,
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

export function getUserOnboardingProfile(userId: string): OnboardingProfileRecord | null {
  const existing = db
    .select()
    .from(userOnboardingProfiles)
    .where(eq(userOnboardingProfiles.userId, userId))
    .limit(1)
    .get();

  return existing ?? null;
}

export function upsertUserOnboardingProfile(input: {
  id: string;
  userId: string;
  primaryObjective: string;
  biggestDifficulty: string;
  mainNeed: string;
  dailyTimeCommitment: string;
  coachingStyle: string;
  contemplativeExperience: string;
  preferredPracticeFormat: string;
  successDefinition30d: string;
  notes?: string | null;
}): OnboardingProfileRecord {
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
        primaryObjective: input.primaryObjective,
        biggestDifficulty: input.biggestDifficulty,
        mainNeed: input.mainNeed,
        dailyTimeCommitment: input.dailyTimeCommitment,
        coachingStyle: input.coachingStyle,
        contemplativeExperience: input.contemplativeExperience,
        preferredPracticeFormat: input.preferredPracticeFormat,
        successDefinition30d: input.successDefinition30d,
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
        primaryObjective: input.primaryObjective,
        biggestDifficulty: input.biggestDifficulty,
        mainNeed: input.mainNeed,
        dailyTimeCommitment: input.dailyTimeCommitment,
        coachingStyle: input.coachingStyle,
        contemplativeExperience: input.contemplativeExperience,
        preferredPracticeFormat: input.preferredPracticeFormat,
        successDefinition30d: input.successDefinition30d,
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

  return profile;
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

  return db.select().from(chatThreads).where(scopeFilter).orderBy(desc(chatThreads.updatedAt)).all();
}

export function getChatThreadByIdForUser(
  userId: string,
  threadId: string,
): ChatThreadRecord | null {
  const existing = db
    .select()
    .from(chatThreads)
    .where(and(eq(chatThreads.userId, userId), eq(chatThreads.id, threadId)))
    .limit(1)
    .get();

  return existing ?? null;
}

export function createChatThread(input: {
  id: string;
  userId: string;
  title: string;
}): ChatThreadRecord {
  const timestamp = nowIso();

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

  return {
    id: input.id,
    userId: input.userId,
    title: input.title,
    archived: false,
    createdAt: timestamp,
    updatedAt: timestamp,
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

export function listChatEvents(limit: number): ChatEventRecord[] {
  return db
    .select()
    .from(chatEvents)
    .orderBy(desc(chatEvents.createdAt))
    .limit(limit)
    .all()
    .map((row) => ({
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
