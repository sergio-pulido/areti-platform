import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
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
import express, { type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import {
  countJournalEntriesByUser,
  countUsers,
  createAdminAuditLog,
  createChatMessage,
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
  createPasskeyCredential,
  createPillar,
  createPractice,
  createRefreshSession,
  createSession,
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
  getCommunityChallenges,
  getCommunityCircles,
  getCommunityEvents,
  getCommunityExperts,
  getCommunityResources,
  getCreatorVideos,
  getLandingContent,
  getLibraryLessonBySlug,
  getLibraryLessons,
  getPasskeyCredentialByCredentialId,
  getPracticeRoutineBySlug,
  getPracticeRoutines,
  getRefreshSessionContextByTokenHash,
  getSecuritySettingsByUserId,
  getSessionDeviceByTokenHash,
  getSessionUserByTokenHash,
  getUserTotpSecret,
  getUserByEmail,
  getUserById,
  listChatMessagesForThread,
  listChatThreadsByUser,
  listAdminAuditLogs,
  listAllContentAdmin,
  listJournalEntriesByUser,
  listNotificationsByUser,
  listPasskeyCredentialsByUserId,
  listUserDevicesByUserId,
  markAllNotificationsRead,
  markNotificationRead,
  markUserTotpVerified,
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
  setUserMfaEnabled,
  setUserPasskeyEnabled,
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
  upsertUserDevice,
  upsertUserTotpSecret,
  type ContentStatus,
  type CurrentUser,
} from "@ataraxia/db";

const ACCESS_SESSION_TTL_MINUTES = 20;
const REFRESH_SESSION_TTL_DAYS = 30;
const PASSWORD_MIN_LENGTH = 10;
const PASSKEY_CHALLENGE_TTL_MS = 5 * 60 * 1000;

const MODERATION_BLOCKED_WORDS = ["suicide", "kill myself", "bomb", "terrorist", "self-harm"];
const CHAT_WINDOW_MS = 60 * 1000;
const CHAT_MAX_ATTEMPTS = 20;
const DEFAULT_CHAT_PROVIDER_ORDER = ["deepseek", "openai"] as const;
const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-chat";
const TOTP_DIGITS = 6;
const TOTP_STEP_SECONDS = 30;
const TOTP_WINDOW_STEPS = 1;

type AuthenticatedRequest = Request & {
  authUser: CurrentUser;
  authAccessToken: string;
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
};

const envSchema = z.object({
  CORS_ORIGINS: z.string().optional(),
  PASSKEY_RP_ID: z.string().optional(),
  PASSKEY_RP_NAME: z.string().optional(),
  PASSKEY_ORIGINS: z.string().optional(),
  CHAT_PROVIDER_ORDER: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_CHAT_MODEL: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  DEEPSEEK_API_KEY: z.string().optional(),
  DEEPSEEK_CHAT_MODEL: z.string().optional(),
  DEEPSEEK_BASE_URL: z.string().optional(),
});

type AppEnv = z.infer<typeof envSchema>;

const authAttemptsByKey = new Map<string, number[]>();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 8;
const chatAttemptsByUser = new Map<string, number[]>();

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

function normalizeBaseUrl(baseUrl: string): string {
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

  return { providers };
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
  prompt: string,
  provider: ChatProviderRuntime,
): Promise<string | null> {
  try {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: "system",
            content:
              "You are a practical philosophy coach blending Stoicism, Epicureanism, Buddhism, and Taoism. Give concise, actionable guidance.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(
        `[chat] Provider "${provider.provider}" failed with status ${response.status}. ${errorBody.slice(0, 300)}`,
      );
      return null;
    }

    const payload = (await response.json()) as ChatCompletionPayload;
    return extractAssistantMessage(payload);
  } catch (error) {
    console.warn(
      `[chat] Provider "${provider.provider}" request error: ${
        error instanceof Error ? error.message : "unknown error"
      }`,
    );
    return null;
  }
}

async function resolveChatAnswer(prompt: string, chatConfig: ChatRuntimeConfig): Promise<string> {
  if (chatConfig.providers.length === 0) {
    return fallbackChatAnswer(prompt);
  }

  for (const provider of chatConfig.providers) {
    const answer = await resolveProviderAnswer(prompt, provider);
    if (answer) {
      return answer;
    }
  }

  throw new Error("All configured chat providers failed.");
}

const signupSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(120),
    password: z
      .string()
      .min(PASSWORD_MIN_LENGTH)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/\d/),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const signinSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(1),
  mfaChallengeId: z.string().uuid().optional(),
  mfaCode: z.string().trim().length(6).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(16),
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

export function createApp() {
  const app = express();
  const env = envSchema.parse(process.env);
  const chatConfig = createChatRuntimeConfig(env);

  const allowedOrigins = (env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const passkeyRpId = env.PASSKEY_RP_ID ?? "localhost";
  const passkeyRpName = env.PASSKEY_RP_NAME ?? "Ataraxia";
  const passkeyExpectedOrigins = (
    env.PASSKEY_ORIGINS ??
    allowedOrigins.join(",") ??
    "http://localhost:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/v1/auth/signup", async (req, res) => {
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

    const role = countUsers() === 0 ? "ADMIN" : "MEMBER";

    const created = createUser({
      id: randomUUID(),
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await argon2.hash(parsed.data.password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 3,
        parallelism: 1,
      }),
      role,
    });

    if (!created) {
      res.status(500).json({ error: "Failed to create user" });
      return;
    }

    const deviceContext = buildDeviceContext(req);
    const deviceId = upsertUserDevice({
      id: randomUUID(),
      userId: created.id,
      fingerprint: deviceContext.fingerprint,
      label: deviceContext.label,
      ipAddress: deviceContext.ipAddress,
      userAgent: deviceContext.userAgent,
    });

    const tokens = await createAuthTokenPair(created.id, deviceId);

    res.status(201).json({
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: created,
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

    if (!existing) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    const valid = await argon2.verify(existing.passwordHash, parsed.data.password);

    if (!valid) {
      res.status(401).json({ error: "Invalid email or password." });
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

    res.json({
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
        },
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

    if (!existingUser || !existingUser.passkeyEnabled) {
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

    res.json({
      data: {
        user: authReq.authUser,
        accessToken: authReq.authAccessToken,
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
    const issuer = encodeURIComponent("Ataraxia");
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

  app.post("/api/v1/chat", requireAuth, async (req, res) => {
    const parsed = chatSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid prompt" });
      return;
    }

    try {
      assertWithinChatRateLimit((req as AuthenticatedRequest).authUser.id);
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
      answer = await resolveChatAnswer(parsed.data.prompt, chatConfig);
    } catch (error) {
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
    res.json({ data: listChatThreadsByUser(authReq.authUser.id) });
  });

  app.post("/api/v1/chat/threads", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = chatThreadCreateSchema.safeParse(req.body ?? {});

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid thread payload" });
      return;
    }

    const title = parsed.data.title?.trim() || `Thread ${new Date().toLocaleString()}`;
    const thread = createChatThread({
      id: randomUUID(),
      userId: authReq.authUser.id,
      title,
    });

    createNotification({
      id: randomUUID(),
      userId: authReq.authUser.id,
      title: "New chat thread created",
      body: thread.title,
      href: `/chat?thread=${thread.id}`,
    });

    res.status(201).json({ data: thread });
  });

  app.patch("/api/v1/chat/threads/:id", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const parsed = chatThreadPatchSchema.safeParse(req.body);

    if (!parsed.success || (parsed.data.title === undefined && parsed.data.archived === undefined)) {
      res.status(400).json({ error: "Invalid thread patch payload" });
      return;
    }

    const updated = updateChatThread(authReq.authUser.id, req.params.id, parsed.data);

    if (!updated) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    res.json({ data: { ok: true } });
  });

  app.delete("/api/v1/chat/threads/:id", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const deleted = deleteChatThread(authReq.authUser.id, req.params.id);

    if (!deleted) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }

    res.status(204).send();
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

    createChatMessage({
      id: randomUUID(),
      threadId: thread.id,
      role: "user",
      content: parsed.data.prompt,
    });

    let answer = "";
    try {
      answer = await resolveChatAnswer(parsed.data.prompt, chatConfig);
    } catch (error) {
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

    res.status(201).json({ data: { answer } });
  });

  app.get("/api/v1/dashboard/summary", requireAuth, (req, res) => {
    const authReq = req as AuthenticatedRequest;
    const entriesCount = countJournalEntriesByUser(authReq.authUser.id);
    const latestEntries = listJournalEntriesByUser(authReq.authUser.id, 3);

    res.json({
      data: {
        entriesCount,
        latestEntries,
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
