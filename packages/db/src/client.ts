import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { and, asc, count, desc, eq, gt, like, lt, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import {
  adminAuditLogs,
  communityCircles,
  contentHighlights,
  contentPillars,
  journalEntries,
  libraryLessons,
  mfaChallenges,
  passkeyCredentials,
  practiceRoutines,
  refreshSessions,
  sessions,
  users,
  type ContentStatus,
  type UserRole,
} from "./schema.js";
import {
  COMMUNITY_SEED,
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
};

export type SecuritySettings = {
  mfaEnabled: boolean;
  passkeyEnabled: boolean;
};

export type PasskeyCredentialRecord = {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports: string[];
  createdAt: string;
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
    sessions,
    refreshSessions,
    mfaChallenges,
    passkeyCredentials,
    adminAuditLogs,
    journalEntries,
    contentPillars,
    contentHighlights,
    libraryLessons,
    practiceRoutines,
    communityCircles,
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
      .run();
  }

  const lessonCount = db.select({ count: count() }).from(libraryLessons).get();
  if ((lessonCount?.count ?? 0) === 0) {
    db.insert(libraryLessons)
      .values(
        LIBRARY_SEED.map((item) => ({
          ...item,
          status: "PUBLISHED" as ContentStatus,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      )
      .run();
  }

  const routineCount = db.select({ count: count() }).from(practiceRoutines).get();
  if ((routineCount?.count ?? 0) === 0) {
    db.insert(practiceRoutines)
      .values(
        PRACTICE_SEED.map((item) => ({
          ...item,
          status: "PUBLISHED" as ContentStatus,
          createdAt: timestamp,
          updatedAt: timestamp,
        })),
      )
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
      .run();
  }
}

if (!globalForDb.seeded) {
  seedIfEmpty();
  globalForDb.seeded = true;
}

export function countUsers(): number {
  const row = db.select({ count: count() }).from(users).get();
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
    })
    .from(users)
    .where(eq(users.id, userId))
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
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    .run();

  return getUserById(input.id);
}

export function createSession(input: {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: string;
}): void {
  db.insert(sessions)
    .values({
      id: input.id,
      tokenHash: input.tokenHash,
      userId: input.userId,
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
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, nowIso())))
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
  };
}

export function createRefreshSession(input: {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: string;
}): void {
  db.insert(refreshSessions)
    .values({
      id: input.id,
      tokenHash: input.tokenHash,
      userId: input.userId,
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

export function getRefreshSessionUserByTokenHash(tokenHash: string): CurrentUser | null {
  const joined = db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
    })
    .from(refreshSessions)
    .innerJoin(users, eq(refreshSessions.userId, users.id))
    .where(and(eq(refreshSessions.tokenHash, tokenHash), gt(refreshSessions.expiresAt, nowIso())))
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
  };
}

export function rotateRefreshSessionByTokenHash(
  oldTokenHash: string,
  replacement: {
    id: string;
    tokenHash: string;
    userId: string;
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
    publicKey: row.publicKey,
    counter: row.counter,
    transports: parseTransports(row.transports),
    createdAt: row.createdAt,
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
    publicKey: row.publicKey,
    counter: row.counter,
    transports: parseTransports(row.transports),
    createdAt: row.createdAt,
  };
}

export function createPasskeyCredential(input: {
  id: string;
  userId: string;
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
}): void {
  db.insert(passkeyCredentials)
    .values({
      id: input.id,
      userId: input.userId,
      credentialId: input.credentialId,
      publicKey: input.publicKey,
      counter: input.counter,
      transports: JSON.stringify(input.transports ?? []),
      createdAt: nowIso(),
    })
    .run();
}

export function updatePasskeyCredential(input: {
  credentialId: string;
  publicKey: string;
  counter: number;
  transports?: string[];
}): void {
  db.update(passkeyCredentials)
    .set({
      publicKey: input.publicKey,
      counter: input.counter,
      transports: JSON.stringify(input.transports ?? []),
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
    })
    .where(eq(passkeyCredentials.credentialId, credentialId))
    .run();
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
        ),
      ),
    )
    .orderBy(desc(libraryLessons.id))
    .all();
}

export function getPracticeRoutines() {
  return db
    .select()
    .from(practiceRoutines)
    .where(eq(practiceRoutines.status, "PUBLISHED"))
    .orderBy(asc(practiceRoutines.id))
    .all();
}

export function getCommunityCircles() {
  return db
    .select()
    .from(communityCircles)
    .where(eq(communityCircles.status, "PUBLISHED"))
    .orderBy(asc(communityCircles.id))
    .all();
}

export function listAllContentAdmin() {
  return {
    pillars: db.select().from(contentPillars).orderBy(asc(contentPillars.id)).all(),
    highlights: db.select().from(contentHighlights).orderBy(asc(contentHighlights.id)).all(),
    lessons: db.select().from(libraryLessons).orderBy(desc(libraryLessons.id)).all(),
    practices: db.select().from(practiceRoutines).orderBy(asc(practiceRoutines.id)).all(),
    community: db.select().from(communityCircles).orderBy(asc(communityCircles.id)).all(),
  };
}

export function createLesson(input: {
  slug: string;
  title: string;
  tradition: string;
  level: string;
  minutes: number;
  summary: string;
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
  status: ContentStatus;
}) {
  const timestamp = nowIso();

  db.insert(practiceRoutines)
    .values({
      slug: input.slug,
      title: input.title,
      description: input.description,
      cadence: input.cadence,
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
    status: ContentStatus;
  },
) {
  db.update(practiceRoutines)
    .set({
      slug: input.slug,
      title: input.title,
      description: input.description,
      cadence: input.cadence,
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
