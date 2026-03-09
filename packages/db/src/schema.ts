import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export type UserRole = "MEMBER" | "ADMIN";
export type ContentStatus = "DRAFT" | "PUBLISHED";
export type LegalPolicyType = "TERMS" | "PRIVACY";
export type ContentCompletionKind = "lesson" | "practice";
export type PreviewEventType =
  | "preview_page_view"
  | "preview_signup_click"
  | "preview_signup_view"
  | "preview_chat_prompt_submitted"
  | "preview_chat_response_received";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().notNull().default("MEMBER"),
  mfaEnabled: integer("mfa_enabled", { mode: "boolean" }).notNull().default(false),
  passkeyEnabled: integer("passkey_enabled", { mode: "boolean" }).notNull().default(false),
  emailVerifiedAt: text("email_verified_at"),
  onboardingCompletedAt: text("onboarding_completed_at"),
  deletedAt: text("deleted_at"),
  anonymizedAt: text("anonymized_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  username: text("username"),
  summary: text("summary").notNull().default(""),
  phone: text("phone").notNull().default(""),
  city: text("city").notNull().default(""),
  country: text("country").notNull().default(""),
  socialLinksJson: text("social_links_json").notNull().default("[]"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userPreferences = sqliteTable("user_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  language: text("language").notNull().default("en"),
  timezone: text("timezone").notNull().default("UTC"),
  profileVisibility: text("profile_visibility").notNull().default("private"),
  showEmail: integer("show_email", { mode: "boolean" }).notNull().default(false),
  showPhone: integer("show_phone", { mode: "boolean" }).notNull().default(false),
  allowContact: integer("allow_contact", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userNotificationPreferences = sqliteTable("user_notification_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  emailChallenges: integer("email_challenges", { mode: "boolean" }).notNull().default(true),
  emailEvents: integer("email_events", { mode: "boolean" }).notNull().default(true),
  emailUpdates: integer("email_updates", { mode: "boolean" }).notNull().default(true),
  emailMarketing: integer("email_marketing", { mode: "boolean" }).notNull().default(false),
  pushChallenges: integer("push_challenges", { mode: "boolean" }).notNull().default(true),
  pushEvents: integer("push_events", { mode: "boolean" }).notNull().default(false),
  pushUpdates: integer("push_updates", { mode: "boolean" }).notNull().default(true),
  digest: text("digest").notNull().default("immediate"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const userDeletionAudit = sqliteTable("user_deletion_audit", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  reason: text("reason").notNull(),
  deletedAt: text("deleted_at").notNull(),
  createdAt: text("created_at").notNull(),
});

export const userLegalConsents = sqliteTable(
  "user_legal_consents",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    policyType: text("policy_type").$type<LegalPolicyType>().notNull(),
    policyVersion: text("policy_version").notNull(),
    acceptedAt: text("accepted_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    userPolicyVersionUnique: uniqueIndex("user_legal_consents_user_policy_version_unique").on(
      table.userId,
      table.policyType,
      table.policyVersion,
    ),
  }),
);

export const emailVerificationChallenges = sqliteTable("email_verification_challenges", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
  consumedAt: text("consumed_at"),
  lastSentAt: text("last_sent_at").notNull(),
  sendCount: integer("send_count").notNull().default(1),
});

export const userOnboardingProfiles = sqliteTable("user_onboarding_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  primaryObjective: text("primary_objective").notNull(),
  biggestDifficulty: text("biggest_difficulty").notNull(),
  mainNeed: text("main_need").notNull(),
  dailyTimeCommitment: text("daily_time_commitment").notNull(),
  coachingStyle: text("coaching_style").notNull(),
  contemplativeExperience: text("contemplative_experience").notNull(),
  preferredPracticeFormat: text("preferred_practice_format").notNull(),
  successDefinition30d: text("success_definition_30d").notNull(),
  notes: text("notes"),
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

export const userContentCompletions = sqliteTable(
  "user_content_completions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contentKind: text("content_kind").$type<ContentCompletionKind>().notNull(),
    contentSlug: text("content_slug").notNull(),
    completionCount: integer("completion_count").notNull().default(1),
    lastCompletedAt: text("last_completed_at").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => ({
    userContentUnique: uniqueIndex("user_content_completions_user_kind_slug_unique").on(
      table.userId,
      table.contentKind,
      table.contentSlug,
    ),
  }),
);

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

export const userCompanionPreferences = sqliteTable("user_companion_preferences", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  customInstructions: text("custom_instructions").notNull().default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const chatEvents = sqliteTable("chat_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  threadId: text("thread_id").references(() => chatThreads.id, { onDelete: "set null" }),
  eventType: text("event_type").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: text("created_at").notNull(),
});

export const previewEvents = sqliteTable("preview_events", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  eventType: text("event_type").$type<PreviewEventType>().notNull(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  metadataJson: text("metadata_json").notNull().default("{}"),
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
