import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type UserRole = "MEMBER" | "ADMIN";
export type ContentStatus = "DRAFT" | "PUBLISHED";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().notNull().default("MEMBER"),
  mfaEnabled: integer("mfa_enabled", { mode: "boolean" }).notNull().default(false),
  passkeyEnabled: integer("passkey_enabled", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userDevices = sqliteTable("user_devices", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fingerprint: text("fingerprint").notNull(),
  label: text("label").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  revokedAt: text("revoked_at"),
  lastSeenAt: text("last_seen_at").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id").references(() => userDevices.id, { onDelete: "set null" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const refreshSessions = sqliteTable("refresh_sessions", {
  id: text("id").primaryKey(),
  tokenHash: text("token_hash").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id").references(() => userDevices.id, { onDelete: "set null" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
  rotatedAt: text("rotated_at"),
});

export const mfaChallenges = sqliteTable("mfa_challenges", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  codeHash: text("code_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const passkeyCredentials = sqliteTable("passkey_credentials", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(),
  nickname: text("nickname"),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  transports: text("transports"),
  lastUsedAt: text("last_used_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const adminAuditLogs = sqliteTable("admin_audit_logs", {
  id: text("id").primaryKey(),
  adminUserId: text("admin_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  payloadJson: text("payload_json").notNull(),
  createdAt: text("created_at").notNull(),
});

export const journalEntries = sqliteTable("journal_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  mood: text("mood").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const contentPillars = sqliteTable("content_pillars", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").$type<ContentStatus>().notNull().default("PUBLISHED"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const contentHighlights = sqliteTable("content_highlights", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  status: text("status").$type<ContentStatus>().notNull().default("PUBLISHED"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const libraryLessons = sqliteTable("library_lessons", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  tradition: text("tradition").notNull(),
  level: text("level").notNull(),
  minutes: integer("minutes").notNull(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  status: text("status").$type<ContentStatus>().notNull().default("PUBLISHED"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const practiceRoutines = sqliteTable("practice_routines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  cadence: text("cadence").notNull(),
  protocol: text("protocol").notNull(),
  status: text("status").$type<ContentStatus>().notNull().default("PUBLISHED"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const communityCircles = sqliteTable("community_circles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  focus: text("focus").notNull(),
  schedule: text("schedule").notNull(),
  status: text("status").$type<ContentStatus>().notNull().default("PUBLISHED"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const communityChallenges = sqliteTable("community_challenges", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  duration: text("duration").notNull(),
  summary: text("summary").notNull(),
  status: text("status").$type<ContentStatus>().notNull().default("PUBLISHED"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const communityResources = sqliteTable("community_resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  href: text("href").notNull(),
  cta: text("cta").notNull(),
  status: text("status").$type<ContentStatus>().notNull().default("PUBLISHED"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const communityExperts = sqliteTable("community_experts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  focus: text("focus").notNull(),
  status: text("status").$type<ContentStatus>().notNull().default("PUBLISHED"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const communityEvents = sqliteTable("community_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  schedule: text("schedule").notNull(),
  summary: text("summary").notNull(),
  status: text("status").$type<ContentStatus>().notNull().default("PUBLISHED"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const creatorVideos = sqliteTable("creator_videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  format: text("format").notNull(),
  summary: text("summary").notNull(),
  videoUrl: text("video_url").notNull(),
  status: text("status").$type<ContentStatus>().notNull().default("PUBLISHED"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userNotifications = sqliteTable("user_notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  href: text("href").notNull(),
  readAt: text("read_at"),
  createdAt: text("created_at").notNull(),
});

export const chatThreads = sqliteTable("chat_threads", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  threadId: text("thread_id")
    .notNull()
    .references(() => chatThreads.id, { onDelete: "cascade" }),
  role: text("role").$type<"user" | "assistant">().notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userTotpSecrets = sqliteTable("user_totp_secrets", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  secret: text("secret").notNull(),
  verifiedAt: text("verified_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
