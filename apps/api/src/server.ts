import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { createReadStream, existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import argon2 from "argon2";
import cors from "cors";
import nodemailer, { type Transporter } from "nodemailer";
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  deleteAcademyConceptRelation,
  deleteAcademyPersonRelationshipById,
  getAcademyConceptById,
  getAcademyConceptBySlug,
  getAcademyConceptLinksBySlug,
  getAcademyConcepts,
  getAcademyCurationSnapshot,
  getAcademyDomainBySlug,
  getAcademyDomains,
  getAcademyKnowledgeOverview,
  getAcademyPathBySlug,
  getAcademyPaths,
  getAcademyPersonById,
  getAcademyPersonBySlug,
  getAcademyPersonRelationships,
  getAcademyPersons,
  getAcademyTraditionById,
  getAcademyTraditionBySlug,
  getAcademyTraditions,
  getAcademyWorkById,
  getAcademyWorkBySlug,
  getAcademyWorks,
  replaceAcademyPathItems,
  queryAcademyKnowledge,
  searchAcademyKnowledge,
  updateAcademyPathCuration,
  updateAcademyPersonEditorialMetadata,
  upsertAcademyConceptRelation,
  upsertAcademyPersonRelationship,
  consumeEmailVerificationChallenge,
  countVerifiedUsers,
  countJournalEntriesByUser,
  createAdminAuditLog,
  createChatEvent,
  createChatMessage,
  createChatThreadBranch,
  createEmailVerificationChallenge,
  createChatThread,
  createCommunity,
  createCommunityChallenge,
  createCommunityEvent,
  createCommunityExpert,
  createCommunityResource,
  createCreatorVideo,
  createHighlight,
  createJournalEntry,
  createLesson,
  createNotification,
  createNotificationIfRecentDuplicateAbsent,
  createPreviewEvent,
  createSystemJobRun,
  createPasskeyCredential,
  createPillar,
  createPractice,
  createRefreshSession,
  createSession,
  createUserLegalConsent,
  createUser,
  deleteChatThread,
  deleteCommunity,
  deleteCommunityChallenge,
  deleteCommunityEvent,
  deleteCommunityExpert,
  deleteCommunityResource,
  deleteCreatorVideo,
  deleteExpiredRefreshSessionsByUser,
  deleteExpiredSessionsByUser,
  deleteHighlight,
  deleteLesson,
  deletePasskeyCredentialById,
  deletePillar,
  deletePractice,
  deleteRefreshSessionByTokenHash,
  deleteSessionByTokenHash,
  deleteUserTotpSecret,
  getChatThreadByIdForUser,
  getChatThreadContextByThreadId,
  getCommunityChallenges,
  getCommunityCircles,
  getCommunityEvents,
  getCommunityExperts,
  getCommunityResources,
  getCreatorVideos,
  getUserContentCompletionSummary,
  getActiveEmailVerificationChallengeByCodeHash,
  getActiveEmailVerificationChallengeByTokenHash,
  getLandingContent,
  getLatestEmailVerificationChallengeByUserId,
  getLibraryLessonBySlug,
  getLibraryLessons,
  getPasskeyCredentialByCredentialId,
  getPracticeRoutineBySlug,
  getPracticeRoutines,
  getRefreshSessionContextByTokenHash,
  getSecuritySettingsByUserId,
  getSessionDeviceByTokenHash,
  getSessionUserByTokenHash,
  getUserAuthById,
  getUserNotificationPreferencesByUserId,
  getUserPreferencesByUserId,
  getUserProfileByUserId,
  getUserOnboardingProfile,
  getUserCompanionPreferences,
  getUserTotpSecret,
  getUserByEmail,
  getUserById,
  listChatMessagesForThread,
  listChatThreadsByUser,
  listChatEvents,
  listAdminAuditLogs,
  listAllContentAdmin,
  listRecentContentCompletionsByUser,
  listContentCompletionsByUser,
  listJournalEntriesByUser,
  listNotificationsByUser,
  listPasskeyCredentialsByUserId,
  listPreviewEventsByDays,
  listSystemJobRuns,
  listUserDevicesByUserId,
  markAllNotificationsRead,
  markNotificationRead,
  markUserEmailVerified,
  markUserOnboardingCompleted,
  markUserTotpVerified,
  finishSystemJobRun,
  replaceEmailVerificationChallenge,
  renamePasskeyCredentialById,
  revokeUserDevice,
  rotateRefreshSessionByTokenHash,
  setCommunityChallengeStatus,
  setCommunityEventStatus,
  setCommunityExpertStatus,
  setCommunityResourceStatus,
  setCommunityStatus,
  setCreatorVideoStatus,
  setHighlightStatus,
  setLessonStatus,
  setPillarStatus,
  setPracticeStatus,
  setUserRole,
  setUserMfaEnabled,
  setUserPasskeyEnabled,
  softDeleteUserAndAnonymize,
  trackContentCompletionByUser,
  updateChatThread,
  updateCommunity,
  updateCommunityChallenge,
  updateCommunityEvent,
  updateCommunityExpert,
  updateCommunityResource,
  updateCreatorVideo,
  updateHighlight,
  updateLesson,
  updatePasskeyCredential,
  updatePasskeyCredentialCounter,
  updatePillar,
  updatePractice,
  updateUserName,
  updateUserPasswordHash,
  upsertChatThreadContext,
  upsertUserNotificationPreferences,
  upsertUserDevice,
  upsertUserCompanionPreferences,
  upsertUserOnboardingProfile,
  upsertUserPreferences,
  upsertUserProfile,
  upsertUserTotpSecret,
  type ChatEventType,
  type ChatThreadScope,
  type ChatContextState,
  type AcademyConceptRelationEntityType,
  type ContentStatus,
  type CurrentUser,
  type OnboardingProfileRecord,
  type ReflectionStatus,
} from "@ataraxia/db";
import {
  ReflectionAiService,
  ReflectionProcessingService,
  ReflectionRepository,
  ReflectionService,
  ReflectionStorageService,
  type ReflectionCreateInput,
} from "./reflections/index.js";

const ACCESS_SESSION_TTL_MINUTES = 20;
const REFRESH_SESSION_TTL_DAYS = 30;
const PASSWORD_MIN_LENGTH = 10;
const PASSKEY_CHALLENGE_TTL_MS = 5 * 60 * 1000;

const MODERATION_BLOCKED_WORDS = ["suicide", "kill myself", "bomb", "terrorist", "self-harm"];
const CHAT_WINDOW_MS = 60 * 1000;
const CHAT_MAX_ATTEMPTS = 20;
const PREVIEW_CHAT_WINDOW_MS = 60 * 1000;
const PREVIEW_CHAT_MAX_ATTEMPTS = 6;
const PREVIEW_EVENT_WINDOW_MS = 60 * 1000;
const PREVIEW_EVENT_MAX_ATTEMPTS = 45;
const APPROX_CHARS_PER_TOKEN = 4;
const PREVIEW_CHAT_SYSTEM_PROMPT = `
You are Areti Preview Companion, a concise coach for first-time visitors.
Give practical, calm guidance in 2-5 short paragraphs.
Include:
- one control-vs-no-control distinction
- one concrete action that takes under 10 minutes
- one reflective question
Keep output compact and avoid jargon.
`.trim();
const DEFAULT_CHAT_PROVIDER_ORDER = ["deepseek", "openai"] as const;
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
const DEFAULT_OPENAI_TRANSCRIPTION_MODEL = "gpt-4o-mini-transcribe";
const DEFAULT_REFLECTION_AUDIO_MAX_BYTES = 10 * 1024 * 1024;
const DEFAULT_REFLECTION_STORAGE_RELATIVE_PATH = "data/reflection-audio";
const REFLECTION_ALLOWED_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
] as const;
const DEFAULT_CHAT_GLOBAL_SYSTEM_PROMPT = `
You are Areti Companion, a practical philosophy and psychology coach.
Primary mission: help the user cultivate ataraxia through concrete action.

Core balance:
- Stoicism: clarity about control, virtue, discipline, courage, justice.
- Epicureanism: sustainable pleasure, friendship, simplicity, freedom from unnecessary desire.

Supporting lenses (non-dogmatic):
- Buddhism, Zen, and Dzogchen: awareness, non-attachment, compassion, direct experience.
- Taoist wu-wei: reduce forcing and align with natural constraints.
- Modern psychology and ethics: evidence-aware habits, emotional regulation, relational integrity, long-term character.

Canonical references should be practical, not academic. Prefer short grounded nods to figures like Marcus Aurelius, Epictetus, Seneca, and Epicurus when useful.

Response style:
- concise, clear, anti-jargon, warm but direct
- focus on practical next steps and tradeoffs
- include one concrete action the user can do within 24 hours
- do not pretend certainty; state assumptions when needed

Safety and boundaries:
- Do not provide harmful, illegal, or manipulative guidance.
- For self-harm, crisis, or dangerous situations: prioritize immediate safety, encourage reaching local emergency/crisis support, and avoid philosophical abstraction.
- For medical/legal/financial high-stakes topics: provide general educational framing and suggest qualified professional support for decisions.
`.trim();
const CHAT_TITLE_SYSTEM_PROMPT =
  "You write concise conversation titles. Return only one short title (3-7 words), plain text, no quotes.";
const TOTP_DIGITS = 6;
const TOTP_STEP_SECONDS = 30;
const TOTP_WINDOW_STEPS = 1;
const EMAIL_VERIFICATION_CODE_DIGITS = 6;
const EMAIL_VERIFICATION_TTL_MINUTES = 30;
const EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = 45;
const TERMS_POLICY_VERSION = "2026-03-01";
const PRIVACY_POLICY_VERSION = "2026-03-01";
const DEFAULT_CHAT_CONTEXT_CAPACITY = 24000;
const DEFAULT_CHAT_CONTEXT_SUMMARIZE_PERCENT = 70;
const DEFAULT_CHAT_CONTEXT_WARNING_PERCENT = 85;
const DEFAULT_CHAT_CONTEXT_DEGRADED_PERCENT = 95;
const DEFAULT_CHAT_CONTEXT_RECENT_RAW_MESSAGES = 12;
const CHAT_TOKEN_ESTIMATE_MESSAGE_OVERHEAD = 4;
const CHAT_TOKEN_ESTIMATE_BASE_OVERHEAD = 3;
const CHAT_TOKEN_ESTIMATE_WORD_RATIO = 1.35;
const CHAT_TOKEN_ESTIMATE_PUNCTUATION_RATIO = 0.4;
const CHAT_TOKEN_ESTIMATE_NEWLINE_RATIO = 0.2;
const CHAT_SUMMARY_MAX_CHARS = 5000;
const CHAT_SUMMARIZER_SYSTEM_PROMPT = `
You summarize long conversations for memory retention.
Preserve user goals, constraints, decisions, open questions, and concrete commitments.
Keep a compact, factual tone in plain text.
Do not add facts not present in the transcript.
`.trim();
const CHAT_CONTEXT_MEMORY_PREFIX =
  "Conversation memory summary (earlier turns compressed for token efficiency):";
const CHAT_EVENT_TYPES = [
  "thread_first_message_created",
  "thread_auto_titled",
  "thread_renamed",
  "thread_archived",
  "thread_restored",
  "thread_deleted",
  "thread_branched",
  "thread_branch_auto_asked",
  "message_quoted",
  "message_pinned",
  "message_provider_error",
  "context_auto_summarized",
  "context_manual_summarized",
  "context_warning",
  "context_degraded",
] as const;
const CHAT_MEMORY_EVENT_TYPES = [
  "context_auto_summarized",
  "context_manual_summarized",
  "context_warning",
  "context_degraded",
] as const;

type AuthenticatedRequest = Request & {
  authUser: CurrentUser;
  authAccessToken: string;
};

type ChatModelMessageRole = "system" | "user" | "assistant";

type ChatModelMessage = {
  role: ChatModelMessageRole;
  content: string;
};

type ChatProvider = (typeof DEFAULT_CHAT_PROVIDER_ORDER)[number];

type ChatProviderRuntime = {
  provider: ChatProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
};

type ChatRuntimeConfig = {
  providers: ChatProviderRuntime[];
  globalSystemPrompt: string;
};

type ChatContextRuntimeConfig = {
  capacity: number;
  summarizePercent: number;
  warningPercent: number;
  degradedPercent: number;
  recentRawMessages: number;
};

type ChatThreadContextTelemetry = {
  summarizedMessageCount: number;
  estimatedPromptTokens: number;
  contextCapacity: number;
  usagePercent: number;
  state: ChatContextState;
  autoSummariesCount: number;
  lastSummarizedAt: string | null;
  updatedAt: string;
};

type ProviderFailureDetail = {
  provider: ChatProvider;
  status: number | null;
  reason: string;
};

type EmailTransportMode = "disabled" | "resend" | "smtp";

class ChatProvidersFailedError extends Error {
  constructor(readonly failures: ProviderFailureDetail[]) {
    super("All configured chat providers failed.");
    this.name = "ChatProvidersFailedError";
  }
}

class RouteHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "RouteHttpError";
  }
}

const envSchema = z.object({
  CORS_ORIGINS: z.string().optional(),
  PASSKEY_RP_ID: z.string().optional(),
  PASSKEY_RP_NAME: z.string().optional(),
  PASSKEY_ORIGINS: z.string().optional(),
  CHAT_PROVIDER_ORDER: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().optional(),
  OPENAI_TRANSCRIPTION_MODEL: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_CHAT_MODEL: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().optional(),
  CHAT_GLOBAL_SYSTEM_PROMPT: z.string().optional(),
  CHAT_CONTEXT_CAPACITY: z.string().optional(),
  CHAT_CONTEXT_SUMMARIZE_PERCENT: z.string().optional(),
  CHAT_CONTEXT_WARNING_PERCENT: z.string().optional(),
  CHAT_CONTEXT_DEGRADED_PERCENT: z.string().optional(),
  CHAT_CONTEXT_RECENT_RAW_MESSAGES: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  EMAIL_TRANSPORT: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().optional(),
  WEB_APP_URL: z.string().optional(),
  SIGNUP_ENABLED: z.string().optional(),
  REFLECTION_STORAGE_PATH: z.string().optional(),
  REFLECTION_AUDIO_MAX_BYTES: z.string().optional(),
});

type AppEnv = z.infer<typeof envSchema>;

const authAttemptsByKey = new Map<string, number[]>();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 8;
const chatAttemptsByUser = new Map<string, number[]>();
const previewChatAttemptsByKey = new Map<string, number[]>();
const previewEventAttemptsByKey = new Map<string, number[]>();

const serverFilePath = fileURLToPath(import.meta.url);
const serverDirPath = path.dirname(serverFilePath);
const apiRootPath = path.resolve(serverDirPath, "..");
const repoRootPath = path.resolve(apiRootPath, "..", "..");

function loadOptionalEnvFile(filePath: string): void {
  try {
    process.loadEnvFile(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | undefined)?.code;
    if (code === "ENOENT") {
      return;
    }
    throw error;
  }
}

// Support both package-local and monorepo-root .env files for local dev.
loadOptionalEnvFile(path.join(apiRootPath, ".env"));
loadOptionalEnvFile(path.join(repoRootPath, ".env"));

type PasskeyChallengePurpose = "registration" | "authentication";

type PasskeyChallengeRecord = {
  challenge: string;
  purpose: PasskeyChallengePurpose;
  userId: string;
  expiresAt: number;
};

const passkeyChallenges = new Map<string, PasskeyChallengeRecord>();
const validPasskeyTransports = new Set<AuthenticatorTransportFuture>([
  "ble",
  "cable",
  "hybrid",
  "internal",
  "nfc",
  "smart-card",
  "usb",
]);

function assertWithinAuthRateLimit(key: string): void {
  const now = Date.now();
  const current = authAttemptsByKey.get(key) ?? [];
  const recent = current.filter((timestamp) => now - timestamp <= AUTH_WINDOW_MS);

  if (recent.length >= AUTH_MAX_ATTEMPTS) {
    throw new Error("Too many attempts. Please wait 15 minutes and try again.");
  }

  recent.push(now);
  authAttemptsByKey.set(key, recent);
}

function assertWithinChatRateLimit(userId: string): void {
  const now = Date.now();
  const current = chatAttemptsByUser.get(userId) ?? [];
  const recent = current.filter((timestamp) => now - timestamp <= CHAT_WINDOW_MS);

  if (recent.length >= CHAT_MAX_ATTEMPTS) {
    throw new Error("Too many chat requests. Please wait a moment and try again.");
  }

  recent.push(now);
  chatAttemptsByUser.set(userId, recent);
}

function assertWithinPreviewChatRateLimit(key: string): void {
  const now = Date.now();
  const current = previewChatAttemptsByKey.get(key) ?? [];
  const recent = current.filter((timestamp) => now - timestamp <= PREVIEW_CHAT_WINDOW_MS);

  if (recent.length >= PREVIEW_CHAT_MAX_ATTEMPTS) {
    throw new Error("Too many preview chat requests. Please wait a minute and try again.");
  }

  recent.push(now);
  previewChatAttemptsByKey.set(key, recent);
}

function assertWithinPreviewEventRateLimit(key: string): void {
  const now = Date.now();
  const current = previewEventAttemptsByKey.get(key) ?? [];
  const recent = current.filter((timestamp) => now - timestamp <= PREVIEW_EVENT_WINDOW_MS);

  if (recent.length >= PREVIEW_EVENT_MAX_ATTEMPTS) {
    throw new Error("Too many preview analytics events. Please wait and retry.");
  }

  recent.push(now);
  previewEventAttemptsByKey.set(key, recent);
}

function base32Encode(buffer: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  let output = "";

  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;

    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += alphabet[(value << (5 - bits)) & 31];
  }

  return output;
}

function base32Decode(input: string): Buffer {
  const normalized = input.toUpperCase().replace(/=+$/g, "");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0;
  let value = 0;
  const output: number[] = [];

  for (const char of normalized) {
    const idx = alphabet.indexOf(char);
    if (idx < 0) {
      continue;
    }

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      output.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(output);
}

function generateTotpSecret(): string {
  return base32Encode(randomBytes(20));
}

function generateTotpCode(secretBase32: string, unixSeconds: number): string {
  const counter = Math.floor(unixSeconds / TOTP_STEP_SECONDS);
  const counterBytes = Buffer.alloc(8);
  counterBytes.writeBigUInt64BE(BigInt(counter), 0);

  const key = base32Decode(secretBase32);
  const digest = createHmac("sha1", key).update(counterBytes).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const otp = binary % 10 ** TOTP_DIGITS;
  return otp.toString().padStart(TOTP_DIGITS, "0");
}

function verifyTotpCode(secretBase32: string, code: string, nowSeconds = Date.now() / 1000): boolean {
  if (!/^\d{6}$/.test(code)) {
    return false;
  }

  for (let offset = -TOTP_WINDOW_STEPS; offset <= TOTP_WINDOW_STEPS; offset += 1) {
    const validCode = generateTotpCode(secretBase32, nowSeconds + offset * TOTP_STEP_SECONDS);
    if (validCode === code) {
      return true;
    }
  }

  return false;
}

function buildDeviceContext(request: Request): {
  fingerprint: string;
  label: string;
  ipAddress: string;
  userAgent: string;
} {
  const userAgent = request.header("user-agent")?.slice(0, 255) ?? "Unknown User Agent";
  const ipAddress = getIpAddress(request);
  const fingerprint = createHash("sha256")
    .update(`${userAgent}|${ipAddress}`)
    .digest("hex");
  const label = userAgent.split(" ").slice(0, 3).join(" ").slice(0, 120);

  return {
    fingerprint,
    label: label.length > 0 ? label : "Unknown Device",
    ipAddress,
    userAgent,
  };
}

function normalizePasskeyTransports(transports: unknown): AuthenticatorTransportFuture[] {
  if (!Array.isArray(transports)) {
    return [];
  }

  return transports.filter(
    (transport): transport is AuthenticatorTransportFuture =>
      typeof transport === "string" &&
      validPasskeyTransports.has(transport as AuthenticatorTransportFuture),
  );
}

function purgeExpiredPasskeyChallenges(): void {
  const now = Date.now();

  for (const [challengeId, record] of passkeyChallenges.entries()) {
    if (record.expiresAt <= now) {
      passkeyChallenges.delete(challengeId);
    }
  }
}

function createPasskeyChallenge(input: {
  challenge: string;
  purpose: PasskeyChallengePurpose;
  userId: string;
}): string {
  purgeExpiredPasskeyChallenges();

  const challengeId = randomUUID();

  passkeyChallenges.set(challengeId, {
    challenge: input.challenge,
    purpose: input.purpose,
    userId: input.userId,
    expiresAt: Date.now() + PASSKEY_CHALLENGE_TTL_MS,
  });

  return challengeId;
}

function consumePasskeyChallenge(input: {
  challengeId: string;
  purpose: PasskeyChallengePurpose;
  userId?: string;
}): PasskeyChallengeRecord | null {
  const existing = passkeyChallenges.get(input.challengeId);

  if (!existing) {
    return null;
  }

  if (existing.expiresAt <= Date.now()) {
    passkeyChallenges.delete(input.challengeId);
    return null;
  }

  if (existing.purpose !== input.purpose) {
    return null;
  }

  if (input.userId && existing.userId !== input.userId) {
    return null;
  }

  passkeyChallenges.delete(input.challengeId);
  return existing;
}

function nowPlusMinutesIso(minutes: number): string {
  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + minutes);
  return expires.toISOString();
}

function nowPlusDaysIso(days: number): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires.toISOString();
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function createOpaqueToken(): string {
  return randomBytes(32).toString("hex");
}

function createEmailVerificationCode(): string {
  const upperBound = 10 ** EMAIL_VERIFICATION_CODE_DIGITS;
  const numeric = Math.floor(Math.random() * upperBound);
  return numeric.toString().padStart(EMAIL_VERIFICATION_CODE_DIGITS, "0");
}

function formatOnboardingContext(profile: OnboardingProfileRecord | null): string {
  if (!profile) {
    return "";
  }

  const lines = [
    `Current intention: ${profile.primaryObjective}`,
    `Daily time available: ${profile.dailyTimeCommitment}`,
    `Preferred first step: ${profile.preferredPracticeFormat}`,
  ];

  if (profile.notes?.trim()) {
    lines.push(`Additional context: ${profile.notes.trim()}`);
  }

  return lines.join("\n");
}

function getIpAddress(request: Request): string {
  const forwardedFor = request.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string") {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  if (Array.isArray(forwardedFor) && forwardedFor.length > 0) {
    return forwardedFor[0] ?? "unknown";
  }

  return request.headers["x-real-ip"]?.toString() ?? "unknown";
}

function authKey(intent: "signin" | "signup", request: Request, email: string): string {
  return `${intent}:${getIpAddress(request)}:${email.toLowerCase()}`;
}

function previewClientKey(request: Request): string {
  const ipAddress = getIpAddress(request);
  const userAgent = request.header("user-agent")?.slice(0, 200) ?? "unknown-agent";
  return createHash("sha256").update(`${ipAddress}|${userAgent}`).digest("hex");
}

function deriveSignupDisplayName(email: string): string {
  const localPart = email.split("@")[0] ?? "";
  const normalized = localPart
    .replace(/[._-]+/g, " ")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return "Member";
  }

  const titleCase = normalized
    .split(" ")
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1).toLowerCase())
    .join(" ")
    .trim();

  if (titleCase.length < 2) {
    return "Member";
  }

  return titleCase.slice(0, 80);
}

function getBearerToken(request: Request): string | null {
  const authHeader = request.header("authorization") ?? "";

  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  return token.length > 0 ? token : null;
}

function requireAuth(request: Request, response: Response, next: NextFunction): void {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = getSessionUserByTokenHash(hashToken(accessToken));

  if (!user) {
    response.status(401).json({ error: "Unauthorized" });
    return;
  }

  (request as AuthenticatedRequest).authUser = user;
  (request as AuthenticatedRequest).authAccessToken = accessToken;
  next();
}

function requireAdmin(request: Request, response: Response, next: NextFunction): void {
  const authRequest = request as AuthenticatedRequest;

  if (authRequest.authUser.role !== "ADMIN") {
    response.status(403).json({ error: "Admin access required" });
    return;
  }

  next();
}

function auditAdminAction(
  authRequest: AuthenticatedRequest,
  action: string,
  entityType: string,
  entityId: string | null,
  payload: unknown,
): void {
  createAdminAuditLog({
    id: randomUUID(),
    adminUserId: authRequest.authUser.id,
    action,
    entityType,
    entityId,
    payloadJson: JSON.stringify(payload),
  });
}

async function createAuthTokenPair(userId: string, deviceId?: string | null) {
  const accessToken = createOpaqueToken();
  const refreshToken = createOpaqueToken();

  deleteExpiredSessionsByUser(userId);
  deleteExpiredRefreshSessionsByUser(userId);

  createSession({
    id: randomUUID(),
    tokenHash: hashToken(accessToken),
    userId,
    deviceId: deviceId ?? null,
    expiresAt: nowPlusMinutesIso(ACCESS_SESSION_TTL_MINUTES),
  });

  createRefreshSession({
    id: randomUUID(),
    tokenHash: hashToken(refreshToken),
    userId,
    deviceId: deviceId ?? null,
    expiresAt: nowPlusDaysIso(REFRESH_SESSION_TTL_DAYS),
  });

  return {
    accessToken,
    refreshToken,
  };
}

function moderatePrompt(prompt: string): string | null {
  const normalized = prompt.toLowerCase();

  if (prompt.length > 800) {
    return "Prompt is too long.";
  }

  for (const blocked of MODERATION_BLOCKED_WORDS) {
    if (normalized.includes(blocked)) {
      return "Prompt violates safety policy.";
    }
  }

  return null;
}

function fallbackChatAnswer(prompt: string): string {
  const normalized = prompt.toLowerCase();

  if (normalized.includes("anx") || normalized.includes("stress") || normalized.includes("fear")) {
    return "Start with the Stoic split: what is in your control right now? Take one concrete action there. Then apply Epicurean simplicity: remove one unnecessary demand. End with a Taoist reset: relax force and move with the smallest natural step.";
  }

  if (normalized.includes("habit") || normalized.includes("discipline") || normalized.includes("routine")) {
    return "Use a two-layer routine: Stoic commitment (tiny non-negotiable action) plus Epicurean pleasure (make the routine genuinely enjoyable). Track resistance with non-judgmental awareness.";
  }

  if (normalized.includes("relationship") || normalized.includes("love") || normalized.includes("friend")) {
    return "Lead with Epicurean friendship as a core good, then apply Stoic virtue in speech: honesty, justice, and restraint. Add a Taoist principle: avoid over-controlling people and protect relational flow.";
  }

  return `Balanced guidance: choose virtue for decisions (Stoicism), choose sustainable pleasure and friendship (Epicureanism), reduce attachment to outcomes (Buddhism), and avoid forcing what can be guided softly (Taoism). Apply one principle in the next 24 hours. Prompt: "${prompt}".`;
}

function fallbackThreadTitle(prompt: string): string {
  const cleaned = prompt
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?.!,;:]+$/g, "");

  if (!cleaned) {
    return "New conversation";
  }

  const words = cleaned.split(" ").filter(Boolean).slice(0, 7);
  const title = words.join(" ").trim();
  if (!title) {
    return "New conversation";
  }

  return title.length > 120 ? title.slice(0, 120).trim() : title;
}

function estimateApproxTokens(value: string): number {
  const normalized = value.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return 0;
  }

  const charEstimate = Math.ceil(normalized.length / APPROX_CHARS_PER_TOKEN);
  const wordCount = (normalized.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? []).length;
  const punctuationCount = (normalized.match(/[^\p{L}\p{N}\s]/gu) ?? []).length;
  const cjkCount =
    (
      normalized.match(
        /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu,
      ) ?? []
    ).length;
  const newlineCount = (normalized.match(/\n/g) ?? []).length;

  const wordEstimate = Math.ceil(wordCount * CHAT_TOKEN_ESTIMATE_WORD_RATIO);
  const punctuationEstimate = Math.ceil(
    punctuationCount * CHAT_TOKEN_ESTIMATE_PUNCTUATION_RATIO,
  );
  const newlineEstimate = Math.ceil(newlineCount * CHAT_TOKEN_ESTIMATE_NEWLINE_RATIO);
  const blendedEstimate = wordEstimate + punctuationEstimate + newlineEstimate;

  return Math.max(1, charEstimate, wordEstimate, cjkCount, blendedEstimate);
}

function clipToApproxTokenLimit(value: string, maxTokens: number): string {
  if (estimateApproxTokens(value) <= maxTokens) {
    return value;
  }

  let low = 0;
  let high = value.length;
  let best = "";

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const candidate = value.slice(0, mid).trimEnd();
    const estimate = estimateApproxTokens(candidate);

    if (estimate <= maxTokens) {
      best = candidate;
      low = mid + 1;
      continue;
    }

    high = mid - 1;
  }

  if (!best) {
    return "...";
  }

  return `${best}...`;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function estimatePromptTokensForMessages(messages: ChatModelMessage[]): number {
  return messages.reduce((sum, message) => {
    return sum + estimateApproxTokens(message.content) + CHAT_TOKEN_ESTIMATE_MESSAGE_OVERHEAD;
  }, CHAT_TOKEN_ESTIMATE_BASE_OVERHEAD);
}

function computeContextUsagePercent(estimatedPromptTokens: number, contextCapacity: number): number {
  if (contextCapacity <= 0) {
    return 100;
  }
  return Math.max(0, Math.min(100, Math.round((estimatedPromptTokens / contextCapacity) * 100)));
}

function deriveChatContextState(
  usagePercent: number,
  contextConfig: ChatContextRuntimeConfig,
): ChatContextState {
  if (usagePercent >= contextConfig.degradedPercent) {
    return "degraded";
  }
  if (usagePercent >= contextConfig.warningPercent) {
    return "warning";
  }
  return "ok";
}

function buildFallbackConversationSummary(
  existingSummary: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
): string {
  const nextLines = messages
    .map((message) => {
      const normalized = normalizeWhitespace(message.content);
      if (!normalized) {
        return null;
      }
      const prefix = message.role === "user" ? "User" : "Assistant";
      return `${prefix}: ${normalized.slice(0, 220)}`;
    })
    .filter((line): line is string => Boolean(line))
    .slice(0, 16);

  const previous = normalizeWhitespace(existingSummary);
  const sections: string[] = [];
  if (previous) {
    sections.push(`Previous memory: ${previous.slice(0, 1500)}`);
  }

  if (nextLines.length > 0) {
    sections.push(`Compressed turns:\n- ${nextLines.join("\n- ")}`);
  }

  const fallback = sections.join("\n\n").trim();
  if (!fallback) {
    return previous.slice(0, CHAT_SUMMARY_MAX_CHARS);
  }

  return fallback.slice(0, CHAT_SUMMARY_MAX_CHARS).trim();
}

async function summarizeConversationMemory(input: {
  existingSummary: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  chatConfig: ChatRuntimeConfig;
}): Promise<string> {
  if (input.messages.length === 0) {
    return normalizeWhitespace(input.existingSummary).slice(0, CHAT_SUMMARY_MAX_CHARS);
  }

  const transcript = input.messages
    .map((message) => {
      const speaker = message.role === "user" ? "User" : "Assistant";
      return `${speaker}: ${normalizeWhitespace(message.content)}`;
    })
    .join("\n")
    .slice(0, 12000);

  const userPrompt = `
Existing summary:
${input.existingSummary.trim() || "(none)"}

Transcript segment to compress:
${transcript}

Create an updated merged memory summary in plain text.
Include:
- user goals and constraints
- commitments and concrete actions
- unresolved questions
- any key personal preferences/context
Keep it compact and factual.
`.trim();

  if (input.chatConfig.providers.length > 0) {
    for (const provider of input.chatConfig.providers) {
      const { answer } = await resolveProviderAnswer(
        [
          { role: "system", content: CHAT_SUMMARIZER_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        provider,
        { temperature: 0.2, maxTokens: 420 },
      );
      if (answer && answer.trim().length > 0) {
        return answer.trim().slice(0, CHAT_SUMMARY_MAX_CHARS);
      }
    }
  }

  return buildFallbackConversationSummary(input.existingSummary, input.messages);
}

function composeEffectiveSystemPrompt(
  globalPrompt: string,
  customInstructions: string,
  onboardingContext: string,
): string {
  const trimmedCustom = customInstructions.trim();
  const trimmedOnboardingContext = onboardingContext.trim();
  const sections = [globalPrompt];

  if (trimmedOnboardingContext) {
    sections.push(`
User onboarding profile context:
${trimmedOnboardingContext}`.trim());
  }

  if (trimmedCustom) {
    sections.push(`
User-specific customization (apply only if it does not conflict with safety or mission):
${trimmedCustom}`.trim());
  }

  return sections.join("\n\n").trim();
}

function normalizeGeneratedThreadTitle(rawTitle: string): string | null {
  const stripped = rawTitle
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[?.!,;:]+$/g, "");

  if (stripped.length < 3) {
    return null;
  }

  return stripped.length > 120 ? stripped.slice(0, 120).trim() : stripped;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function normalizeWebAppUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function parseChatProviderOrder(rawOrder?: string): ChatProvider[] {
  const parsed = (rawOrder ?? DEFAULT_CHAT_PROVIDER_ORDER.join(","))
    .split(",")
    .map((provider) => provider.trim().toLowerCase())
    .filter((provider): provider is ChatProvider =>
      provider === "deepseek" || provider === "openai",
    );

  if (parsed.length === 0) {
    return [...DEFAULT_CHAT_PROVIDER_ORDER];
  }

  return parsed.filter((provider, index) => parsed.indexOf(provider) === index);
}

type DashboardProgress = {
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

type RewardMilestone = {
  id: string;
  title: string;
  description: string;
  earned: boolean;
};

type RewardsProgress = {
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
  milestones: RewardMilestone[];
};

function toUtcDayStart(dateValue: Date): number {
  return Date.UTC(dateValue.getUTCFullYear(), dateValue.getUTCMonth(), dateValue.getUTCDate());
}

function dayDiffFromNow(isoTimestamp: string): number {
  const now = new Date();
  const todayStart = toUtcDayStart(now);
  const source = new Date(isoTimestamp);
  const sourceStart = toUtcDayStart(source);
  return Math.max(0, Math.floor((todayStart - sourceStart) / (24 * 60 * 60 * 1000)));
}

function computeDashboardProgress(entries: Array<{ createdAt: string }>): DashboardProgress {
  if (entries.length === 0) {
    return {
      streakDays: 0,
      reflectionsThisWeek: 0,
      daysSinceLastEntry: null,
      practicesCompletedThisWeek: 0,
      lessonsCompleted: 0,
      totalLessons: 0,
      recentCompletions: [],
    };
  }

  const daysSinceLastEntry = dayDiffFromNow(entries[0].createdAt);
  const reflectionsThisWeek = entries.filter((entry) => dayDiffFromNow(entry.createdAt) <= 6).length;

  const uniqueDays = Array.from(
    new Set(entries.map((entry) => new Date(entry.createdAt).toISOString().slice(0, 10))),
  );

  let streakDays = 0;
  if (daysSinceLastEntry <= 1) {
    streakDays = 1;
    for (let index = 1; index < uniqueDays.length; index += 1) {
      const previousDay = new Date(`${uniqueDays[index - 1]}T00:00:00.000Z`);
      const currentDay = new Date(`${uniqueDays[index]}T00:00:00.000Z`);
      const diffDays = Math.round((toUtcDayStart(previousDay) - toUtcDayStart(currentDay)) / (24 * 60 * 60 * 1000));

      if (diffDays !== 1) {
        break;
      }

      streakDays += 1;
    }
  }

  return {
    streakDays,
    reflectionsThisWeek,
    daysSinceLastEntry,
    practicesCompletedThisWeek: 0,
    lessonsCompleted: 0,
    totalLessons: 0,
    recentCompletions: [],
  };
}

function slugToTitle(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildRewardsProgress(input: {
  entriesCount: number;
  streakDays: number;
  lessonsCompleted: number;
  completionRows: Array<{
    contentKind: "lesson" | "practice";
    completionCount: number;
    contentSlug: string;
  }>;
}): RewardsProgress {
  const reflections = Math.max(0, input.entriesCount);
  const streakDays = Math.max(0, input.streakDays);
  const lessonsCompleted = Math.max(0, input.lessonsCompleted);
  const practiceRuns = input.completionRows
    .filter((item) => item.contentKind === "practice")
    .reduce((acc, item) => acc + Math.max(0, item.completionCount), 0);
  const distinctCompletions = new Set(
    input.completionRows.map((item) => `${item.contentKind}:${item.contentSlug}`),
  ).size;

  const milestones: RewardMilestone[] = [
    {
      id: "first-reflection",
      title: "First Reflection",
      description: "Log your first journal entry.",
      earned: reflections >= 1,
    },
    {
      id: "streak-3",
      title: "3-Day Streak",
      description: "Keep your reflection streak for at least 3 days.",
      earned: streakDays >= 3,
    },
    {
      id: "streak-7",
      title: "7-Day Streak",
      description: "Hold momentum for a full week.",
      earned: streakDays >= 7,
    },
    {
      id: "lesson-1",
      title: "Lesson Starter",
      description: "Complete your first library lesson.",
      earned: lessonsCompleted >= 1,
    },
    {
      id: "lesson-3",
      title: "Scholar",
      description: "Complete 3 library lessons.",
      earned: lessonsCompleted >= 3,
    },
    {
      id: "practice-3",
      title: "Practitioner",
      description: "Complete 3 practices.",
      earned: practiceRuns >= 3,
    },
    {
      id: "consistency-5",
      title: "Consistency Builder",
      description: "Complete 5 distinct lessons/practices.",
      earned: distinctCompletions >= 5,
    },
  ];

  const earnedCount = milestones.filter((item) => item.earned).length;
  const nextMilestone = milestones.find((item) => !item.earned) ?? null;

  return {
    earnedCount,
    totalCount: milestones.length,
    nextMilestone: nextMilestone
      ? {
          id: nextMilestone.id,
          title: nextMilestone.title,
          description: nextMilestone.description,
        }
      : null,
    signals: {
      streakDays,
      reflections,
      lessonsCompleted,
      practiceRuns,
      distinctCompletions,
    },
    milestones,
  };
}

function maybeCreateBehaviorNotification(input: {
  userId: string;
  title: string;
  body: string;
  href: string;
  dedupeWithinHours?: number;
}): void {
  createNotificationIfRecentDuplicateAbsent({
    id: randomUUID(),
    userId: input.userId,
    title: input.title,
    body: input.body,
    href: input.href,
    dedupeWithinHours: input.dedupeWithinHours,
  });
}

function createChatRuntimeConfig(env: AppEnv): ChatRuntimeConfig {
  const providerOrder = parseChatProviderOrder(env.CHAT_PROVIDER_ORDER);
  const providerConfigs: Record<ChatProvider, ChatProviderRuntime | null> = {
    deepseek: env.DEEPSEEK_API_KEY
      ? {
          provider: "deepseek",
          apiKey: env.DEEPSEEK_API_KEY,
          baseUrl: normalizeBaseUrl(env.DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL),
          model: env.DEEPSEEK_CHAT_MODEL ?? DEFAULT_DEEPSEEK_MODEL,
        }
      : null,
    openai: env.OPENAI_API_KEY
      ? {
          provider: "openai",
          apiKey: env.OPENAI_API_KEY,
          baseUrl: normalizeBaseUrl(env.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL),
          model: env.OPENAI_CHAT_MODEL ?? DEFAULT_OPENAI_MODEL,
        }
      : null,
  };

  const providers = providerOrder
    .map((provider) => providerConfigs[provider])
    .filter((provider): provider is ChatProviderRuntime => provider !== null);

  return {
    providers,
    globalSystemPrompt:
      env.CHAT_GLOBAL_SYSTEM_PROMPT?.trim() || DEFAULT_CHAT_GLOBAL_SYSTEM_PROMPT,
  };
}

function parseBoundedInteger(
  raw: string | undefined,
  fallback: number,
  limits: { min: number; max: number },
): number {
  if (!raw || raw.trim().length === 0) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(limits.min, Math.min(limits.max, parsed));
}

function createChatContextRuntimeConfig(env: AppEnv): ChatContextRuntimeConfig {
  const capacity = parseBoundedInteger(env.CHAT_CONTEXT_CAPACITY, DEFAULT_CHAT_CONTEXT_CAPACITY, {
    min: 512,
    max: 200000,
  });
  const summarizePercent = parseBoundedInteger(
    env.CHAT_CONTEXT_SUMMARIZE_PERCENT,
    DEFAULT_CHAT_CONTEXT_SUMMARIZE_PERCENT,
    { min: 20, max: 95 },
  );
  const warningPercentRaw = parseBoundedInteger(
    env.CHAT_CONTEXT_WARNING_PERCENT,
    DEFAULT_CHAT_CONTEXT_WARNING_PERCENT,
    { min: 30, max: 98 },
  );
  const warningPercent = Math.max(summarizePercent + 1, warningPercentRaw);
  const degradedPercentRaw = parseBoundedInteger(
    env.CHAT_CONTEXT_DEGRADED_PERCENT,
    DEFAULT_CHAT_CONTEXT_DEGRADED_PERCENT,
    { min: 40, max: 99 },
  );
  const degradedPercent = Math.max(warningPercent + 1, degradedPercentRaw);
  const recentRawMessages = parseBoundedInteger(
    env.CHAT_CONTEXT_RECENT_RAW_MESSAGES,
    DEFAULT_CHAT_CONTEXT_RECENT_RAW_MESSAGES,
    { min: 4, max: 40 },
  );

  return {
    capacity,
    summarizePercent,
    warningPercent: Math.min(warningPercent, 98),
    degradedPercent: Math.min(degradedPercent, 99),
    recentRawMessages,
  };
}

type ChatCompletionPayload = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ text?: string; type?: string }>;
    };
  }>;
};

function extractAssistantMessage(payload: ChatCompletionPayload): string | null {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!Array.isArray(content)) {
    return null;
  }

  const text = content
    .filter((part): part is { text: string } => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join("\n")
    .trim();

  return text.length > 0 ? text : null;
}

async function resolveProviderAnswer(
  messages: ChatModelMessage[],
  provider: ChatProviderRuntime,
  options?: {
    temperature?: number;
    maxTokens?: number;
  },
): Promise<{
  answer: string | null;
  failure?: ProviderFailureDetail;
}> {
  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages,
        temperature: options?.temperature ?? 0.6,
        max_tokens: options?.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(
        `[chat] Provider "${provider.provider}" failed with status ${response.status}. ${errorBody.slice(0, 300)}`,
      );
      return {
        answer: null,
        failure: {
          provider: provider.provider,
          status: response.status,
          reason: errorBody.slice(0, 300) || "Provider returned non-OK response",
        },
      };
    }

    const payload = (await response.json()) as ChatCompletionPayload;
    return { answer: extractAssistantMessage(payload) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.warn(
      `[chat] Provider "${provider.provider}" request error: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
    return {
      answer: null,
      failure: {
        provider: provider.provider,
        status: null,
        reason: message,
      },
    };
  }
}

function getLatestUserPrompt(messages: ChatModelMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const candidate = messages[index];
    if (candidate?.role === "user" && candidate.content.trim().length > 0) {
      return candidate.content.trim();
    }
  }
  return "";
}

async function resolveChatAnswer(
  messages: ChatModelMessage[],
  chatConfig: ChatRuntimeConfig,
  options?: {
    maxTokens?: number;
  },
): Promise<string> {
  const prompt = getLatestUserPrompt(messages);

  if (chatConfig.providers.length === 0) {
    return fallbackChatAnswer(prompt);
  }

  const failures: ProviderFailureDetail[] = [];

  for (const provider of chatConfig.providers) {
    const { answer, failure } = await resolveProviderAnswer(messages, provider, {
      maxTokens: options?.maxTokens,
    });
    if (answer) {
      return answer;
    }

    if (failure) {
      failures.push(failure);
    }
  }

  throw new ChatProvidersFailedError(failures);
}

async function resolveChatThreadTitle(
  prompt: string,
  answer: string,
  chatConfig: ChatRuntimeConfig,
): Promise<string> {
  const fallback = fallbackThreadTitle(prompt);

  if (chatConfig.providers.length === 0) {
    return fallback;
  }

  const titlePrompt = `User prompt:\n${prompt}\n\nAssistant reply:\n${answer}\n\nGenerate the best short title for this conversation.`;

  for (const provider of chatConfig.providers) {
    const { answer: candidate } = await resolveProviderAnswer(
      [
        { role: "system", content: CHAT_TITLE_SYSTEM_PROMPT },
        { role: "user", content: titlePrompt },
      ],
      provider,
      {
      temperature: 0.2,
      },
    );
    if (!candidate) {
      continue;
    }

    const normalized = normalizeGeneratedThreadTitle(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return fallback;
}

const signupSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(120),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/\d/),
    acceptLegal: z.boolean().optional(),
    acceptTerms: z.boolean().optional(),
    acceptPrivacy: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasUnifiedConsent = data.acceptLegal === true;
    const hasLegacyConsent = data.acceptTerms === true && data.acceptPrivacy === true;

    if (!hasUnifiedConsent && !hasLegacyConsent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Legal consent is required.",
        path: ["acceptLegal"],
      });
    }
  });

const verifyEmailSchema = z
  .object({
    token: z.string().trim().min(16).optional(),
    email: z.string().trim().toLowerCase().email().max(120).optional(),
    code: z.string().trim().regex(/^\d{6}$/).optional(),
  })
  .refine(
    (data) =>
      Boolean(data.token) ||
      (typeof data.email === "string" &&
        data.email.length > 0 &&
        typeof data.code === "string" &&
        data.code.length > 0),
    {
      message: "Provide either token or email + code.",
    },
  );

const resendVerificationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
});

const signinSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1),
  mfaChallengeId: z.union([z.literal("totp"), z.string().uuid()]).optional(),
  mfaCode: z.string().trim().length(6).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(16),
});

const accountProfilePatchSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .nullable()
    .optional(),
  summary: z.string().trim().max(2000).optional(),
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
  country: z.string().trim().max(80).optional(),
  socialLinks: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(40),
        url: z.string().trim().url().max(300),
      }),
    )
    .max(20)
    .optional(),
});

const accountPreferencesPatchSchema = z.object({
  language: z.string().trim().min(2).max(16).optional(),
  timezone: z.string().trim().min(2).max(80).optional(),
  profileVisibility: z.enum(["public", "private", "contacts"]).optional(),
  showEmail: z.boolean().optional(),
  showPhone: z.boolean().optional(),
  allowContact: z.boolean().optional(),
});

const authMePatchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  profile: accountProfilePatchSchema.optional(),
  preferences: accountPreferencesPatchSchema.optional(),
});

const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/\d/),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

const deleteAccountSchema = z.object({
  emailConfirm: z.string().trim().toLowerCase().email().max(120),
  passwordConfirm: z.string().min(1),
});

const notificationPreferencesPatchSchema = z.object({
  emailChallenges: z.boolean().optional(),
  emailEvents: z.boolean().optional(),
  emailUpdates: z.boolean().optional(),
  emailMarketing: z.boolean().optional(),
  pushChallenges: z.boolean().optional(),
  pushEvents: z.boolean().optional(),
  pushUpdates: z.boolean().optional(),
  digest: z.enum(["immediate", "daily", "weekly"]).optional(),
});

const passkeyAuthOptionsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
});

const passkeyVerifySchema = z.object({
  challengeId: z.string().uuid(),
  response: z.object({ id: z.string().min(1) }).passthrough(),
});

const journalSchema = z.object({
  title: z.string().trim().min(3).max(80),
  body: z.string().trim().min(10).max(3000),
  mood: z.string().trim().min(2).max(32),
});

const reflectionAudioPayloadSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.string().trim().min(3).max(120),
  base64Data: z.string().trim().min(24).max(16 * 1024 * 1024),
  durationSeconds: z.coerce.number().min(0).max(24 * 60 * 60).optional(),
});

const reflectionCreateSchema = z
  .object({
    sourceType: z.enum(["voice", "upload", "text"]),
    title: z.string().trim().min(2).max(90).optional(),
    rawText: z.string().trim().min(1).max(15000).optional(),
    tags: z.array(z.string().trim().min(1).max(32)).max(16).optional(),
    language: z.string().trim().min(2).max(16).optional(),
    commentaryMode: z.string().trim().min(1).max(40).nullable().optional(),
    audio: reflectionAudioPayloadSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType === "text" && !value.rawText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "rawText is required for text reflections",
        path: ["rawText"],
      });
    }

    if ((value.sourceType === "voice" || value.sourceType === "upload") && !value.audio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "audio payload is required for voice/upload reflections",
        path: ["audio"],
      });
    }
  });

const reflectionPatchSchema = z.object({
  title: z.string().trim().min(2).max(90).optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(16).optional(),
  isFavorite: z.boolean().optional(),
  refinedText: z.string().trim().min(1).max(20000).optional(),
});

const contentCompletionSchema = z.object({
  contentKind: z.enum(["lesson", "practice"]),
  contentSlug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(140)
    .regex(/^[a-z0-9-]+$/),
});

const statusSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const securityToggleSchema = z.object({
  enabled: z.boolean(),
});

const integerIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const chatSchema = z.object({
  prompt: z.string().trim().min(3).max(800),
});

const previewChatSchema = z.object({
  prompt: z.string().trim().min(3).max(320),
  maxResponseTokens: z.coerce.number().int().min(24).max(120).optional(),
  honeypot: z.string().max(0).optional(),
  interactionMs: z.coerce.number().int().min(700).max(120000).optional(),
});

const previewEventSchema = z.object({
  sessionId: z.string().trim().min(8).max(72),
  eventType: z.enum([
    "preview_page_view",
    "preview_signup_click",
    "preview_signup_view",
    "preview_chat_prompt_submitted",
    "preview_chat_response_received",
  ]),
  path: z.string().trim().min(1).max(200).default("/preview"),
  referrer: z.string().trim().min(1).max(300).optional(),
  metadata: z.record(z.string(), z.string().max(120)).optional(),
  honeypot: z.string().max(0).optional(),
  interactionMs: z.coerce.number().int().min(700).max(120000).optional(),
});

const lessonSchema = z.object({
  slug: z.string().trim().min(3).max(80),
  title: z.string().trim().min(3).max(140),
  tradition: z.string().trim().min(2).max(80),
  level: z.string().trim().min(2).max(40),
  minutes: z.coerce.number().int().positive().max(300),
  summary: z.string().trim().min(8).max(500),
  content: z.string().trim().min(32).max(8000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const practiceSchema = z.object({
  slug: z.string().trim().min(3).max(80),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(8).max(500),
  cadence: z.string().trim().min(3).max(80),
  protocol: z.string().trim().min(32).max(8000),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const communitySchema = z.object({
  slug: z.string().trim().min(3).max(80),
  name: z.string().trim().min(3).max(140),
  focus: z.string().trim().min(8).max(500),
  schedule: z.string().trim().min(3).max(80),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const challengeSchema = z.object({
  slug: z.string().trim().min(3).max(80),
  title: z.string().trim().min(3).max(140),
  duration: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(8).max(500),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const resourceSchema = z.object({
  slug: z.string().trim().min(3).max(80),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(8).max(500),
  href: z.string().trim().min(1).max(500),
  cta: z.string().trim().min(2).max(80),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const expertSchema = z.object({
  slug: z.string().trim().min(3).max(80),
  name: z.string().trim().min(3).max(140),
  focus: z.string().trim().min(8).max(500),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const eventSchema = z.object({
  slug: z.string().trim().min(3).max(80),
  title: z.string().trim().min(3).max(140),
  schedule: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(8).max(500),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const videoSchema = z.object({
  slug: z.string().trim().min(3).max(80),
  title: z.string().trim().min(3).max(140),
  format: z.string().trim().min(2).max(80),
  summary: z.string().trim().min(8).max(500),
  videoUrl: z.string().trim().url().max(500),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const pillarSchema = z.object({
  slug: z.string().trim().min(3).max(80),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(8).max(300),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const highlightSchema = z.object({
  slug: z.string().trim().min(3).max(80),
  description: z.string().trim().min(8).max(300),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const academySlugParamSchema = z.object({
  slug: z.string().trim().min(2).max(140),
});

const academySearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(120),
  limit: z.coerce.number().int().positive().max(120).default(40),
});

const academyDomainsQuerySchema = z.object({
  q: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(200).default(200),
});

const academyTraditionsQuerySchema = z.object({
  domainId: z.coerce.number().int().positive().optional(),
  domain: z.string().trim().min(1).max(80).optional(),
  parentTraditionId: z.coerce.number().int().positive().optional(),
  q: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(200).default(200),
});

const academyPersonsQuerySchema = z.object({
  domainId: z.coerce.number().int().positive().optional(),
  traditionId: z.coerce.number().int().positive().optional(),
  credibilityBand: z.string().trim().min(1).max(80).optional(),
  q: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(200).default(200),
});

const academyWorksQuerySchema = z.object({
  personId: z.coerce.number().int().positive().optional(),
  traditionId: z.coerce.number().int().positive().optional(),
  isPrimaryText: z.coerce.boolean().optional(),
  q: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(200).default(200),
});

const academyConceptsQuerySchema = z.object({
  family: z.string().trim().min(1).max(80).optional(),
  traditionId: z.coerce.number().int().positive().optional(),
  personId: z.coerce.number().int().positive().optional(),
  workId: z.coerce.number().int().positive().optional(),
  q: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(200).default(200),
});

const academyPathsQuerySchema = z.object({
  featured: z.coerce.boolean().optional(),
  includeItems: z.coerce.boolean().optional(),
  q: z.string().trim().min(1).max(120).optional(),
  limit: z.coerce.number().int().positive().max(80).default(80),
});

const academyInternalQuerySchema = z.object({
  entity: z.enum(["domains", "traditions", "persons", "works", "concepts", "paths"]).optional(),
  q: z.string().trim().max(120).optional(),
  slug: z.string().trim().max(140).optional(),
  domainId: z.coerce.number().int().positive().optional(),
  traditionId: z.coerce.number().int().positive().optional(),
  personId: z.coerce.number().int().positive().optional(),
  conceptId: z.coerce.number().int().positive().optional(),
  pathId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(120).optional(),
  includeRelations: z.boolean().optional(),
});

const academyAdminIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

const academyAdminCurationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(1000).default(300),
});

const academyAdminPathPatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    summary: z.string().trim().min(1).max(1000).optional(),
    tone: z.enum(["beginner", "intermediate"]).optional(),
    difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    progressionOrder: z.coerce.number().int().min(0).max(9999).optional(),
    recommendationWeight: z.coerce.number().int().min(0).max(9999).optional(),
    recommendationHint: z.string().trim().min(1).max(600).optional(),
    isFeatured: z.boolean().optional(),
  })
  .strict();

const academyAdminPathItemsSchema = z.object({
  items: z
    .array(
      z.object({
        entityType: z.enum(["tradition", "person", "work", "concept"]),
        entityId: z.coerce.number().int().positive(),
        rationale: z.string().trim().max(600).optional(),
        sortOrder: z.coerce.number().int().min(0).optional(),
      }),
    )
    .max(240),
});

const academyAdminPersonEditorialSchema = z
  .object({
    credibilityBand: z
      .enum(["foundational", "major", "secondary", "popularizer", "controversial"])
      .nullable()
      .optional(),
    evidenceProfile: z.string().trim().max(140).nullable().optional(),
    claimRiskLevel: z.enum(["low", "medium", "high"]).nullable().optional(),
    bioShort: z.string().trim().max(1200).nullable().optional(),
  })
  .strict();

const academyAdminPersonRelationshipSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  sourcePersonId: z.coerce.number().int().positive(),
  targetPersonId: z.coerce.number().int().positive(),
  relationshipType: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(1000).nullable().optional(),
});

const academyAdminConceptRelationSchema = z.object({
  conceptId: z.coerce.number().int().positive(),
  entityType: z.enum(["tradition", "person", "work"]),
  entityId: z.coerce.number().int().positive(),
  sortOrder: z.coerce.number().int().min(0).max(10000).optional(),
});

const passkeyRenameSchema = z.object({
  nickname: z.string().trim().min(2).max(80),
});

const totpVerifySchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/),
});

const chatThreadCreateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
});

const chatThreadPatchSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  archived: z.boolean().optional(),
});

const chatThreadBranchSchema = z.object({
  messageId: z.string().uuid(),
});

const chatThreadClientEventSchema = z
  .object({
    eventType: z.enum(["message_quoted", "message_pinned", "thread_branch_auto_asked"]),
    messageId: z.string().uuid().optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.eventType === "message_quoted" || value.eventType === "message_pinned") && !value.messageId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "messageId is required for this event type",
        path: ["messageId"],
      });
    }
  });

const chatThreadListQuerySchema = z.object({
  scope: z.enum(["active", "archived", "all"]).optional().default("active"),
});

const chatPreferencesPatchSchema = z.object({
  customInstructions: z.string().max(1500),
});

const chatEventTypeSchema = z.enum(CHAT_EVENT_TYPES);

const onboardingSchema = z.object({
  primaryObjective: z.enum([
    "Calm anxiety",
    "Build discipline",
    "Make better decisions",
    "Improve relationships",
    "Find meaning",
  ]),
  dailyTimeCommitment: z.enum(["2 min", "5 min", "10 min", "20+ min"]),
  preferredPracticeFormat: z.enum([
    "A short practice",
    "A reflection prompt",
    "A lesson",
    "A conversation with the Companion",
  ]),
  notes: z.string().trim().max(500).optional().default(""),
});

const adminChatEventsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(200),
  threadId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  eventType: chatEventTypeSchema.optional(),
  days: z.coerce.number().int().positive().max(365).optional(),
  memoryOnly: z
    .preprocess((value) => {
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();
        if (normalized === "true" || normalized === "1") {
          return true;
        }
        if (normalized === "false" || normalized === "0" || normalized === "") {
          return false;
        }
      }
      return value;
    }, z.boolean())
    .optional()
    .default(false),
});

const adminPreviewAnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().positive().max(90).default(30),
});

const adminSystemJobRunsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).default(100),
  jobName: z.string().trim().min(1).max(120).optional(),
  status: z.enum(["running", "success", "error", "skipped"]).optional(),
  days: z.coerce.number().int().positive().max(365).optional(),
});

const adminSystemJobSummaryQuerySchema = z.object({
  jobName: z.string().trim().min(1).max(120).default("notification_digest"),
  failureWindowMinutes: z.coerce.number().int().positive().max(24 * 60).default(120),
  staleLockMinutes: z.coerce.number().int().positive().max(24 * 60).default(30),
});

const adminSystemJobUnlockSchema = z.object({
  jobName: z.string().trim().min(1).max(120).default("notification_digest"),
  minAgeMinutes: z.coerce.number().int().positive().max(24 * 60).default(30),
});

function parseIdOrFail(request: Request, response: Response): number | null {
  const parsed = integerIdSchema.safeParse(request.params);

  if (!parsed.success) {
    response.status(400).json({ error: "Invalid id parameter" });
    return null;
  }

  return parsed.data.id;
}

function parseStatusOrFail(request: Request, response: Response): ContentStatus | null {
  const parsed = statusSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ error: "Invalid status payload" });
    return null;
  }

  return parsed.data.status;
}

function normalizeCustomInstructions(value: string): string {
  return value.trim();
}

function resolveNotificationDigestLockPath(): string {
  const configured = process.env.NOTIFICATION_DIGEST_LOCK_PATH?.trim();
  if (configured) {
    return configured;
  }

  return path.join(process.cwd(), ".notification-digest.lock");
}

function getNotificationDigestLockInfo(): {
  path: string;
  exists: boolean;
  startedAt: string | null;
  ageMinutes: number | null;
} {
  const lockPath = resolveNotificationDigestLockPath();

  if (!existsSync(lockPath)) {
    return {
      path: lockPath,
      exists: false,
      startedAt: null,
      ageMinutes: null,
    };
  }

  try {
    const payload = JSON.parse(readFileSync(lockPath, "utf8")) as { startedAt?: string };
    const startedAt = payload.startedAt ?? null;
    const startedAtMs = startedAt ? Date.parse(startedAt) : NaN;

    return {
      path: lockPath,
      exists: true,
      startedAt,
      ageMinutes: Number.isNaN(startedAtMs)
        ? null
        : Math.max(0, Math.floor((Date.now() - startedAtMs) / (60 * 1000))),
    };
  } catch {
    return {
      path: lockPath,
      exists: true,
      startedAt: null,
      ageMinutes: null,
    };
  }
}

function resolveEmailTransportMode(rawValue: string | undefined, nodeEnv: string): EmailTransportMode {
  const normalized = rawValue?.trim().toLowerCase();

  if (!normalized) {
    return nodeEnv === "production" ? "resend" : "disabled";
  }

  if (normalized === "disabled" || normalized === "resend" || normalized === "smtp") {
    return normalized;
  }

  throw new Error(`Unsupported EMAIL_TRANSPORT value "${rawValue}". Use: disabled, resend, or smtp.`);
}

function parseBooleanEnvFlag(rawValue: string | undefined, envName: string): boolean | null {
  const normalized = rawValue?.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new Error(`Unsupported ${envName} value "${rawValue}". Use: true or false.`);
}

function resolveSignupEnabled(rawValue: string | undefined, nodeEnv: string): boolean {
  const parsed = parseBooleanEnvFlag(rawValue, "SIGNUP_ENABLED");

  if (parsed !== null) {
    return parsed;
  }

  // Safety default: production remains invite-only unless explicitly opened.
  // Non-production defaults to enabled to preserve local/test developer workflows.
  return nodeEnv === "production" ? false : true;
}

const SIGNUP_DISABLED_MESSAGE = "Signup is currently disabled. This beta is invite-only.";
const SIGNUP_DISABLED_CODE = "SIGNUP_DISABLED";

export function createApp() {
  const app = express();
  const env = envSchema.parse(process.env);
  const nodeEnv = process.env.NODE_ENV ?? "development";
  const chatConfig = createChatRuntimeConfig(env);
  const chatContextConfig = createChatContextRuntimeConfig(env);
  const signupEnabled = resolveSignupEnabled(env.SIGNUP_ENABLED, nodeEnv);
  const reflectionRepository = new ReflectionRepository();
  const reflectionAudioMaxBytes = parseBoundedInteger(
    env.REFLECTION_AUDIO_MAX_BYTES,
    DEFAULT_REFLECTION_AUDIO_MAX_BYTES,
    { min: 64 * 1024, max: 50 * 1024 * 1024 },
  );
  const reflectionStorageRoot = env.REFLECTION_STORAGE_PATH
    ? path.isAbsolute(env.REFLECTION_STORAGE_PATH)
      ? env.REFLECTION_STORAGE_PATH
      : path.resolve(repoRootPath, env.REFLECTION_STORAGE_PATH)
    : path.resolve(repoRootPath, DEFAULT_REFLECTION_STORAGE_RELATIVE_PATH);
  const reflectionStorageService = new ReflectionStorageService({
    rootPath: reflectionStorageRoot,
    maxBytes: reflectionAudioMaxBytes,
    allowedMimeTypes: [...REFLECTION_ALLOWED_AUDIO_MIME_TYPES],
  });
  const reflectionAiService = new ReflectionAiService(
    { providers: chatConfig.providers },
    {
      openAiApiKey: env.OPENAI_API_KEY?.trim() || null,
      openAiBaseUrl: normalizeBaseUrl(env.OPENAI_BASE_URL ?? DEFAULT_OPENAI_BASE_URL),
      model: env.OPENAI_TRANSCRIPTION_MODEL?.trim() || DEFAULT_OPENAI_TRANSCRIPTION_MODEL,
    },
  );
  const reflectionProcessingService = new ReflectionProcessingService(
    reflectionRepository,
    reflectionAiService,
    reflectionStorageService,
  );
  const reflectionService = new ReflectionService(
    reflectionRepository,
    reflectionAiService,
    reflectionStorageService,
    reflectionProcessingService,
  );

  async function resolveEffectiveSystemPromptForUser(userId: string): Promise<string> {
    const onboardingProfile = getUserOnboardingProfile(userId);
    const onboardingContext = formatOnboardingContext(onboardingProfile);
    const preferences = getUserCompanionPreferences(userId);
    const customInstructions = preferences?.customInstructions ?? "";
    return composeEffectiveSystemPrompt(
      chatConfig.globalSystemPrompt,
      customInstructions,
      onboardingContext,
    );
  }

  function recordChatEvent(input: {
    userId: string;
    threadId?: string | null;
    eventType: ChatEventType;
    payload?: Record<string, unknown>;
  }): void {
    try {
      createChatEvent({
        id: randomUUID(),
        userId: input.userId,
        threadId: input.threadId ?? null,
        eventType: input.eventType,
        payloadJson: JSON.stringify(input.payload ?? {}),
      });
    } catch (error) {
      console.warn(
        `[chat] Unable to persist chat event "${input.eventType}": ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
    }
  }

  function buildThreadPromptMessages(input: {
    effectiveSystemPrompt: string;
    summary: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  }): ChatModelMessage[] {
    const modelMessages: ChatModelMessage[] = [
      { role: "system", content: input.effectiveSystemPrompt },
    ];

    const trimmedSummary = input.summary.trim();
    if (trimmedSummary) {
      modelMessages.push({
        role: "system",
        content: `${CHAT_CONTEXT_MEMORY_PREFIX}\n${trimmedSummary}`,
      });
    }

    for (const message of input.messages) {
      modelMessages.push({
        role: message.role,
        content: message.content,
      });
    }

    return modelMessages;
  }

  function contextNoticeMessage(input: {
    state: ChatContextState;
    summarizedThisTurn: boolean;
  }): string | null {
    if (input.state === "degraded") {
      return "Context window is near full capacity. Start a new conversation for best continuity.";
    }

    if (input.summarizedThisTurn) {
      return "Context auto-summarized to preserve long-term memory efficiency.";
    }

    if (input.state === "warning") {
      return "Context usage is high. A summary may run automatically on upcoming turns.";
    }

    return null;
  }

  function toContextTelemetry(input: {
    summarizedMessageCount: number;
    estimatedPromptTokens: number;
    contextCapacity: number;
    usagePercent: number;
    state: ChatContextState;
    autoSummariesCount: number;
    lastSummarizedAt: string | null;
    updatedAt: string;
  }): ChatThreadContextTelemetry {
    return {
      summarizedMessageCount: input.summarizedMessageCount,
      estimatedPromptTokens: input.estimatedPromptTokens,
      contextCapacity: input.contextCapacity,
      usagePercent: input.usagePercent,
      state: input.state,
      autoSummariesCount: input.autoSummariesCount,
      lastSummarizedAt: input.lastSummarizedAt,
      updatedAt: input.updatedAt,
    };
  }

  async function generateAssistantReplyForLatestUserMessage(input: {
    userId: string;
    threadId: string;
    providerErrorRoute: string;
  }): Promise<void> {
    const thread = getChatThreadByIdForUser(input.userId, input.threadId);

    if (!thread) {
      throw new RouteHttpError(404, "Thread not found");
    }

    if (thread.archived) {
      throw new RouteHttpError(400, "Thread is archived. Restore it before sending new messages.");
    }

    try {
      assertWithinChatRateLimit(input.userId);
    } catch (error) {
      if (error instanceof Error) {
        throw new RouteHttpError(429, error.message);
      }
      throw error;
    }

    const allMessages = listChatMessagesForThread(input.userId, thread.id) ?? [];
    if (allMessages.length === 0) {
      throw new RouteHttpError(400, "Thread has no messages to process.");
    }

    const latestMessage = allMessages.at(-1);
    if (!latestMessage || latestMessage.role !== "user") {
      return;
    }

    const moderationError = moderatePrompt(latestMessage.content);
    if (moderationError) {
      throw new RouteHttpError(400, moderationError);
    }

    try {
      const effectiveSystemPrompt = await resolveEffectiveSystemPromptForUser(input.userId);
      const persistedContext = getChatThreadContextByThreadId(thread.id);
      const previousState = persistedContext?.state ?? "ok";
      let summary = persistedContext?.summary ?? "";
      let summarizedMessageCount = Math.min(
        Math.max(0, persistedContext?.summarizedMessageCount ?? 0),
        allMessages.length,
      );
      let autoSummariesCount = Math.max(0, persistedContext?.autoSummariesCount ?? 0);
      let lastSummarizedAt = persistedContext?.lastSummarizedAt ?? null;
      let summarizedThisTurn = false;

      const buildState = () => {
        const liveMessages = allMessages.slice(summarizedMessageCount);
        const modelMessages = buildThreadPromptMessages({
          effectiveSystemPrompt,
          summary,
          messages: liveMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        });
        const estimatedPromptTokens = estimatePromptTokensForMessages(modelMessages);
        const usagePercent = computeContextUsagePercent(
          estimatedPromptTokens,
          chatContextConfig.capacity,
        );
        return { liveMessages, modelMessages, estimatedPromptTokens, usagePercent };
      };

      let built = buildState();

      if (
        built.usagePercent >= chatContextConfig.summarizePercent &&
        built.liveMessages.length > chatContextConfig.recentRawMessages
      ) {
        const summarizeCount = built.liveMessages.length - chatContextConfig.recentRawMessages;
        const toSummarize = built.liveMessages.slice(0, summarizeCount);

        if (toSummarize.length > 0) {
          summary = await summarizeConversationMemory({
            existingSummary: summary,
            messages: toSummarize.map((message) => ({
              role: message.role,
              content: message.content,
            })),
            chatConfig,
          });

          summarizedMessageCount = Math.min(allMessages.length, summarizedMessageCount + toSummarize.length);
          autoSummariesCount += 1;
          lastSummarizedAt = new Date().toISOString();
          summarizedThisTurn = true;
          built = buildState();
        }
      }

      const state = deriveChatContextState(built.usagePercent, chatContextConfig);
      upsertChatThreadContext({
        threadId: thread.id,
        summary,
        summarizedMessageCount,
        estimatedPromptTokens: built.estimatedPromptTokens,
        contextCapacity: chatContextConfig.capacity,
        usagePercent: built.usagePercent,
        state,
        autoSummariesCount,
        lastSummarizedAt,
      });

      if (summarizedThisTurn) {
        recordChatEvent({
          userId: input.userId,
          threadId: thread.id,
          eventType: "context_auto_summarized",
          payload: {
            summarizedMessageCount,
            usagePercent: built.usagePercent,
            estimatedPromptTokens: built.estimatedPromptTokens,
          },
        });
      }

      if (state === "warning" && previousState === "ok") {
        recordChatEvent({
          userId: input.userId,
          threadId: thread.id,
          eventType: "context_warning",
          payload: {
            usagePercent: built.usagePercent,
            estimatedPromptTokens: built.estimatedPromptTokens,
            contextCapacity: chatContextConfig.capacity,
          },
        });
      }

      if (state === "degraded" && previousState !== "degraded") {
        recordChatEvent({
          userId: input.userId,
          threadId: thread.id,
          eventType: "context_degraded",
          payload: {
            usagePercent: built.usagePercent,
            estimatedPromptTokens: built.estimatedPromptTokens,
            contextCapacity: chatContextConfig.capacity,
          },
        });
      }

      const answer = await resolveChatAnswer(built.modelMessages, chatConfig);

      createChatMessage({
        id: randomUUID(),
        threadId: thread.id,
        role: "assistant",
        content: answer,
      });
    } catch (error) {
      if (error instanceof ChatProvidersFailedError) {
        recordChatEvent({
          userId: input.userId,
          threadId: input.threadId,
          eventType: "message_provider_error",
          payload: {
            route: input.providerErrorRoute,
            failures: error.failures,
          },
        });
        throw new RouteHttpError(
          502,
          "Unable to reach configured chat providers. Check CHAT_PROVIDER_ORDER and provider API keys/models.",
        );
      }

      if (error instanceof RouteHttpError) {
        throw error;
      }

      if (error instanceof Error) {
        throw new RouteHttpError(
          502,
          "Unable to reach configured chat providers. Check CHAT_PROVIDER_ORDER and provider API keys/models.",
        );
      }
      throw error;
    }
  }

  const allowedOrigins = (env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const webAppUrl = normalizeWebAppUrl(env.WEB_APP_URL ?? allowedOrigins[0] ?? "http://localhost:3000");
  const resendApiKey = env.RESEND_API_KEY?.trim() ?? "";
  const resendFromEmail = env.RESEND_FROM_EMAIL?.trim() ?? "";
  const isResendConfigured = resendApiKey.length > 0 && resendFromEmail.length > 0;
  const emailTransport = resolveEmailTransportMode(env.EMAIL_TRANSPORT, nodeEnv);
  const smtpHost = env.SMTP_HOST?.trim() ?? "";
  const smtpPortRaw = env.SMTP_PORT?.trim() ?? "";
  const smtpPort = smtpPortRaw ? Number(smtpPortRaw) : 1025;
  const smtpSecure = (env.SMTP_SECURE?.trim().toLowerCase() ?? "false") === "true";
  const smtpUser = env.SMTP_USER?.trim() ?? "";
  const smtpPass = env.SMTP_PASS?.trim() ?? "";
  const smtpFromEmail = env.SMTP_FROM_EMAIL?.trim() || resendFromEmail;
  const hasSmtpAuth = smtpUser.length > 0;

  if (!Number.isInteger(smtpPort) || smtpPort <= 0 || smtpPort > 65535) {
    throw new Error("SMTP_PORT must be an integer between 1 and 65535.");
  }

  if (hasSmtpAuth && !smtpPass) {
    throw new Error("SMTP_PASS is required when SMTP_USER is set.");
  }

  let smtpTransport: Transporter | null = null;
  if (emailTransport === "smtp") {
    if (!smtpHost) {
      throw new Error("SMTP_HOST is required when EMAIL_TRANSPORT=smtp.");
    }
    if (!smtpFromEmail) {
      throw new Error("SMTP_FROM_EMAIL (or RESEND_FROM_EMAIL fallback) is required when EMAIL_TRANSPORT=smtp.");
    }

    smtpTransport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      ...(hasSmtpAuth ? { auth: { user: smtpUser, pass: smtpPass } } : {}),
    });
  }
  let hasLoggedDisabledEmailDelivery = false;

  if (nodeEnv === "production") {
    if (!env.WEB_APP_URL?.trim()) {
      throw new Error("WEB_APP_URL is required in production.");
    }

    if (emailTransport === "disabled") {
      throw new Error("EMAIL_TRANSPORT cannot be disabled in production.");
    }

    if (emailTransport === "resend" && !isResendConfigured) {
      throw new Error("RESEND_API_KEY and RESEND_FROM_EMAIL are required in production.");
    }
  }

  const passkeyRpId = env.PASSKEY_RP_ID ?? "localhost";
  const passkeyRpName = env.PASSKEY_RP_NAME ?? "Areti";
  const passkeyExpectedOrigins = (
    env.PASSKEY_ORIGINS ??
    allowedOrigins.join(",") ??
    "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  async function sendVerificationEmail(input: {
    email: string;
    name: string;
    token: string;
    code: string;
  }): Promise<void> {
    if (nodeEnv === "test") {
      return;
    }

    const verifyUrl = `${webAppUrl}/auth/verify-email?token=${encodeURIComponent(input.token)}&email=${encodeURIComponent(input.email)}`;
    const subject = "Verify your Areti account";
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; line-height: 1.5; color: #1f2937;">
        <h2 style="margin: 0 0 12px;">Verify your email</h2>
        <p>Hello ${input.name || "there"},</p>
        <p>Use this verification code:</p>
        <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; margin: 8px 0 16px;">${input.code}</p>
        <p>Or click this secure link:</p>
        <p><a href="${verifyUrl}" style="color: #0f766e;">Verify email</a></p>
        <p style="font-size: 12px; color: #6b7280;">This link and code expire in ${EMAIL_VERIFICATION_TTL_MINUTES} minutes.</p>
      </div>
    `.trim();
    const text = [
      `Hello ${input.name || "there"},`,
      "",
      `Use this verification code: ${input.code}`,
      "",
      `Or verify with this secure link: ${verifyUrl}`,
      "",
      `This link and code expire in ${EMAIL_VERIFICATION_TTL_MINUTES} minutes.`,
    ].join("\n");

    if (emailTransport === "disabled") {
      if (!hasLoggedDisabledEmailDelivery) {
        console.warn("[auth] EMAIL_TRANSPORT=disabled; skipping verification email delivery.");
        hasLoggedDisabledEmailDelivery = true;
      }
      return;
    }

    if (emailTransport === "smtp") {
      if (!smtpTransport || !smtpFromEmail) {
        throw new Error("SMTP transport is not configured.");
      }

      await smtpTransport.sendMail({
        from: smtpFromEmail,
        to: input.email,
        subject,
        text,
        html,
      });
      return;
    }

    if (!isResendConfigured) {
      throw new Error("RESEND_API_KEY or RESEND_FROM_EMAIL is missing while EMAIL_TRANSPORT=resend.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: input.email,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(payload?.message ?? "Failed to send verification email.");
    }
  }

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "20mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/v1/auth/signup", async (req, res) => {
    if (!signupEnabled) {
      res.status(403).json({
        error: SIGNUP_DISABLED_MESSAGE,
        code: SIGNUP_DISABLED_CODE,
      });
      return;
    }

    const parsed = signupSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid signup payload" });
      return;
    }

    try {
      assertWithinAuthRateLimit(authKey("signup", req, parsed.data.email));
    } catch (error) {
      if (error instanceof Error) {
        res.status(429).json({ error: error.message });
        return;
      }
      throw error;
    }

    const existing = getUserByEmail(parsed.data.email);

    if (existing) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }

    const created = createUser({
      id: randomUUID(),
      name: deriveSignupDisplayName(parsed.data.email),
      email: parsed.data.email,
      passwordHash: await argon2.hash(parsed.data.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 3,
        parallelism: 1,
      }),
      role: "MEMBER",
    });

    if (!created) {
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    const acceptedAt = new Date().toISOString();
    const consentContext = buildDeviceContext(req);

    createUserLegalConsent({
      id: randomUUID(),
      userId: created.id,
      policyType: "TERMS",
      policyVersion: TERMS_POLICY_VERSION,
      acceptedAt,
      ipAddress: consentContext.ipAddress,
      userAgent: consentContext.userAgent,
    });

    createUserLegalConsent({
      id: randomUUID(),
      userId: created.id,
      policyType: "PRIVACY",
      policyVersion: PRIVACY_POLICY_VERSION,
      acceptedAt,
      ipAddress: consentContext.ipAddress,
      userAgent: consentContext.userAgent,
    });

    const verificationToken = createOpaqueToken();
    const verificationCode = createEmailVerificationCode();
    createEmailVerificationChallenge({
      id: randomUUID(),
      userId: created.id,
      tokenHash: hashToken(verificationToken),
      codeHash: hashToken(verificationCode),
      expiresAt: nowPlusMinutesIso(EMAIL_VERIFICATION_TTL_MINUTES),
    });

    try {
      await sendVerificationEmail({
        email: created.email,
        name: created.name,
        token: verificationToken,
        code: verificationCode,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(502).json({ error: error.message });
        return;
      }

      throw error;
    }

    res.status(201).json({
      data: {
        verificationRequired: true,
        email: created.email,
        ...(process.env.NODE_ENV !== "production"
          ? {
              debugVerificationCode: verificationCode,
              debugVerificationToken: verificationToken,
            }
          : {}),
      },
    });
  });

  app.post("/api/v1/auth/verify-email", async (req, res) => {
    const parsed = verifyEmailSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid verification payload" });
      return;
    }

    let user = null as CurrentUser | null;
    let challengeId = "";
    const email = parsed.data.email ?? "";
    const code = parsed.data.code ?? "";
    const hasCodePayload = Boolean(email && code);

    if (hasCodePayload) {
      const existing = getUserByEmail(email);

      if (!existing) {
        res.status(401).json({ error: "Invalid verification code." });
        return;
      }

      const challenge = getActiveEmailVerificationChallengeByCodeHash(existing.id, hashToken(code));

      if (!challenge) {
        res.status(401).json({ error: "Invalid verification code." });
        return;
      }

      user = getUserById(existing.id);
      challengeId = challenge.id;
    } else {
      const token = parsed.data.token ?? "";
      const challenge = getActiveEmailVerificationChallengeByTokenHash(hashToken(token));

      if (!challenge) {
        res.status(401).json({ error: "Invalid or expired verification token." });
        return;
      }

      user = getUserById(challenge.userId);
      challengeId = challenge.id;
    }

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (!consumeEmailVerificationChallenge(challengeId)) {
      res.status(401).json({ error: "Verification challenge is no longer valid." });
      return;
    }

    const wasAlreadyVerified = Boolean(user.emailVerifiedAt);

    if (!wasAlreadyVerified) {
      const verifiedCountBefore = countVerifiedUsers();
      const verifiedUser = markUserEmailVerified(user.id);

      if (!verifiedUser) {
        res.status(500).json({ error: "Unable to verify account email." });
        return;
      }

      if (verifiedCountBefore === 0) {
        setUserRole(verifiedUser.id, "ADMIN");
      }
    }

    const refreshedUser = getUserById(user.id);

    if (!refreshedUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const deviceContext = buildDeviceContext(req);
    const deviceId = upsertUserDevice({
      id: randomUUID(),
      userId: refreshedUser.id,
      fingerprint: deviceContext.fingerprint,
      label: deviceContext.label,
      ipAddress: deviceContext.ipAddress,
      userAgent: deviceContext.userAgent,
    });

    const tokens = await createAuthTokenPair(refreshedUser.id, deviceId);

    res.json({
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: refreshedUser,
      },
    });
  });

  app.post("/api/v1/auth/resend-verification", async (req, res) => {
    const parsed = resendVerificationSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid resend payload" });
      return;
    }

    try {
      assertWithinAuthRateLimit(authKey("signup", req, parsed.data.email));
    } catch (error) {
      if (error instanceof Error) {
        res.status(429).json({ error: error.message });
        return;
      }
      throw error;
    }

    const user = getUserByEmail(parsed.data.email);

    if (!user) {
      res.json({ data: { sent: true } });
      return;
    }

    if (user.emailVerifiedAt) {
      res.json({ data: { sent: false, alreadyVerified: true } });
      return;
    }

    const latestChallenge = getLatestEmailVerificationChallengeByUserId(user.id);
    const now = new Date();

    if (latestChallenge) {
      const elapsedSeconds = Math.floor(
        (now.getTime() - new Date(latestChallenge.lastSentAt).getTime()) / 1000,
      );

      if (elapsedSeconds < EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS) {
        res.status(429).json({
          error: `Please wait ${EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS - elapsedSeconds}s before requesting another code.`,
        });
        return;
      }
    }

    const verificationToken = createOpaqueToken();
    const verificationCode = createEmailVerificationCode();
    const expiresAt = nowPlusMinutesIso(EMAIL_VERIFICATION_TTL_MINUTES);

    if (latestChallenge) {
      const replaced = replaceEmailVerificationChallenge({
        challengeId: latestChallenge.id,
        tokenHash: hashToken(verificationToken),
        codeHash: hashToken(verificationCode),
        expiresAt,
      });

      if (!replaced) {
        createEmailVerificationChallenge({
          id: randomUUID(),
          userId: user.id,
          tokenHash: hashToken(verificationToken),
          codeHash: hashToken(verificationCode),
          expiresAt,
        });
      }
    } else {
      createEmailVerificationChallenge({
        id: randomUUID(),
        userId: user.id,
        tokenHash: hashToken(verificationToken),
        codeHash: hashToken(verificationCode),
        expiresAt,
      });
    }

    try {
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        token: verificationToken,
        code: verificationCode,
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(502).json({ error: error.message });
        return;
      }
      throw error;
    }

    res.json({
      data: {
        sent: true,
        ...(process.env.NODE_ENV !== "production"
          ? {
              debugVerificationCode: verificationCode,
              debugVerificationToken: verificationToken,
            }
          : {}),
      },
    });
  });

  app.post("/api/v1/auth/signin", async (req, res) => {
    const parsed = signinSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid signin payload" });
      return;
    }

    try {
      assertWithinAuthRateLimit(authKey("signin", req, parsed.data.email));
    } catch (error) {
      if (error instanceof Error) {
        res.status(429).json({ error: error.message });
        return;
      }
      throw error;
    }

    const existing = getUserByEmail(parsed.data.email);

    if (!existing || existing.deletedAt) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const valid = await argon2.verify(existing.passwordHash, parsed.data.password);

    if (!valid) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    if (!existing.emailVerifiedAt) {
      res.status(401).json({ error: "EMAIL_NOT_VERIFIED" });
      return;
    }

    if (existing.mfaEnabled) {
      const totpSecret = getUserTotpSecret(existing.id);

      if (!totpSecret?.verifiedAt) {
        res.status(409).json({ error: "MFA is enabled but not fully configured." });
        return;
      }

      if (!parsed.data.mfaCode) {
        res.status(401).json({
          error: "MFA_REQUIRED",
          data: {
            mfaRequired: true,
            mfaChallengeId: "totp",
          },
        });
        return;
      }

      const mfaValid = verifyTotpCode(totpSecret.secret, parsed.data.mfaCode);

      if (!mfaValid) {
        res.status(401).json({ error: "Invalid MFA code." });
        return;
      }
    }

    const deviceContext = buildDeviceContext(req);
    const deviceId = upsertUserDevice({
      id: randomUUID(),
      userId: existing.id,
      fingerprint: deviceContext.fingerprint,
      label: deviceContext.label,
      ipAddress: deviceContext.ipAddress,
      userAgent: deviceContext.userAgent,
    });

    const tokens = await createAuthTokenPair(existing.id, deviceId);
    const signedInUser = getUserById(existing.id);

    if (!signedInUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: signedInUser,
      },
    });
  });

  app.post("/api/v1/auth/passkey/options", async (req, res) => {
    const parsed = passkeyAuthOptionsSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid passkey auth payload" });
      return;
    }

    const existingUser = getUserByEmail(parsed.data.email);

    if (
      !existingUser ||
      existingUser.deletedAt ||
      !existingUser.passkeyEnabled ||
      !existingUser.emailVerifiedAt
    ) {
      res.status(401).json({ error: "Passkey sign-in is unavailable for this account." });
      return;
    }

    const credentials = listPasskeyCredentialsByUserId(existingUser.id);

    if (credentials.length === 0) {
      res.status(401).json({ error: "Passkey sign-in is unavailable for this account." });
      return;
    }

    const options = await generateAuthenticationOptions({
      rpID: passkeyRpId,
      allowCredentials: credentials.map((credential) => ({
        id: credential.credentialId,
        transports: normalizePasskeyTransports(credential.transports),
      })),
      userVerification: "preferred",
    });

    const challengeId = createPasskeyChallenge({
      challenge: options.challenge,
      purpose: "authentication",
      userId: existingUser.id,
    });

    res.json({
      data: {
        challengeId,
        options,
      },
    });
  });

  app.post("/api/v1/auth/passkey/verify", async (req, res) => {
    const parsed = passkeyVerifySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid passkey verify payload" });
      return;
    }

    const challengeRecord = consumePasskeyChallenge({
      challengeId: parsed.data.challengeId,
      purpose: "authentication",
    });

    if (!challengeRecord) {
      res.status(401).json({ error: "Invalid or expired passkey challenge." });
      return;
    }

    const credential = getPasskeyCredentialByCredentialId(parsed.data.response.id);

    if (!credential || credential.userId !== challengeRecord.userId) {
      res.status(401).json({ error: "Passkey credential not recognized." });
      return;
    }

    const user = getUserById(challengeRecord.userId);

    if (!user) {
      res.status(401).json({ error: "User not found for passkey credential." });
      return;
    }

    if (!user.emailVerifiedAt) {
      res.status(401).json({ error: "Passkey sign-in is unavailable for this account." });
      return;
    }

    const authenticationResponse = parsed.data.response as unknown as AuthenticationResponseJSON;

    try {
      const verification = await verifyAuthenticationResponse({
        response: authenticationResponse,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: passkeyExpectedOrigins,
        expectedRPID: passkeyRpId,
        credential: {
          id: credential.credentialId,
          publicKey: isoBase64URL.toBuffer(credential.publicKey),
          counter: credential.counter,
          transports: normalizePasskeyTransports(credential.transports),
        },
        requireUserVerification: true,
      });

      if (!verification.verified) {
        res.status(401).json({ error: "Passkey assertion could not be verified." });
        return;
      }

      updatePasskeyCredentialCounter(
        verification.authenticationInfo.credentialID,
        verification.authenticationInfo.newCounter,
      );
      setUserPasskeyEnabled(user.id, true);

      const deviceContext = buildDeviceContext(req);
      const deviceId = upsertUserDevice({
        id: randomUUID(),
        userId: user.id,
        fingerprint: deviceContext.fingerprint,
        label: deviceContext.label,
        ipAddress: deviceContext.ipAddress,
        userAgent: deviceContext.userAgent,
      });

      const tokens = await createAuthTokenPair(user.id, deviceId);

      res.json({
        data: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user,
        },
      });
    } catch {
      res.status(401).json({ error: "Passkey assertion could not be verified." });
    }
  });

  app.post("/api/v1/auth/refresh", async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid refresh payload" });
      return;
    }

    const refreshTokenHash = hashToken(parsed.data.refreshToken);
    const refreshContext = getRefreshSessionContextByTokenHash(refreshTokenHash);

    if (!refreshContext) {
      res.status(401).json({ error: "Invalid or expired refresh token." });
      return;
    }
    const user = refreshContext.user;

    const newAccessToken = createOpaqueToken();
    const newRefreshToken = createOpaqueToken();

    const rotated = rotateRefreshSessionByTokenHash(refreshTokenHash, {
      id: randomUUID(),
      tokenHash: hashToken(newRefreshToken),
      userId: user.id,
      deviceId: refreshContext.deviceId,
      expiresAt: nowPlusDaysIso(REFRESH_SESSION_TTL_DAYS),
    });

    if (!rotated) {
      res.status(401).json({ error: "Refresh token rotation failed." });
      return;
    }

    createSession({
      id: randomUUID(),
      tokenHash: hashToken(newAccessToken),
      userId: user.id,
      deviceId: refreshContext.deviceId,
      expiresAt: nowPlusMinutesIso(ACCESS_SESSION_TTL_MINUTES),
    });

    res.json({
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  });

  app.get("/api/v1/auth/me", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const currentUser = getUserById(authReq.authUser.id);

    if (!currentUser) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const profile = getUserProfileByUserId(currentUser.id);
    const preferences = getUserPreferencesByUserId(currentUser.id);

    res.json({
      data: {
        user: currentUser,
        accessToken: authReq.authAccessToken,
        profile,
        preferences,
      },
    });
  });

  app.patch("/api/v1/auth/me", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = authMePatchSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid account payload" });
      return;
    }

    if (parsed.data.name !== undefined) {
      const updatedUser = updateUserName(authReq.authUser.id, parsed.data.name);

      if (!updatedUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }
    }

    if (parsed.data.profile) {
      upsertUserProfile(authReq.authUser.id, parsed.data.profile);
    }

    if (parsed.data.preferences) {
      upsertUserPreferences(authReq.authUser.id, parsed.data.preferences);
    }

    const currentUser = getUserById(authReq.authUser.id);

    if (!currentUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const profile = getUserProfileByUserId(currentUser.id);
    const preferences = getUserPreferencesByUserId(currentUser.id);

    res.json({
      data: {
        user: currentUser,
        profile,
        preferences,
      },
    });
  });

  app.post("/api/v1/auth/change-password", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid password payload" });
      return;
    }

    if (parsed.data.oldPassword === parsed.data.newPassword) {
      res.status(400).json({ error: "New password must be different from current password." });
      return;
    }

    const existing = getUserAuthById(authReq.authUser.id);

    if (!existing || existing.deletedAt) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const validCurrentPassword = await argon2.verify(existing.passwordHash, parsed.data.oldPassword);

    if (!validCurrentPassword) {
      res.status(401).json({ error: "Current password is incorrect." });
      return;
    }

    const passwordHash = await argon2.hash(parsed.data.newPassword, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 3,
      parallelism: 1,
    });
    const updated = updateUserPasswordHash(authReq.authUser.id, passwordHash);

    if (!updated) {
      res.status(500).json({ error: "Unable to update password." });
      return;
    }

    res.json({ data: { updated: true } });
  });

  app.post("/api/v1/auth/delete", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = deleteAccountSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid delete payload" });
      return;
    }

    const existing = getUserAuthById(authReq.authUser.id);

    if (!existing || existing.deletedAt) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (parsed.data.emailConfirm !== existing.email.toLowerCase()) {
      res.status(401).json({ error: "Email confirmation does not match your account." });
      return;
    }

    const validPassword = await argon2.verify(existing.passwordHash, parsed.data.passwordConfirm);

    if (!validPassword) {
      res.status(401).json({ error: "Password confirmation is invalid." });
      return;
    }

    const deleted = softDeleteUserAndAnonymize({
      userId: existing.id,
      reason: "self-service-account-delete",
    });

    if (!deleted) {
      res.status(409).json({ error: "Account is already deleted." });
      return;
    }

    res.json({ data: { deleted: true } });
  });

  app.get("/api/v1/onboarding", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const profile = getUserOnboardingProfile(authReq.authUser.id);

    res.json({
      data: {
        profile,
        onboardingCompletedAt: authReq.authUser.onboardingCompletedAt,
      },
    });
  });

  app.put("/api/v1/onboarding", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = onboardingSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid onboarding payload" });
      return;
    }

    const updatedProfile = upsertUserOnboardingProfile({
      id: randomUUID(),
      userId: authReq.authUser.id,
      primaryObjective: parsed.data.primaryObjective,
      dailyTimeCommitment: parsed.data.dailyTimeCommitment,
      preferredPracticeFormat: parsed.data.preferredPracticeFormat,
      notes: parsed.data.notes,
    });
    const updatedUser = markUserOnboardingCompleted(authReq.authUser.id);

    if (!updatedUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      data: {
        profile: updatedProfile,
        onboardingCompletedAt: updatedUser.onboardingCompletedAt,
      },
    });
  });

  app.post("/api/v1/auth/logout", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = z
      .object({
        refreshToken: z.string().min(16).optional(),
      })
      .safeParse(req.body ?? {});

    deleteSessionByTokenHash(hashToken(authReq.authAccessToken));

    if (parsed.success && parsed.data.refreshToken) {
      deleteRefreshSessionByTokenHash(hashToken(parsed.data.refreshToken));
    }

    res.status(204).send();
  });

  app.get("/api/v1/security/settings", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const settings = getSecuritySettingsByUserId(authReq.authUser.id);

    if (!settings) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ data: settings });
  });

  app.post("/api/v1/security/mfa", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = securityToggleSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    if (parsed.data.enabled) {
      const secret = getUserTotpSecret(authReq.authUser.id);
      if (!secret?.verifiedAt) {
        res.status(400).json({ error: "Set up and verify TOTP before enabling MFA." });
        return;
      }
    } else {
      deleteUserTotpSecret(authReq.authUser.id);
    }

    setUserMfaEnabled(authReq.authUser.id, parsed.data.enabled);

    res.json({ data: { mfaEnabled: parsed.data.enabled } });
  });

  app.post("/api/v1/security/passkeys", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = securityToggleSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payload" });
      return;
    }

    setUserPasskeyEnabled(authReq.authUser.id, parsed.data.enabled);

    res.json({ data: { passkeyEnabled: parsed.data.enabled } });
  });

  app.post("/api/v1/security/passkeys/register/options", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const credentials = listPasskeyCredentialsByUserId(authReq.authUser.id);

    const options = await generateRegistrationOptions({
      rpID: passkeyRpId,
      rpName: passkeyRpName,
      userID: Buffer.from(authReq.authUser.id, "utf8"),
      userName: authReq.authUser.email,
      userDisplayName: authReq.authUser.name,
      attestationType: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
      excludeCredentials: credentials.map((credential) => ({
        id: credential.credentialId,
        transports: normalizePasskeyTransports(credential.transports),
      })),
    });

    const challengeId = createPasskeyChallenge({
      challenge: options.challenge,
      purpose: "registration",
      userId: authReq.authUser.id,
    });

    res.json({
      data: {
        challengeId,
        options,
      },
    });
  });

  app.post("/api/v1/security/passkeys/register/verify", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = passkeyVerifySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid passkey verify payload" });
      return;
    }

    const challengeRecord = consumePasskeyChallenge({
      challengeId: parsed.data.challengeId,
      purpose: "registration",
      userId: authReq.authUser.id,
    });

    if (!challengeRecord) {
      res.status(401).json({ error: "Invalid or expired passkey challenge." });
      return;
    }

    const registrationResponse = parsed.data.response as unknown as RegistrationResponseJSON;

    try {
      const verification = await verifyRegistrationResponse({
        response: registrationResponse,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin: passkeyExpectedOrigins,
        expectedRPID: passkeyRpId,
        requireUserVerification: true,
      });

      if (!verification.verified || !verification.registrationInfo) {
        res.status(401).json({ error: "Passkey registration could not be verified." });
        return;
      }

      const { credential } = verification.registrationInfo;
      const existingCredential = getPasskeyCredentialByCredentialId(credential.id);
      const transports = normalizePasskeyTransports(registrationResponse.response.transports);

      if (existingCredential && existingCredential.userId !== authReq.authUser.id) {
        res.status(409).json({ error: "Passkey credential already belongs to another user." });
        return;
      }

      if (existingCredential) {
        updatePasskeyCredential({
          credentialId: credential.id,
          publicKey: isoBase64URL.fromBuffer(credential.publicKey),
          counter: credential.counter,
          nickname: existingCredential.nickname,
          transports,
        });
      } else {
        createPasskeyCredential({
          id: randomUUID(),
          userId: authReq.authUser.id,
          credentialId: credential.id,
          nickname: `${authReq.authUser.name.split(" ")[0]}'s passkey`,
          publicKey: isoBase64URL.fromBuffer(credential.publicKey),
          counter: credential.counter,
          transports,
        });
      }

      setUserPasskeyEnabled(authReq.authUser.id, true);

      res.json({
        data: {
          verified: true,
          passkeyEnabled: true,
        },
      });
    } catch {
      res.status(401).json({ error: "Passkey registration could not be verified." });
    }
  });

  app.get("/api/v1/security/passkeys", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const passkeys = listPasskeyCredentialsByUserId(authReq.authUser.id).map((item) => ({
      id: item.id,
      credentialId: item.credentialId,
      nickname: item.nickname ?? "Unnamed passkey",
      createdAt: item.createdAt,
      lastUsedAt: item.lastUsedAt,
    }));
    res.json({ data: passkeys });
  });

  app.patch("/api/v1/security/passkeys/:id", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = passkeyRenameSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid passkey payload" });
      return;
    }

    const renamed = renamePasskeyCredentialById(
      authReq.authUser.id,
      req.params.id,
      parsed.data.nickname,
    );

    if (!renamed) {
      res.status(404).json({ error: "Passkey not found" });
      return;
    }

    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/security/passkeys/:id", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const deleted = deletePasskeyCredentialById(authReq.authUser.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ error: "Passkey not found" });
      return;
    }

    const remainingPasskeys = listPasskeyCredentialsByUserId(authReq.authUser.id);
    if (remainingPasskeys.length === 0) {
      setUserPasskeyEnabled(authReq.authUser.id, false);
    }

    res.status(204).send();
  });

  app.post("/api/v1/security/mfa/totp/setup", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const secret = generateTotpSecret();
    const issuer = encodeURIComponent("Areti");
    const label = encodeURIComponent(authReq.authUser.email);

    upsertUserTotpSecret({
      id: randomUUID(),
      userId: authReq.authUser.id,
      secret,
      verifiedAt: null,
    });

    res.json({
      data: {
        secret,
        otpAuthUrl: `otpauth://totp/${issuer}:${label}?secret=${secret}&issuer=${issuer}&digits=${TOTP_DIGITS}&period=${TOTP_STEP_SECONDS}`,
      },
    });
  });

  app.post("/api/v1/security/mfa/totp/verify", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = totpVerifySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid verification payload" });
      return;
    }

    const secret = getUserTotpSecret(authReq.authUser.id);

    if (!secret) {
      res.status(404).json({ error: "No pending TOTP setup found." });
      return;
    }

    const valid = verifyTotpCode(secret.secret, parsed.data.code);

    if (!valid) {
      res.status(401).json({ error: "Invalid verification code." });
      return;
    }

    markUserTotpVerified(authReq.authUser.id);
    setUserMfaEnabled(authReq.authUser.id, true);

    res.json({ data: { mfaEnabled: true } });
  });

  app.delete("/api/v1/security/mfa/totp", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    deleteUserTotpSecret(authReq.authUser.id);
    setUserMfaEnabled(authReq.authUser.id, false);
    res.status(204).send();
  });

  app.get("/api/v1/security/devices", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const currentSession = getSessionDeviceByTokenHash(hashToken(authReq.authAccessToken));
    const devices = listUserDevicesByUserId(authReq.authUser.id).map((device) => ({
      ...device,
      isCurrent: currentSession?.deviceId === device.id,
      isRevoked: Boolean(device.revokedAt),
    }));
    res.json({ data: devices });
  });

  app.delete("/api/v1/security/devices/:id", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const revoked = revokeUserDevice(authReq.authUser.id, req.params.id);

    if (!revoked) {
      res.status(404).json({ error: "Device not found" });
      return;
    }

    res.status(204).send();
  });

  app.get("/api/v1/notifications", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = z
      .object({
        limit: z.coerce.number().int().positive().max(50).default(20),
      })
      .safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    res.json({ data: listNotificationsByUser(authReq.authUser.id, parsed.data.limit) });
  });

  app.get("/api/v1/notifications/preferences", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const preferences = getUserNotificationPreferencesByUserId(authReq.authUser.id);
    res.json({ data: preferences });
  });

  app.patch("/api/v1/notifications/preferences", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = notificationPreferencesPatchSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid notification preferences payload" });
      return;
    }

    const preferences = upsertUserNotificationPreferences(authReq.authUser.id, parsed.data);
    res.json({ data: preferences });
  });

  app.patch("/api/v1/notifications/:id/read", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const updated = markNotificationRead(authReq.authUser.id, req.params.id);

    if (!updated) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    res.json({ data: { ok: true } });
  });

  app.post("/api/v1/notifications/read-all", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const updatedCount = markAllNotificationsRead(authReq.authUser.id);
    res.json({ data: { updatedCount } });
  });

  app.post("/api/v1/preview/chat", async (req, res) => {
    const parsed = previewChatSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid prompt" });
      return;
    }

    if ((parsed.data.honeypot ?? "").length > 0 || (parsed.data.interactionMs ?? 0) < 700) {
      res.status(400).json({ error: "Human verification failed." });
      return;
    }

    const rateLimitKey = previewClientKey(req);

    try {
      assertWithinPreviewChatRateLimit(rateLimitKey);
    } catch (error) {
      if (error instanceof Error) {
        res.status(429).json({ error: error.message });
        return;
      }
      throw error;
    }

    const moderationError = moderatePrompt(parsed.data.prompt);

    if (moderationError) {
      res.status(400).json({ error: moderationError });
      return;
    }

    const maxResponseTokens = parsed.data.maxResponseTokens ?? 96;

    try {
      const resolvedAnswer = await resolveChatAnswer(
        [
          { role: "system", content: PREVIEW_CHAT_SYSTEM_PROMPT },
          { role: "user", content: parsed.data.prompt },
        ],
        chatConfig,
        { maxTokens: maxResponseTokens },
      );
      const answer = clipToApproxTokenLimit(resolvedAnswer, maxResponseTokens);

      res.json({
        data: {
          answer,
          usage: {
            promptTokens: estimateApproxTokens(parsed.data.prompt),
            answerTokens: estimateApproxTokens(answer),
            maxResponseTokens,
          },
        },
      });
    } catch (error) {
      if (error instanceof ChatProvidersFailedError) {
        res.status(502).json({
          error:
            "Unable to reach configured chat providers. Check CHAT_PROVIDER_ORDER and provider API keys/models.",
        });
        return;
      }

      if (error instanceof Error) {
        res.status(502).json({
          error:
            "Unable to reach configured chat providers. Check CHAT_PROVIDER_ORDER and provider API keys/models.",
        });
        return;
      }

      throw error;
    }
  });

  app.post("/api/v1/preview/events", (req, res) => {
    const parsed = previewEventSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid preview event payload" });
      return;
    }

    if ((parsed.data.honeypot ?? "").length > 0 || (parsed.data.interactionMs ?? 0) < 700) {
      res.status(400).json({ error: "Human verification failed." });
      return;
    }

    const rateLimitKey = previewClientKey(req);

    try {
      assertWithinPreviewEventRateLimit(rateLimitKey);
    } catch (error) {
      if (error instanceof Error) {
        res.status(429).json({ error: error.message });
        return;
      }
      throw error;
    }

    createPreviewEvent({
      id: randomUUID(),
      sessionId: parsed.data.sessionId,
      eventType: parsed.data.eventType,
      path: parsed.data.path,
      referrer: parsed.data.referrer ?? null,
      metadataJson: JSON.stringify(parsed.data.metadata ?? {}),
    });

    res.status(201).json({ data: { ok: true } });
  });

  app.post("/api/v1/chat", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = chatSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid prompt" });
      return;
    }

    try {
      assertWithinChatRateLimit(authReq.authUser.id);
    } catch (error) {
      if (error instanceof Error) {
        res.status(429).json({ error: error.message });
        return;
      }
      throw error;
    }

    const moderationError = moderatePrompt(parsed.data.prompt);

    if (moderationError) {
      res.status(400).json({ error: moderationError });
      return;
    }

    let answer = "";
    try {
      const effectiveSystemPrompt = await resolveEffectiveSystemPromptForUser(authReq.authUser.id);
      answer = await resolveChatAnswer(
        [
          { role: "system", content: effectiveSystemPrompt },
          { role: "user", content: parsed.data.prompt },
        ],
        chatConfig,
      );
    } catch (error) {
      if (error instanceof ChatProvidersFailedError) {
        recordChatEvent({
          userId: authReq.authUser.id,
          eventType: "message_provider_error",
          payload: {
            route: "/api/v1/chat",
            failures: error.failures,
          },
        });
        res.status(502).json({
          error:
            "Unable to reach configured chat providers. Check CHAT_PROVIDER_ORDER and provider API keys/models.",
        });
        return;
      }

      if (error instanceof Error) {
        res.status(502).json({
          error:
            "Unable to reach configured chat providers. Check CHAT_PROVIDER_ORDER and provider API keys/models.",
        });
        return;
      }
      throw error;
    }

    res.json({ data: { answer } });
  });

  app.get("/api/v1/chat/threads", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = chatThreadListQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    const scope = parsed.data.scope as ChatThreadScope;
    const threads = listChatThreadsByUser(authReq.authUser.id, scope).map((thread) => ({
      ...thread,
      context: toContextTelemetry(thread.context),
    }));
    res.json({ data: threads });
  });

  app.post("/api/v1/chat/threads", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = chatThreadCreateSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid thread payload" });
      return;
    }

    const title = parsed.data.title?.trim() || `Thread ${new Date().toLocaleString()}`;
    const createdThread = createChatThread({
      id: randomUUID(),
      userId: authReq.authUser.id,
      title,
    });
    const threadContext = upsertChatThreadContext({
      threadId: createdThread.id,
      contextCapacity: chatContextConfig.capacity,
      usagePercent: 0,
      estimatedPromptTokens: 0,
      state: "ok",
    });

    createNotification({
      id: randomUUID(),
      userId: authReq.authUser.id,
      title: "New chat thread created",
      body: createdThread.title,
      href: `/chat?thread=${createdThread.id}`,
    });

    res.status(201).json({
      data: {
        ...createdThread,
        context: toContextTelemetry(threadContext),
      },
    });
  });

  app.patch("/api/v1/chat/threads/:id", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = chatThreadPatchSchema.safeParse(req.body);

    if (!parsed.success || (parsed.data.title === undefined && parsed.data.archived === undefined)) {
      res.status(400).json({ error: "Invalid thread patch payload" });
      return;
    }

    const existing = getChatThreadByIdForUser(authReq.authUser.id, req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    const updated = updateChatThread(authReq.authUser.id, req.params.id, parsed.data);

    if (!updated) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    if (
      typeof parsed.data.title === "string" &&
      parsed.data.title.trim() &&
      parsed.data.title.trim() !== existing.title
    ) {
      recordChatEvent({
        userId: authReq.authUser.id,
        threadId: existing.id,
        eventType: "thread_renamed",
        payload: {
          previousTitle: existing.title,
          nextTitle: parsed.data.title.trim(),
        },
      });
    }

    if (parsed.data.archived === true && existing.archived === false) {
      recordChatEvent({
        userId: authReq.authUser.id,
        threadId: existing.id,
        eventType: "thread_archived",
        payload: { threadId: existing.id },
      });
    }

    if (parsed.data.archived === false && existing.archived === true) {
      recordChatEvent({
        userId: authReq.authUser.id,
        threadId: existing.id,
        eventType: "thread_restored",
        payload: { threadId: existing.id },
      });
    }

    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/chat/threads/:id", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const existing = getChatThreadByIdForUser(authReq.authUser.id, req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    const deleted = deleteChatThread(authReq.authUser.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    recordChatEvent({
      userId: authReq.authUser.id,
      eventType: "thread_deleted",
      payload: { threadId: existing.id, title: existing.title },
    });

    res.status(204).send();
  });

  app.get("/api/v1/chat/preferences", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const preferences = getUserCompanionPreferences(authReq.authUser.id);
    res.json({
      data: {
        customInstructions: preferences?.customInstructions ?? "",
      },
    });
  });

  app.patch("/api/v1/chat/preferences", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = chatPreferencesPatchSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid chat preferences payload" });
      return;
    }

    const customInstructions = normalizeCustomInstructions(parsed.data.customInstructions);
    const updated = upsertUserCompanionPreferences(authReq.authUser.id, customInstructions);
    res.json({ data: { customInstructions: updated.customInstructions } });
  });

  app.get("/api/v1/chat/threads/:id/messages", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const messages = listChatMessagesForThread(authReq.authUser.id, req.params.id);

    if (!messages) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    res.json({ data: messages });
  });

  app.post("/api/v1/chat/threads/:id/branch", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = chatThreadBranchSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid branch payload" });
      return;
    }

    const sourceThread = getChatThreadByIdForUser(authReq.authUser.id, req.params.id);
    if (!sourceThread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    const sourceMessages = listChatMessagesForThread(authReq.authUser.id, sourceThread.id);
    if (!sourceMessages || sourceMessages.length === 0) {
      res.status(400).json({ error: "Thread has no messages to branch from." });
      return;
    }

    const cutoffIndex = sourceMessages.findIndex((message) => message.id === parsed.data.messageId);
    if (cutoffIndex < 0) {
      res.status(404).json({ error: "Message not found in this thread." });
      return;
    }

    const copiedMessages = sourceMessages.slice(0, cutoffIndex + 1);
    if (copiedMessages.length === 0) {
      res.status(400).json({ error: "No messages available for branching." });
      return;
    }

    try {
      const baseTitle = sourceThread.title.trim() || "Conversation";
      const branchTitle = `Branch: ${baseTitle}`.slice(0, 120);
      const branchThread = createChatThread({
        id: randomUUID(),
        userId: authReq.authUser.id,
        title: branchTitle,
      });

      for (const sourceMessage of copiedMessages) {
        createChatMessage({
          id: randomUUID(),
          threadId: branchThread.id,
          role: sourceMessage.role,
          content: sourceMessage.content,
        });
      }

      const branchMetadata = createChatThreadBranch({
        id: randomUUID(),
        threadId: branchThread.id,
        sourceThreadId: sourceThread.id,
        sourceMessageId: parsed.data.messageId,
      });

      if (!branchMetadata) {
        res.status(400).json({ error: "Unable to resolve source branch metadata." });
        return;
      }

      recordChatEvent({
        userId: authReq.authUser.id,
        threadId: branchThread.id,
        eventType: "thread_branched",
        payload: {
          sourceThreadId: sourceThread.id,
          sourceMessageId: parsed.data.messageId,
          copiedMessagesCount: copiedMessages.length,
        },
      });

      const effectiveSystemPrompt = await resolveEffectiveSystemPromptForUser(authReq.authUser.id);
      const modelMessages = buildThreadPromptMessages({
        effectiveSystemPrompt,
        summary: "",
        messages: copiedMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });
      const estimatedPromptTokens = estimatePromptTokensForMessages(modelMessages);
      const usagePercent = computeContextUsagePercent(estimatedPromptTokens, chatContextConfig.capacity);
      const state = deriveChatContextState(usagePercent, chatContextConfig);
      const branchContext = upsertChatThreadContext({
        threadId: branchThread.id,
        summary: "",
        summarizedMessageCount: 0,
        estimatedPromptTokens,
        contextCapacity: chatContextConfig.capacity,
        usagePercent,
        state,
        autoSummariesCount: 0,
        lastSummarizedAt: null,
      });

      res.status(201).json({
        data: {
          threadId: branchThread.id,
          href: `/chat?thread=${encodeURIComponent(branchThread.id)}`,
          copiedMessagesCount: copiedMessages.length,
          thread: {
            ...branchThread,
            context: toContextTelemetry(branchContext),
            branch: branchMetadata,
          },
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ error: "Unable to branch thread right now." });
        return;
      }
      throw error;
    }
  });

  app.post("/api/v1/chat/threads/:id/events", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = chatThreadClientEventSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid chat event payload" });
      return;
    }

    const thread = getChatThreadByIdForUser(authReq.authUser.id, req.params.id);
    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    if (parsed.data.messageId) {
      const messages = listChatMessagesForThread(authReq.authUser.id, thread.id) ?? [];
      const hasMessage = messages.some((message) => message.id === parsed.data.messageId);
      if (!hasMessage) {
        res.status(404).json({ error: "Message not found in this thread." });
        return;
      }
    }

    recordChatEvent({
      userId: authReq.authUser.id,
      threadId: thread.id,
      eventType: parsed.data.eventType,
      payload: parsed.data.messageId ? { messageId: parsed.data.messageId } : {},
    });

    res.status(201).json({ data: { ok: true } });
  });

  app.post("/api/v1/chat/threads/:id/context/summarize", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const thread = getChatThreadByIdForUser(authReq.authUser.id, req.params.id);

    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    try {
      const effectiveSystemPrompt = await resolveEffectiveSystemPromptForUser(authReq.authUser.id);
      const allMessages = listChatMessagesForThread(authReq.authUser.id, thread.id) ?? [];
      const persistedContext = getChatThreadContextByThreadId(thread.id);
      const previousState = persistedContext?.state ?? "ok";
      let summary = persistedContext?.summary ?? "";
      let summarizedMessageCount = Math.min(
        Math.max(0, persistedContext?.summarizedMessageCount ?? 0),
        allMessages.length,
      );
      let autoSummariesCount = Math.max(0, persistedContext?.autoSummariesCount ?? 0);
      let lastSummarizedAt = persistedContext?.lastSummarizedAt ?? null;

      const liveMessages = allMessages.slice(summarizedMessageCount);
      const summarizeCount = Math.max(0, liveMessages.length - chatContextConfig.recentRawMessages);
      let summarizedThisTurn = false;
      let summarizedTurnsThisRun = 0;

      if (summarizeCount > 0) {
        const toSummarize = liveMessages.slice(0, summarizeCount);
        if (toSummarize.length > 0) {
          summary = await summarizeConversationMemory({
            existingSummary: summary,
            messages: toSummarize.map((message) => ({
              role: message.role,
              content: message.content,
            })),
            chatConfig,
          });
          summarizedMessageCount = Math.min(allMessages.length, summarizedMessageCount + toSummarize.length);
          autoSummariesCount += 1;
          lastSummarizedAt = new Date().toISOString();
          summarizedThisTurn = true;
          summarizedTurnsThisRun = toSummarize.length;
        }
      }

      const nextLiveMessages = allMessages.slice(summarizedMessageCount);
      const modelMessages = buildThreadPromptMessages({
        effectiveSystemPrompt,
        summary,
        messages: nextLiveMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });
      const estimatedPromptTokens = estimatePromptTokensForMessages(modelMessages);
      const usagePercent = computeContextUsagePercent(
        estimatedPromptTokens,
        chatContextConfig.capacity,
      );
      const state = deriveChatContextState(usagePercent, chatContextConfig);
      const persistedUpdate = upsertChatThreadContext({
        threadId: thread.id,
        summary,
        summarizedMessageCount,
        estimatedPromptTokens,
        contextCapacity: chatContextConfig.capacity,
        usagePercent,
        state,
        autoSummariesCount,
        lastSummarizedAt,
      });

      if (summarizedThisTurn) {
        recordChatEvent({
          userId: authReq.authUser.id,
          threadId: thread.id,
          eventType: "context_manual_summarized",
          payload: {
            summarizedMessageCount,
            summarizedTurns: summarizedTurnsThisRun,
            usagePercent,
            estimatedPromptTokens,
          },
        });
      }

      if (state === "warning" && previousState === "ok") {
        recordChatEvent({
          userId: authReq.authUser.id,
          threadId: thread.id,
          eventType: "context_warning",
          payload: {
            usagePercent,
            estimatedPromptTokens,
            contextCapacity: chatContextConfig.capacity,
          },
        });
      }

      if (state === "degraded" && previousState !== "degraded") {
        recordChatEvent({
          userId: authReq.authUser.id,
          threadId: thread.id,
          eventType: "context_degraded",
          payload: {
            usagePercent,
            estimatedPromptTokens,
            contextCapacity: chatContextConfig.capacity,
          },
        });
      }

      const notice =
        state === "degraded"
          ? contextNoticeMessage({ state, summarizedThisTurn }) ??
            "Context window is near full capacity. Start a new conversation for best continuity."
          : summarizedThisTurn
          ? "Context summarized manually to preserve long-term memory efficiency."
          : `No compaction yet. Keep at least ${chatContextConfig.recentRawMessages} recent messages raw.`;

      res.json({
        data: {
          context: {
            ...toContextTelemetry(persistedUpdate),
            summarizedThisTurn,
            notice,
          },
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(502).json({
          error:
            "Unable to summarize thread context right now. Retry in a moment.",
        });
        return;
      }
      throw error;
    }
  });

  app.post("/api/v1/chat/threads/:id/messages", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = chatSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid prompt" });
      return;
    }

    const thread = getChatThreadByIdForUser(authReq.authUser.id, req.params.id);

    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    if (thread.archived) {
      res.status(400).json({ error: "Thread is archived. Restore it before sending new messages." });
      return;
    }

    try {
      assertWithinChatRateLimit(authReq.authUser.id);
    } catch (error) {
      if (error instanceof Error) {
        res.status(429).json({ error: error.message });
        return;
      }
      throw error;
    }

    const moderationError = moderatePrompt(parsed.data.prompt);

    if (moderationError) {
      res.status(400).json({ error: moderationError });
      return;
    }

    const isUntitledThread = /^Thread\b/i.test(thread.title);
    const existingMessages = listChatMessagesForThread(authReq.authUser.id, thread.id);
    const isFirstMessage = (existingMessages?.length ?? 0) === 0;

    createChatMessage({
      id: randomUUID(),
      threadId: thread.id,
      role: "user",
      content: parsed.data.prompt,
    });

    if (isFirstMessage) {
      recordChatEvent({
        userId: authReq.authUser.id,
        threadId: thread.id,
        eventType: "thread_first_message_created",
        payload: { threadId: thread.id },
      });
    }

    let answer = "";
    let responseContext: ChatThreadContextTelemetry & {
      summarizedThisTurn: boolean;
      notice: string | null;
    } = {
      summarizedMessageCount: thread.context.summarizedMessageCount,
      estimatedPromptTokens: thread.context.estimatedPromptTokens,
      contextCapacity: thread.context.contextCapacity,
      usagePercent: thread.context.usagePercent,
      state: thread.context.state,
      autoSummariesCount: thread.context.autoSummariesCount,
      lastSummarizedAt: thread.context.lastSummarizedAt,
      updatedAt: thread.context.updatedAt,
      summarizedThisTurn: false,
      notice: null,
    };
    try {
      const effectiveSystemPrompt = await resolveEffectiveSystemPromptForUser(authReq.authUser.id);
      const allMessages = listChatMessagesForThread(authReq.authUser.id, thread.id) ?? [];
      const persistedContext = getChatThreadContextByThreadId(thread.id);
      const previousState = persistedContext?.state ?? "ok";
      let summary = persistedContext?.summary ?? "";
      let summarizedMessageCount = Math.min(
        Math.max(0, persistedContext?.summarizedMessageCount ?? 0),
        allMessages.length,
      );
      let autoSummariesCount = Math.max(0, persistedContext?.autoSummariesCount ?? 0);
      let lastSummarizedAt = persistedContext?.lastSummarizedAt ?? null;
      let summarizedThisTurn = false;

      const buildState = () => {
        const liveMessages = allMessages.slice(summarizedMessageCount);
        const modelMessages = buildThreadPromptMessages({
          effectiveSystemPrompt,
          summary,
          messages: liveMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        });
        const estimatedPromptTokens = estimatePromptTokensForMessages(modelMessages);
        const usagePercent = computeContextUsagePercent(
          estimatedPromptTokens,
          chatContextConfig.capacity,
        );
        return { liveMessages, modelMessages, estimatedPromptTokens, usagePercent };
      };

      let built = buildState();

      if (
        built.usagePercent >= chatContextConfig.summarizePercent &&
        built.liveMessages.length > chatContextConfig.recentRawMessages
      ) {
        const summarizeCount = built.liveMessages.length - chatContextConfig.recentRawMessages;
        const toSummarize = built.liveMessages.slice(0, summarizeCount);

        if (toSummarize.length > 0) {
          summary = await summarizeConversationMemory({
            existingSummary: summary,
            messages: toSummarize.map((message) => ({
              role: message.role,
              content: message.content,
            })),
            chatConfig,
          });

          summarizedMessageCount = Math.min(allMessages.length, summarizedMessageCount + toSummarize.length);
          autoSummariesCount += 1;
          lastSummarizedAt = new Date().toISOString();
          summarizedThisTurn = true;
          built = buildState();
        }
      }

      const state = deriveChatContextState(built.usagePercent, chatContextConfig);
      const persistedUpdate = upsertChatThreadContext({
        threadId: thread.id,
        summary,
        summarizedMessageCount,
        estimatedPromptTokens: built.estimatedPromptTokens,
        contextCapacity: chatContextConfig.capacity,
        usagePercent: built.usagePercent,
        state,
        autoSummariesCount,
        lastSummarizedAt,
      });

      if (summarizedThisTurn) {
        recordChatEvent({
          userId: authReq.authUser.id,
          threadId: thread.id,
          eventType: "context_auto_summarized",
          payload: {
            summarizedMessageCount,
            usagePercent: built.usagePercent,
            estimatedPromptTokens: built.estimatedPromptTokens,
          },
        });
      }

      if (state === "warning" && previousState === "ok") {
        recordChatEvent({
          userId: authReq.authUser.id,
          threadId: thread.id,
          eventType: "context_warning",
          payload: {
            usagePercent: built.usagePercent,
            estimatedPromptTokens: built.estimatedPromptTokens,
            contextCapacity: chatContextConfig.capacity,
          },
        });
      }

      if (state === "degraded" && previousState !== "degraded") {
        recordChatEvent({
          userId: authReq.authUser.id,
          threadId: thread.id,
          eventType: "context_degraded",
          payload: {
            usagePercent: built.usagePercent,
            estimatedPromptTokens: built.estimatedPromptTokens,
            contextCapacity: chatContextConfig.capacity,
          },
        });
      }

      answer = await resolveChatAnswer(built.modelMessages, chatConfig);
      responseContext = {
        ...toContextTelemetry(persistedUpdate),
        summarizedThisTurn,
        notice: contextNoticeMessage({ state, summarizedThisTurn }),
      };
    } catch (error) {
      if (error instanceof ChatProvidersFailedError) {
        recordChatEvent({
          userId: authReq.authUser.id,
          threadId: thread.id,
          eventType: "message_provider_error",
          payload: {
            route: "/api/v1/chat/threads/:id/messages",
            failures: error.failures,
          },
        });
        res.status(502).json({
          error:
            "Unable to reach configured chat providers. Check CHAT_PROVIDER_ORDER and provider API keys/models.",
        });
        return;
      }

      if (error instanceof Error) {
        res.status(502).json({
          error:
            "Unable to reach configured chat providers. Check CHAT_PROVIDER_ORDER and provider API keys/models.",
        });
        return;
      }
      throw error;
    }

    createChatMessage({
      id: randomUUID(),
      threadId: thread.id,
      role: "assistant",
      content: answer,
    });

    res.status(201).json({ data: { answer, context: responseContext } });

    if (!isUntitledThread) {
      return;
    }

    void (async () => {
      try {
        const generatedTitle = await resolveChatThreadTitle(parsed.data.prompt, answer, chatConfig);
        if (!generatedTitle || generatedTitle === thread.title) {
          return;
        }

        const updated = updateChatThread(authReq.authUser.id, thread.id, {
          title: generatedTitle,
        });

        if (!updated) {
          return;
        }

        recordChatEvent({
          userId: authReq.authUser.id,
          threadId: thread.id,
          eventType: "thread_auto_titled",
          payload: {
            previousTitle: thread.title,
            nextTitle: generatedTitle,
          },
        });
      } catch (error) {
        console.warn(
          `[chat] Unable to auto-title thread "${thread.id}": ${
            error instanceof Error ? error.message : "unknown error"
          }`,
        );
      }
    })();
  });

  app.post("/api/v1/progress/complete", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = contentCompletionSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid completion payload" });
      return;
    }

    const completion = trackContentCompletionByUser(authReq.authUser.id, parsed.data);
    const completionSummary = getUserContentCompletionSummary(authReq.authUser.id);
    const contentTitle =
      parsed.data.contentKind === "lesson"
        ? (getLibraryLessonBySlug(parsed.data.contentSlug)?.title ?? slugToTitle(parsed.data.contentSlug))
        : (getPracticeRoutineBySlug(parsed.data.contentSlug)?.title ?? slugToTitle(parsed.data.contentSlug));
    const contentHref =
      parsed.data.contentKind === "lesson"
        ? `/library/${parsed.data.contentSlug}`
        : `/practices/${parsed.data.contentSlug}`;

    maybeCreateBehaviorNotification({
      userId: authReq.authUser.id,
      title: parsed.data.contentKind === "lesson" ? "Lesson completed" : "Practice completed",
      body: `"${contentTitle}" logged as complete. Keep your momentum today.`,
      href: contentHref,
      dedupeWithinHours: 18,
    });

    if (completionSummary.lessonsCompleted === 1) {
      maybeCreateBehaviorNotification({
        userId: authReq.authUser.id,
        title: "Milestone unlocked: first lesson",
        body: "You completed your first lesson. Apply one principle in your next decision.",
        href: "/library",
        dedupeWithinHours: 24 * 14,
      });
    }

    if (completionSummary.lessonsCompleted > 0 && completionSummary.lessonsCompleted % 3 === 0) {
      maybeCreateBehaviorNotification({
        userId: authReq.authUser.id,
        title: `Milestone unlocked: ${completionSummary.lessonsCompleted} lessons`,
        body: "Strong consistency. Turn one insight into action before the day ends.",
        href: "/library",
        dedupeWithinHours: 24 * 14,
      });
    }

    if (
      completionSummary.practicesCompletedThisWeek > 0 &&
      completionSummary.practicesCompletedThisWeek % 3 === 0
    ) {
      maybeCreateBehaviorNotification({
        userId: authReq.authUser.id,
        title: "Weekly practice streak",
        body: `You completed ${completionSummary.practicesCompletedThisWeek} practices this week.`,
        href: "/practices",
        dedupeWithinHours: 24 * 7,
      });
    }

    res.status(201).json({
      data: {
        id: completion.id,
        contentKind: completion.contentKind,
        contentSlug: completion.contentSlug,
        completionCount: completion.completionCount,
        lastCompletedAt: completion.lastCompletedAt,
      },
    });
  });

  app.get("/api/v1/progress/completions", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = z
      .object({
        limit: z.coerce.number().int().positive().max(500).default(300),
      })
      .safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    const completions = listContentCompletionsByUser(authReq.authUser.id, parsed.data.limit).map((item) => ({
      id: item.id,
      contentKind: item.contentKind,
      contentSlug: item.contentSlug,
      completionCount: item.completionCount,
      lastCompletedAt: item.lastCompletedAt,
    }));

    res.json({ data: completions });
  });

  app.get("/api/v1/progress/rewards", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const entriesCount = countJournalEntriesByUser(authReq.authUser.id);
    const progressEntries = listJournalEntriesByUser(authReq.authUser.id, 365);
    const completionSummary = getUserContentCompletionSummary(authReq.authUser.id);
    const completionRows = listContentCompletionsByUser(authReq.authUser.id, 500);
    const progress = computeDashboardProgress(progressEntries);

    const rewards = buildRewardsProgress({
      entriesCount,
      streakDays: progress.streakDays,
      lessonsCompleted: completionSummary.lessonsCompleted,
      completionRows,
    });

    res.json({ data: rewards });
  });

  app.get("/api/v1/dashboard/summary", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const entriesCount = countJournalEntriesByUser(authReq.authUser.id);
    const latestEntries = listJournalEntriesByUser(authReq.authUser.id, 3);
    const progressEntries = listJournalEntriesByUser(authReq.authUser.id, 365);
    const completionSummary = getUserContentCompletionSummary(authReq.authUser.id);
    const recentCompletionRows = listRecentContentCompletionsByUser(authReq.authUser.id, 4);
    const recentCompletions = recentCompletionRows.map((item) => {
      if (item.contentKind === "lesson") {
        const lesson = getLibraryLessonBySlug(item.contentSlug);

        return {
          contentKind: item.contentKind,
          contentSlug: item.contentSlug,
          title: lesson?.title ?? slugToTitle(item.contentSlug),
          completedAt: item.lastCompletedAt,
          href: `/library/${item.contentSlug}`,
        };
      }

      const practice = getPracticeRoutineBySlug(item.contentSlug);

      return {
        contentKind: item.contentKind,
        contentSlug: item.contentSlug,
        title: practice?.title ?? slugToTitle(item.contentSlug),
        completedAt: item.lastCompletedAt,
        href: `/practices/${item.contentSlug}`,
      };
    });
    const progress = {
      ...computeDashboardProgress(progressEntries),
      ...completionSummary,
      recentCompletions,
    };

    if ((progress.daysSinceLastEntry ?? 0) >= 2) {
      maybeCreateBehaviorNotification({
        userId: authReq.authUser.id,
        title: "Momentum check-in",
        body: "You have been away for a couple of days. A 2-minute reflection can restart momentum.",
        href: "/journal?title=Restart%20check-in&mood=Restless",
        dedupeWithinHours: 36,
      });
    }

    if (entriesCount > 0 && progress.reflectionsThisWeek === 0) {
      maybeCreateBehaviorNotification({
        userId: authReq.authUser.id,
        title: "Weekly reflection reminder",
        body: "No reflection logged in the last 7 days. Capture one small check-in today.",
        href: "/journal?title=Weekly%20reset&mood=Grounded",
        dedupeWithinHours: 72,
      });
    }

    res.json({
      data: {
        entriesCount,
        latestEntries,
        progress,
      },
    });
  });

  app.get("/api/v1/journal", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;

    const querySchema = z.object({
      limit: z.coerce.number().int().positive().max(50).default(12),
    });

    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    const entries = listJournalEntriesByUser(authReq.authUser.id, parsed.data.limit);
    res.json({ data: entries });
  });

  app.post("/api/v1/journal", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = journalSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid journal payload" });
      return;
    }

    createJournalEntry({
      id: randomUUID(),
      userId: authReq.authUser.id,
      title: parsed.data.title,
      body: parsed.data.body,
      mood: parsed.data.mood,
    });

    res.status(201).json({ data: { ok: true } });
  });

  app.get("/api/v1/reflections", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const querySchema = z.object({
      page: z.coerce.number().int().positive().max(10_000).default(1),
      pageSize: z.coerce.number().int().positive().max(30).default(12),
      q: z.string().trim().min(1).max(120).optional(),
      favorite: z
        .enum(["true", "false"])
        .transform((value) => value === "true")
        .optional(),
      status: z.enum(["draft", "processing", "ready", "failed"]).optional(),
    });
    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    const data = reflectionService.listReflections(authReq.authUser.id, {
      page: parsed.data.page,
      pageSize: parsed.data.pageSize,
      search: parsed.data.q,
      favoriteOnly: parsed.data.favorite,
      status: parsed.data.status as ReflectionStatus | undefined,
    });

    res.json({ data });
  });

  app.post("/api/v1/reflections", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = reflectionCreateSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid reflection payload" });
      return;
    }

    try {
      const created = await reflectionService.createReflection(
        authReq.authUser.id,
        parsed.data as ReflectionCreateInput,
      );
      res.status(201).json({ data: created });
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message;
        const status = message.toLowerCase().includes("unavailable") ? 503 : 400;
        res.status(status).json({ error: message });
        return;
      }
      throw error;
    }
  });

  app.get("/api/v1/reflections/:id", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid reflection id" });
      return;
    }

    const reflection = reflectionService.getReflection(authReq.authUser.id, parsed.data.id);
    if (!reflection) {
      res.status(404).json({ error: "Reflection not found" });
      return;
    }

    res.json({ data: reflection });
  });

  app.patch("/api/v1/reflections/:id", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const params = z.object({ id: z.string().uuid() }).safeParse(req.params);
    const parsed = reflectionPatchSchema.safeParse(req.body);

    if (!params.success) {
      res.status(400).json({ error: "Invalid reflection id" });
      return;
    }

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid reflection patch payload" });
      return;
    }

    const updated = reflectionService.updateReflection(authReq.authUser.id, params.data.id, parsed.data);
    if (!updated) {
      res.status(404).json({ error: "Reflection not found" });
      return;
    }

    res.json({ data: updated });
  });

  app.delete("/api/v1/reflections/:id", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid reflection id" });
      return;
    }

    const deleted = reflectionService.deleteReflection(authReq.authUser.id, parsed.data.id);
    if (!deleted) {
      res.status(404).json({ error: "Reflection not found" });
      return;
    }

    res.status(204).send();
  });

  app.post("/api/v1/reflections/:id/commentary/regenerate", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid reflection id" });
      return;
    }

    try {
      const reflection = await reflectionService.regenerateCommentary(authReq.authUser.id, parsed.data.id);
      if (!reflection) {
        res.status(404).json({ error: "Reflection not found" });
        return;
      }
      res.json({ data: reflection });
    } catch (error) {
      if (error instanceof Error) {
        res.status(502).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  app.post("/api/v1/reflections/:id/retry", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid reflection id" });
      return;
    }

    const reflection = reflectionService.retryProcessing(authReq.authUser.id, parsed.data.id);
    if (!reflection) {
      res.status(404).json({ error: "Reflection not found" });
      return;
    }

    res.json({ data: reflection });
  });

  app.post("/api/v1/reflections/:id/send-to-companion", requireAuth, async (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid reflection id" });
      return;
    }

    try {
      const result = reflectionService.sendToCompanion(authReq.authUser.id, parsed.data.id);
      if (!result) {
        res.status(404).json({ error: "Reflection not found" });
        return;
      }

      await generateAssistantReplyForLatestUserMessage({
        userId: authReq.authUser.id,
        threadId: result.threadId,
        providerErrorRoute: "/api/v1/reflections/:id/send-to-companion",
      });

      res.status(201).json({ data: result });
    } catch (error) {
      if (error instanceof RouteHttpError) {
        res.status(error.status).json({ error: error.message });
        return;
      }
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
        return;
      }
      throw error;
    }
  });

  app.get("/api/v1/reflections/:id/audio", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = z.object({ id: z.string().uuid() }).safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid reflection id" });
      return;
    }

    const audio = reflectionService.resolveAudioForPlayback(authReq.authUser.id, parsed.data.id);
    if (!audio) {
      res.status(404).json({ error: "Audio asset not found" });
      return;
    }

    const safeFileName = audio.fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
    res.setHeader("Content-Type", audio.mimeType);
    res.setHeader("Cache-Control", "private, max-age=60");
    res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);

    const stream = createReadStream(audio.filePath);
    stream.on("error", (error) => {
      console.warn(
        `[reflections] Unable to stream audio for reflection ${parsed.data.id}: ${
          error instanceof Error ? error.message : "unknown error"
        }`,
      );
      if (!res.headersSent) {
        res.status(404).json({ error: "Audio asset not found" });
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  });

  app.get("/api/v1/content/landing", (_req, res) => {
    res.json({ data: getLandingContent() });
  });

  app.get("/api/v1/content/library", (req, res) => {
    const querySchema = z.object({
      q: z.string().trim().min(1).max(80).optional(),
    });

    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    res.json({ data: getLibraryLessons(parsed.data.q) });
  });

  app.get("/api/v1/content/library/:slug", (req, res) => {
    const parsed = z
      .object({
        slug: z.string().trim().min(3).max(80),
      })
      .safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid slug parameter" });
      return;
    }

    const lesson = getLibraryLessonBySlug(parsed.data.slug);

    if (!lesson) {
      res.status(404).json({ error: "Lesson not found" });
      return;
    }

    res.json({ data: lesson });
  });

  app.get("/api/v1/content/practices", (_req, res) => {
    res.json({ data: getPracticeRoutines() });
  });

  app.get("/api/v1/content/practices/:slug", (req, res) => {
    const parsed = z
      .object({
        slug: z.string().trim().min(3).max(80),
      })
      .safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid slug parameter" });
      return;
    }

    const routine = getPracticeRoutineBySlug(parsed.data.slug);

    if (!routine) {
      res.status(404).json({ error: "Practice not found" });
      return;
    }

    res.json({ data: routine });
  });

  app.get("/api/v1/content/community", (_req, res) => {
    res.json({ data: getCommunityCircles() });
  });

  app.get("/api/v1/content/challenges", (_req, res) => {
    res.json({ data: getCommunityChallenges() });
  });

  app.get("/api/v1/content/resources", (_req, res) => {
    res.json({ data: getCommunityResources() });
  });

  app.get("/api/v1/content/experts", (_req, res) => {
    res.json({ data: getCommunityExperts() });
  });

  app.get("/api/v1/content/events", (_req, res) => {
    res.json({ data: getCommunityEvents() });
  });

  app.get("/api/v1/content/videos", (_req, res) => {
    res.json({ data: getCreatorVideos() });
  });

  app.get("/api/v1/academy", (_req, res) => {
    res.json({
      data: {
        overview: getAcademyKnowledgeOverview(),
        featuredPaths: getAcademyPaths({
          featuredOnly: true,
          includeItems: false,
          limit: 6,
        }),
      },
    });
  });

  app.get("/api/v1/academy/domains", (req, res) => {
    const parsed = academyDomainsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    res.json({
      data: getAcademyDomains({
        q: parsed.data.q,
        limit: parsed.data.limit,
      }),
    });
  });

  app.get("/api/v1/academy/domains/:slug", (req, res) => {
    const parsed = academySlugParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid slug parameter" });
      return;
    }

    const domain = getAcademyDomainBySlug(parsed.data.slug);
    if (!domain) {
      res.status(404).json({ error: "Domain not found" });
      return;
    }

    const traditions = getAcademyTraditions({ domainId: domain.id, limit: 200 });
    res.json({ data: { domain, traditions } });
  });

  app.get("/api/v1/academy/traditions", (req, res) => {
    const parsed = academyTraditionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    let domainId = parsed.data.domainId;
    if (!domainId && parsed.data.domain) {
      const domain = getAcademyDomainBySlug(parsed.data.domain);
      if (!domain) {
        res.json({ data: [] });
        return;
      }
      domainId = domain.id;
    }

    res.json({
      data: getAcademyTraditions({
        q: parsed.data.q,
        limit: parsed.data.limit,
        domainId,
        parentTraditionId: parsed.data.parentTraditionId,
      }),
    });
  });

  app.get("/api/v1/academy/traditions/:slug", (req, res) => {
    const parsed = academySlugParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid slug parameter" });
      return;
    }

    const tradition = getAcademyTraditionBySlug(parsed.data.slug);
    if (!tradition) {
      res.status(404).json({ error: "Tradition not found" });
      return;
    }

    const persons = getAcademyPersons({ traditionId: tradition.id, limit: 120 });
    const works = getAcademyWorks({ traditionId: tradition.id, limit: 120 });
    const concepts = getAcademyConcepts({ traditionId: tradition.id, limit: 120 });

    res.json({
      data: {
        tradition,
        persons,
        works,
        concepts,
      },
    });
  });

  app.get("/api/v1/academy/persons", (req, res) => {
    const parsed = academyPersonsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    res.json({
      data: getAcademyPersons({
        q: parsed.data.q,
        limit: parsed.data.limit,
        traditionId: parsed.data.traditionId,
        domainId: parsed.data.domainId,
        credibilityBand: parsed.data.credibilityBand,
      }),
    });
  });

  app.get("/api/v1/academy/persons/:slug", (req, res) => {
    const parsed = academySlugParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid slug parameter" });
      return;
    }

    const person = getAcademyPersonBySlug(parsed.data.slug);
    if (!person) {
      res.status(404).json({ error: "Person not found" });
      return;
    }

    const works = getAcademyWorks({ personId: person.id, limit: 120 });
    const concepts = getAcademyConcepts({ personId: person.id, limit: 120 });
    const relationships = getAcademyPersonRelationships({ personId: person.id, limit: 120 });

    res.json({
      data: {
        person,
        works,
        concepts,
        relationships,
      },
    });
  });

  app.get("/api/v1/academy/works", (req, res) => {
    const parsed = academyWorksQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    res.json({
      data: getAcademyWorks({
        q: parsed.data.q,
        limit: parsed.data.limit,
        personId: parsed.data.personId,
        traditionId: parsed.data.traditionId,
        isPrimaryText: parsed.data.isPrimaryText,
      }),
    });
  });

  app.get("/api/v1/academy/works/:slug", (req, res) => {
    const parsed = academySlugParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid slug parameter" });
      return;
    }

    const work = getAcademyWorkBySlug(parsed.data.slug);
    if (!work) {
      res.status(404).json({ error: "Work not found" });
      return;
    }

    const author = work.personId ? getAcademyPersonById(work.personId) : null;
    const tradition = work.traditionId ? getAcademyTraditionById(work.traditionId) : null;
    const concepts = getAcademyConcepts({ workId: work.id, limit: 120 });
    const relatedWorks = getAcademyWorks({
      traditionId: work.traditionId ?? undefined,
      personId: work.personId ?? undefined,
      limit: 24,
    }).filter((candidate) => candidate.id !== work.id);

    res.json({
      data: {
        work,
        author: author ?? null,
        tradition: tradition ?? null,
        concepts,
        relatedWorks,
      },
    });
  });

  app.get("/api/v1/academy/concepts", (req, res) => {
    const parsed = academyConceptsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    res.json({
      data: getAcademyConcepts({
        q: parsed.data.q,
        limit: parsed.data.limit,
        conceptFamily: parsed.data.family,
        traditionId: parsed.data.traditionId,
        personId: parsed.data.personId,
        workId: parsed.data.workId,
      }),
    });
  });

  app.get("/api/v1/academy/concepts/:slug", (req, res) => {
    const parsed = academySlugParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid slug parameter" });
      return;
    }

    const concept = getAcademyConceptBySlug(parsed.data.slug);
    if (!concept) {
      res.status(404).json({ error: "Concept not found" });
      return;
    }

    const links = getAcademyConceptLinksBySlug(parsed.data.slug);
    res.json({
      data: {
        concept,
        links,
      },
    });
  });

  app.get("/api/v1/academy/concepts/:slug/links", (req, res) => {
    const parsed = academySlugParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid slug parameter" });
      return;
    }

    const links = getAcademyConceptLinksBySlug(parsed.data.slug);
    if (!links) {
      res.status(404).json({ error: "Concept links not found" });
      return;
    }

    res.json({ data: links });
  });

  app.get("/api/v1/academy/paths", (req, res) => {
    const parsed = academyPathsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    res.json({
      data: getAcademyPaths({
        q: parsed.data.q,
        featuredOnly: parsed.data.featured,
        includeItems: parsed.data.includeItems,
        limit: parsed.data.limit,
      }),
    });
  });

  app.get("/api/v1/academy/paths/:slug", (req, res) => {
    const parsed = academySlugParamSchema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid slug parameter" });
      return;
    }

    const path = getAcademyPathBySlug(parsed.data.slug);
    if (!path) {
      res.status(404).json({ error: "Path not found" });
      return;
    }

    res.json({ data: path });
  });

  app.get("/api/v1/academy/search", (req, res) => {
    const parsed = academySearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    res.json({
      data: searchAcademyKnowledge(parsed.data.q, parsed.data.limit),
    });
  });

  app.post("/api/v1/academy/query", requireAuth, (req, res) => {
    const parsed = academyInternalQuerySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query payload" });
      return;
    }

    res.json({ data: queryAcademyKnowledge(parsed.data) });
  });

  app.get("/api/v1/admin/academy/curation", requireAuth, requireAdmin, (req, res) => {
    const parsed = academyAdminCurationQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    res.json({
      data: getAcademyCurationSnapshot({
        limit: parsed.data.limit,
      }),
    });
  });

  app.patch("/api/v1/admin/academy/paths/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const params = academyAdminIdParamSchema.safeParse(req.params);
    const parsed = academyAdminPathPatchSchema.safeParse(req.body);

    if (!params.success) {
      res.status(400).json({ error: "Invalid path id" });
      return;
    }

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid path patch payload" });
      return;
    }

    const updated = updateAcademyPathCuration(params.data.id, parsed.data);
    if (!updated) {
      res.status(404).json({ error: "Path not found" });
      return;
    }

    auditAdminAction(
      authReq,
      "academy_path_updated",
      "academy_path",
      String(params.data.id),
      parsed.data,
    );

    res.json({ data: updated });
  });

  app.put("/api/v1/admin/academy/paths/:id/items", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const params = academyAdminIdParamSchema.safeParse(req.params);
    const parsed = academyAdminPathItemsSchema.safeParse(req.body);

    if (!params.success) {
      res.status(400).json({ error: "Invalid path id" });
      return;
    }

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid path items payload" });
      return;
    }

    const updated = replaceAcademyPathItems(params.data.id, parsed.data.items);
    if (!updated) {
      res.status(404).json({ error: "Path not found" });
      return;
    }

    auditAdminAction(
      authReq,
      "academy_path_items_replaced",
      "academy_path",
      String(params.data.id),
      {
        itemCount: parsed.data.items.length,
      },
    );

    res.json({ data: updated });
  });

  app.patch("/api/v1/admin/academy/persons/:id/editorial", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const params = academyAdminIdParamSchema.safeParse(req.params);
    const parsed = academyAdminPersonEditorialSchema.safeParse(req.body);

    if (!params.success) {
      res.status(400).json({ error: "Invalid person id" });
      return;
    }

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid editorial payload" });
      return;
    }

    const updated = updateAcademyPersonEditorialMetadata(params.data.id, parsed.data);
    if (!updated) {
      res.status(404).json({ error: "Person not found" });
      return;
    }

    auditAdminAction(
      authReq,
      "academy_person_editorial_updated",
      "academy_person",
      String(params.data.id),
      parsed.data,
    );

    res.json({ data: updated });
  });

  app.post("/api/v1/admin/academy/relationships/persons", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = academyAdminPersonRelationshipSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid relationship payload" });
      return;
    }

    if (parsed.data.sourcePersonId === parsed.data.targetPersonId) {
      res.status(400).json({ error: "sourcePersonId and targetPersonId must be different" });
      return;
    }

    const source = getAcademyPersonById(parsed.data.sourcePersonId);
    const target = getAcademyPersonById(parsed.data.targetPersonId);
    if (!source || !target) {
      res.status(404).json({ error: "Related person not found" });
      return;
    }

    const relationship = upsertAcademyPersonRelationship(parsed.data);
    if (!relationship) {
      res.status(400).json({ error: "Unable to upsert relationship" });
      return;
    }

    auditAdminAction(
      authReq,
      "academy_person_relationship_upserted",
      "academy_person_relationship",
      String(relationship.id),
      parsed.data,
    );

    res.json({ data: relationship });
  });

  app.delete("/api/v1/admin/academy/relationships/persons/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const params = academyAdminIdParamSchema.safeParse(req.params);

    if (!params.success) {
      res.status(400).json({ error: "Invalid relationship id" });
      return;
    }

    const deleted = deleteAcademyPersonRelationshipById(params.data.id);
    if (!deleted) {
      res.status(404).json({ error: "Relationship not found" });
      return;
    }

    auditAdminAction(
      authReq,
      "academy_person_relationship_deleted",
      "academy_person_relationship",
      String(params.data.id),
      {},
    );

    res.json({ data: { ok: true } });
  });

  app.post("/api/v1/admin/academy/relationships/concepts", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = academyAdminConceptRelationSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid concept relation payload" });
      return;
    }

    const concept = getAcademyConceptById(parsed.data.conceptId);
    if (!concept) {
      res.status(404).json({ error: "Concept not found" });
      return;
    }

    let targetExists = false;
    if (parsed.data.entityType === "tradition") {
      targetExists = Boolean(getAcademyTraditionById(parsed.data.entityId));
    } else if (parsed.data.entityType === "person") {
      targetExists = Boolean(getAcademyPersonById(parsed.data.entityId));
    } else if (parsed.data.entityType === "work") {
      targetExists = Boolean(getAcademyWorkById(parsed.data.entityId));
    }

    if (!targetExists) {
      res.status(404).json({ error: "Related entity not found" });
      return;
    }

    upsertAcademyConceptRelation({
      conceptId: parsed.data.conceptId,
      entityType: parsed.data.entityType as AcademyConceptRelationEntityType,
      entityId: parsed.data.entityId,
      sortOrder: parsed.data.sortOrder,
    });

    auditAdminAction(
      authReq,
      "academy_concept_relation_upserted",
      "academy_concept_relation",
      `${parsed.data.conceptId}:${parsed.data.entityType}:${parsed.data.entityId}`,
      parsed.data,
    );

    res.json({
      data: {
        ok: true,
        links: getAcademyConceptLinksBySlug(concept.slug),
      },
    });
  });

  app.delete("/api/v1/admin/academy/relationships/concepts", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = academyAdminConceptRelationSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid concept relation payload" });
      return;
    }

    const deleted = deleteAcademyConceptRelation({
      conceptId: parsed.data.conceptId,
      entityType: parsed.data.entityType as AcademyConceptRelationEntityType,
      entityId: parsed.data.entityId,
    });

    if (!deleted) {
      res.status(404).json({ error: "Concept relation not found" });
      return;
    }

    auditAdminAction(
      authReq,
      "academy_concept_relation_deleted",
      "academy_concept_relation",
      `${parsed.data.conceptId}:${parsed.data.entityType}:${parsed.data.entityId}`,
      parsed.data,
    );

    res.json({ data: { ok: true } });
  });

  app.get("/api/v1/admin/content", requireAuth, requireAdmin, (_req, res) => {
    res.json({ data: listAllContentAdmin() });
  });

  app.get("/api/v1/admin/audit", requireAuth, requireAdmin, (req, res) => {
    const parsed = z
      .object({
        limit: z.coerce.number().int().positive().max(200).default(40),
      })
      .safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    res.json({ data: listAdminAuditLogs(parsed.data.limit) });
  });

  app.get("/api/v1/admin/chat/events", requireAuth, requireAdmin, (req, res) => {
    const parsed = adminChatEventsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    const memoryOnlyEventTypes = CHAT_MEMORY_EVENT_TYPES.map(
      (eventType) => eventType as ChatEventType,
    );
    let eventTypes: ChatEventType[] | undefined;

    if (parsed.data.memoryOnly) {
      eventTypes = [...memoryOnlyEventTypes];
    }

    if (parsed.data.eventType) {
      const selected = parsed.data.eventType as ChatEventType;
      eventTypes = eventTypes ? eventTypes.filter((eventType) => eventType === selected) : [selected];
    }

    if (eventTypes && eventTypes.length === 0) {
      res.json({ data: [] });
      return;
    }

    const sinceCreatedAt =
      typeof parsed.data.days === "number"
        ? new Date(Date.now() - parsed.data.days * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

    res.json({
      data: listChatEvents({
        limit: parsed.data.limit,
        threadId: parsed.data.threadId,
        userId: parsed.data.userId,
        eventTypes,
        sinceCreatedAt,
      }),
    });
  });

  app.get("/api/v1/admin/preview/analytics", requireAuth, requireAdmin, (req, res) => {
    const parsed = adminPreviewAnalyticsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    const events = listPreviewEventsByDays(parsed.data.days);
    const previewViewSessions = new Set(
      events
        .filter((event) => event.eventType === "preview_page_view")
        .map((event) => event.sessionId),
    );
    const signupViewSessions = new Set(
      events
        .filter((event) => event.eventType === "preview_signup_view")
        .map((event) => event.sessionId),
    );

    const countsByType = events.reduce<Record<string, number>>((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
      return acc;
    }, {});

    const sessionsPreviewed = previewViewSessions.size;
    const sessionsReachedSignup = signupViewSessions.size;
    const signupConversionRate =
      sessionsPreviewed > 0 ? Number((sessionsReachedSignup / sessionsPreviewed).toFixed(4)) : 0;

    res.json({
      data: {
        days: parsed.data.days,
        totals: {
          events: events.length,
          sessionsPreviewed,
          sessionsReachedSignup,
          signupConversionRate,
        },
        countsByType,
      },
    });
  });

  app.get("/api/v1/admin/system/jobs/runs", requireAuth, requireAdmin, (req, res) => {
    const parsed = adminSystemJobRunsQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    res.json({
      data: listSystemJobRuns({
        jobName: parsed.data.jobName,
        status: parsed.data.status,
        days: parsed.data.days,
        limit: parsed.data.limit,
      }),
    });
  });

  app.get("/api/v1/admin/system/jobs/summary", requireAuth, requireAdmin, (req, res) => {
    const parsed = adminSystemJobSummaryQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid query params" });
      return;
    }

    const latestRun = listSystemJobRuns({
      jobName: parsed.data.jobName,
      limit: 1,
    })[0] ?? null;
    const latestSuccess = listSystemJobRuns({
      jobName: parsed.data.jobName,
      status: "success",
      limit: 1,
    })[0] ?? null;
    const latestError = listSystemJobRuns({
      jobName: parsed.data.jobName,
      status: "error",
      limit: 1,
    })[0] ?? null;
    const recentRuns7d = listSystemJobRuns({
      jobName: parsed.data.jobName,
      days: 7,
      limit: 500,
    });
    const successRuns7d = recentRuns7d.filter((item) => item.status === "success").length;
    const runsLast24h = listSystemJobRuns({
      jobName: parsed.data.jobName,
      days: 1,
      limit: 500,
    }).length;
    const successRate7d =
      recentRuns7d.length > 0 ? Number((successRuns7d / recentRuns7d.length).toFixed(4)) : 0;
    const minutesSinceLatestRun =
      latestRun && !Number.isNaN(Date.parse(latestRun.startedAt))
        ? Math.max(0, Math.floor((Date.now() - Date.parse(latestRun.startedAt)) / (60 * 1000)))
        : null;
    const minutesSinceLatestError =
      latestError && !Number.isNaN(Date.parse(latestError.startedAt))
        ? Math.max(0, Math.floor((Date.now() - Date.parse(latestError.startedAt)) / (60 * 1000)))
        : null;
    const lockInfo = getNotificationDigestLockInfo();
    const staleLockDetected =
      lockInfo.exists &&
      lockInfo.ageMinutes !== null &&
      lockInfo.ageMinutes > parsed.data.staleLockMinutes;

    const healthy =
      latestRun !== null &&
      !staleLockDetected &&
      !(
        latestRun.status === "error" &&
        minutesSinceLatestError !== null &&
        minutesSinceLatestError <= parsed.data.failureWindowMinutes
      );

    res.json({
      data: {
        jobName: parsed.data.jobName,
        failureWindowMinutes: parsed.data.failureWindowMinutes,
        staleLockMinutes: parsed.data.staleLockMinutes,
        healthy,
        latestStatus: latestRun?.status ?? null,
        latestRunAt: latestRun?.startedAt ?? null,
        latestRunAgeMinutes: minutesSinceLatestRun,
        latestSuccessAt: latestSuccess?.startedAt ?? null,
        latestErrorAt: latestError?.startedAt ?? null,
        latestErrorMessage: latestError?.errorMessage ?? null,
        runsLast24h,
        runsLast7d: recentRuns7d.length,
        successRuns7d,
        successRate7d,
        lock: {
          path: lockInfo.path,
          exists: lockInfo.exists,
          startedAt: lockInfo.startedAt,
          ageMinutes: lockInfo.ageMinutes,
          staleDetected: staleLockDetected,
        },
      },
    });
  });

  app.post("/api/v1/admin/system/jobs/unlock", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = adminSystemJobUnlockSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid unlock payload" });
      return;
    }

    if (parsed.data.jobName !== "notification_digest") {
      res.status(400).json({ error: "Unsupported job name for unlock." });
      return;
    }

    const lockInfo = getNotificationDigestLockInfo();
    if (!lockInfo.exists) {
      res.status(404).json({ error: "No lock file found." });
      return;
    }

    if (lockInfo.ageMinutes === null || lockInfo.ageMinutes < parsed.data.minAgeMinutes) {
      res.status(409).json({
        error: `Lock is not stale enough to unlock. age=${lockInfo.ageMinutes ?? "unknown"} min.`,
      });
      return;
    }

    rmSync(lockInfo.path, { force: true });
    auditAdminAction(authReq, "system.job.unlock", "system_job", parsed.data.jobName, {
      lockPath: lockInfo.path,
      lockAgeMinutes: lockInfo.ageMinutes,
      minAgeMinutes: parsed.data.minAgeMinutes,
    });

    res.json({
      data: {
        unlocked: true,
        lockPath: lockInfo.path,
        lockAgeMinutes: lockInfo.ageMinutes,
      },
    });
  });

  app.post("/api/v1/admin/content/lessons", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = lessonSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid lesson payload" });
      return;
    }

    createLesson(parsed.data);
    auditAdminAction(authReq, "lesson.create", "lesson", parsed.data.slug, parsed.data);
    res.status(201).json({ data: { ok: true } });
  });

  app.put("/api/v1/admin/content/lessons/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const parsed = lessonSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid lesson payload" });
      return;
    }

    updateLesson(id, parsed.data);
    auditAdminAction(authReq, "lesson.update", "lesson", String(id), parsed.data);
    res.json({ data: { ok: true } });
  });

  app.patch("/api/v1/admin/content/lessons/:id/status", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const status = parseStatusOrFail(req, res);
    if (!status) {
      return;
    }

    setLessonStatus(id, status);
    auditAdminAction(authReq, "lesson.status", "lesson", String(id), { status });
    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/admin/content/lessons/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    deleteLesson(id);
    auditAdminAction(authReq, "lesson.delete", "lesson", String(id), null);
    res.status(204).send();
  });

  app.post("/api/v1/admin/content/practices", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = practiceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid practice payload" });
      return;
    }

    createPractice(parsed.data);
    auditAdminAction(authReq, "practice.create", "practice", parsed.data.slug, parsed.data);
    res.status(201).json({ data: { ok: true } });
  });

  app.put("/api/v1/admin/content/practices/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const parsed = practiceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid practice payload" });
      return;
    }

    updatePractice(id, parsed.data);
    auditAdminAction(authReq, "practice.update", "practice", String(id), parsed.data);
    res.json({ data: { ok: true } });
  });

  app.patch("/api/v1/admin/content/practices/:id/status", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const status = parseStatusOrFail(req, res);
    if (!status) {
      return;
    }

    setPracticeStatus(id, status);
    auditAdminAction(authReq, "practice.status", "practice", String(id), { status });
    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/admin/content/practices/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    deletePractice(id);
    auditAdminAction(authReq, "practice.delete", "practice", String(id), null);
    res.status(204).send();
  });

  app.post("/api/v1/admin/content/community", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = communitySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid community payload" });
      return;
    }

    createCommunity(parsed.data);
    auditAdminAction(authReq, "community.create", "community", parsed.data.slug, parsed.data);
    res.status(201).json({ data: { ok: true } });
  });

  app.put("/api/v1/admin/content/community/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const parsed = communitySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid community payload" });
      return;
    }

    updateCommunity(id, parsed.data);
    auditAdminAction(authReq, "community.update", "community", String(id), parsed.data);
    res.json({ data: { ok: true } });
  });

  app.patch("/api/v1/admin/content/community/:id/status", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const status = parseStatusOrFail(req, res);
    if (!status) {
      return;
    }

    setCommunityStatus(id, status);
    auditAdminAction(authReq, "community.status", "community", String(id), { status });
    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/admin/content/community/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    deleteCommunity(id);
    auditAdminAction(authReq, "community.delete", "community", String(id), null);
    res.status(204).send();
  });

  app.post("/api/v1/admin/content/challenges", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = challengeSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid challenge payload" });
      return;
    }

    createCommunityChallenge(parsed.data);
    auditAdminAction(authReq, "challenge.create", "challenge", parsed.data.slug, parsed.data);
    res.status(201).json({ data: { ok: true } });
  });

  app.put("/api/v1/admin/content/challenges/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const parsed = challengeSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid challenge payload" });
      return;
    }

    updateCommunityChallenge(id, parsed.data);
    auditAdminAction(authReq, "challenge.update", "challenge", String(id), parsed.data);
    res.json({ data: { ok: true } });
  });

  app.patch("/api/v1/admin/content/challenges/:id/status", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const status = parseStatusOrFail(req, res);
    if (!status) {
      return;
    }

    setCommunityChallengeStatus(id, status);
    auditAdminAction(authReq, "challenge.status", "challenge", String(id), { status });
    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/admin/content/challenges/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    deleteCommunityChallenge(id);
    auditAdminAction(authReq, "challenge.delete", "challenge", String(id), null);
    res.status(204).send();
  });

  app.post("/api/v1/admin/content/resources", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = resourceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid resource payload" });
      return;
    }

    createCommunityResource(parsed.data);
    auditAdminAction(authReq, "resource.create", "resource", parsed.data.slug, parsed.data);
    res.status(201).json({ data: { ok: true } });
  });

  app.put("/api/v1/admin/content/resources/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const parsed = resourceSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid resource payload" });
      return;
    }

    updateCommunityResource(id, parsed.data);
    auditAdminAction(authReq, "resource.update", "resource", String(id), parsed.data);
    res.json({ data: { ok: true } });
  });

  app.patch("/api/v1/admin/content/resources/:id/status", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const status = parseStatusOrFail(req, res);
    if (!status) {
      return;
    }

    setCommunityResourceStatus(id, status);
    auditAdminAction(authReq, "resource.status", "resource", String(id), { status });
    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/admin/content/resources/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    deleteCommunityResource(id);
    auditAdminAction(authReq, "resource.delete", "resource", String(id), null);
    res.status(204).send();
  });

  app.post("/api/v1/admin/content/experts", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = expertSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid expert payload" });
      return;
    }

    createCommunityExpert(parsed.data);
    auditAdminAction(authReq, "expert.create", "expert", parsed.data.slug, parsed.data);
    res.status(201).json({ data: { ok: true } });
  });

  app.put("/api/v1/admin/content/experts/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const parsed = expertSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid expert payload" });
      return;
    }

    updateCommunityExpert(id, parsed.data);
    auditAdminAction(authReq, "expert.update", "expert", String(id), parsed.data);
    res.json({ data: { ok: true } });
  });

  app.patch("/api/v1/admin/content/experts/:id/status", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const status = parseStatusOrFail(req, res);
    if (!status) {
      return;
    }

    setCommunityExpertStatus(id, status);
    auditAdminAction(authReq, "expert.status", "expert", String(id), { status });
    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/admin/content/experts/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    deleteCommunityExpert(id);
    auditAdminAction(authReq, "expert.delete", "expert", String(id), null);
    res.status(204).send();
  });

  app.post("/api/v1/admin/content/events", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = eventSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid event payload" });
      return;
    }

    createCommunityEvent(parsed.data);
    auditAdminAction(authReq, "event.create", "event", parsed.data.slug, parsed.data);
    res.status(201).json({ data: { ok: true } });
  });

  app.put("/api/v1/admin/content/events/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const parsed = eventSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid event payload" });
      return;
    }

    updateCommunityEvent(id, parsed.data);
    auditAdminAction(authReq, "event.update", "event", String(id), parsed.data);
    res.json({ data: { ok: true } });
  });

  app.patch("/api/v1/admin/content/events/:id/status", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const status = parseStatusOrFail(req, res);
    if (!status) {
      return;
    }

    setCommunityEventStatus(id, status);
    auditAdminAction(authReq, "event.status", "event", String(id), { status });
    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/admin/content/events/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    deleteCommunityEvent(id);
    auditAdminAction(authReq, "event.delete", "event", String(id), null);
    res.status(204).send();
  });

  app.post("/api/v1/admin/content/videos", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = videoSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid video payload" });
      return;
    }

    createCreatorVideo(parsed.data);
    auditAdminAction(authReq, "video.create", "video", parsed.data.slug, parsed.data);
    res.status(201).json({ data: { ok: true } });
  });

  app.put("/api/v1/admin/content/videos/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const parsed = videoSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid video payload" });
      return;
    }

    updateCreatorVideo(id, parsed.data);
    auditAdminAction(authReq, "video.update", "video", String(id), parsed.data);
    res.json({ data: { ok: true } });
  });

  app.patch("/api/v1/admin/content/videos/:id/status", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const status = parseStatusOrFail(req, res);
    if (!status) {
      return;
    }

    setCreatorVideoStatus(id, status);
    auditAdminAction(authReq, "video.status", "video", String(id), { status });
    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/admin/content/videos/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    deleteCreatorVideo(id);
    auditAdminAction(authReq, "video.delete", "video", String(id), null);
    res.status(204).send();
  });

  app.post("/api/v1/admin/content/pillars", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = pillarSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid pillar payload" });
      return;
    }

    createPillar(parsed.data);
    auditAdminAction(authReq, "pillar.create", "pillar", parsed.data.slug, parsed.data);
    res.status(201).json({ data: { ok: true } });
  });

  app.put("/api/v1/admin/content/pillars/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const parsed = pillarSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid pillar payload" });
      return;
    }

    updatePillar(id, parsed.data);
    auditAdminAction(authReq, "pillar.update", "pillar", String(id), parsed.data);
    res.json({ data: { ok: true } });
  });

  app.patch("/api/v1/admin/content/pillars/:id/status", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const status = parseStatusOrFail(req, res);
    if (!status) {
      return;
    }

    setPillarStatus(id, status);
    auditAdminAction(authReq, "pillar.status", "pillar", String(id), { status });
    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/admin/content/pillars/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    deletePillar(id);
    auditAdminAction(authReq, "pillar.delete", "pillar", String(id), null);
    res.status(204).send();
  });

  app.post("/api/v1/admin/content/highlights", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = highlightSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid highlight payload" });
      return;
    }

    createHighlight(parsed.data);
    auditAdminAction(authReq, "highlight.create", "highlight", parsed.data.slug, parsed.data);
    res.status(201).json({ data: { ok: true } });
  });

  app.put("/api/v1/admin/content/highlights/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const parsed = highlightSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid highlight payload" });
      return;
    }

    updateHighlight(id, parsed.data);
    auditAdminAction(authReq, "highlight.update", "highlight", String(id), parsed.data);
    res.json({ data: { ok: true } });
  });

  app.patch("/api/v1/admin/content/highlights/:id/status", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    const status = parseStatusOrFail(req, res);
    if (!status) {
      return;
    }

    setHighlightStatus(id, status);
    auditAdminAction(authReq, "highlight.status", "highlight", String(id), { status });
    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/admin/content/highlights/:id", requireAuth, requireAdmin, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const id = parseIdOrFail(req, res);
    if (!id) {
      return;
    }

    deleteHighlight(id);
    auditAdminAction(authReq, "highlight.delete", "highlight", String(id), null);
    res.status(204).send();
  });

  return app;
}

export function startServer() {
  const app = createApp();
  const port = Number(process.env.API_PORT ?? 4000);

  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${port}`);
  });
}

if (process.env.NODE_ENV !== "test") {
  startServer();
}
