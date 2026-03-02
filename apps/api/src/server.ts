import { createHash, randomBytes, randomUUID } from "node:crypto";
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
  createCommunity,
  createHighlight,
  createJournalEntry,
  createLesson,
  createMfaChallenge,
  createPasskeyCredential,
  createPillar,
  createPractice,
  createRefreshSession,
  createSession,
  createUser,
  deleteCommunity,
  deleteExpiredRefreshSessionsByUser,
  deleteExpiredSessionsByUser,
  deleteHighlight,
  deleteLesson,
  deletePillar,
  deletePractice,
  deleteRefreshSessionByTokenHash,
  deleteSessionByTokenHash,
  getCommunityCircles,
  getLandingContent,
  getLibraryLessons,
  getPasskeyCredentialByCredentialId,
  getPracticeRoutines,
  getRefreshSessionUserByTokenHash,
  getSecuritySettingsByUserId,
  getSessionUserByTokenHash,
  getUserByEmail,
  getUserById,
  listAdminAuditLogs,
  listAllContentAdmin,
  listJournalEntriesByUser,
  listPasskeyCredentialsByUserId,
  rotateRefreshSessionByTokenHash,
  setCommunityStatus,
  setHighlightStatus,
  setLessonStatus,
  setPillarStatus,
  setPracticeStatus,
  setUserMfaEnabled,
  setUserPasskeyEnabled,
  updateCommunity,
  updateHighlight,
  updateLesson,
  updatePasskeyCredential,
  updatePasskeyCredentialCounter,
  updatePillar,
  updatePractice,
  useMfaChallenge,
  type ContentStatus,
  type CurrentUser,
} from "@ataraxia/db";

const ACCESS_SESSION_TTL_MINUTES = 20;
const REFRESH_SESSION_TTL_DAYS = 30;
const PASSWORD_MIN_LENGTH = 10;
const MFA_CHALLENGE_TTL_MINUTES = 5;
const PASSKEY_CHALLENGE_TTL_MS = 5 * 60 * 1000;

const MODERATION_BLOCKED_WORDS = ["suicide", "kill myself", "bomb", "terrorist", "self-harm"];

type AuthenticatedRequest = Request & {
  authUser: CurrentUser;
  authAccessToken: string;
};

const authAttemptsByKey = new Map<string, number[]>();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 8;

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

function hashMfaCode(code: string): string {
  return createHash("sha256").update(`mfa:${code}`).digest("hex");
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

async function createAuthTokenPair(userId: string) {
  const accessToken = createOpaqueToken();
  const refreshToken = createOpaqueToken();

  deleteExpiredSessionsByUser(userId);
  deleteExpiredRefreshSessionsByUser(userId);

  createSession({
    id: randomUUID(),
    tokenHash: hashToken(accessToken),
    userId,
    expiresAt: nowPlusMinutesIso(ACCESS_SESSION_TTL_MINUTES),
  });

  createRefreshSession({
    id: randomUUID(),
    tokenHash: hashToken(refreshToken),
    userId,
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

async function resolveChatAnswer(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return fallbackChatAnswer(prompt);
  }

  const model = process.env.OPENAI_CHAT_MODEL ?? "gpt-4.1-mini";

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: [
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
    return fallbackChatAnswer(prompt);
  }

  const json = (await response.json()) as { output_text?: string };

  return json.output_text?.trim() || fallbackChatAnswer(prompt);
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
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const practiceSchema = z.object({
  slug: z.string().trim().min(3).max(80),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().min(8).max(500),
  cadence: z.string().trim().min(3).max(80),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

const communitySchema = z.object({
  slug: z.string().trim().min(3).max(80),
  name: z.string().trim().min(3).max(140),
  focus: z.string().trim().min(8).max(500),
  schedule: z.string().trim().min(3).max(80),
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

  const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const passkeyRpId = process.env.PASSKEY_RP_ID ?? "localhost";
  const passkeyRpName = process.env.PASSKEY_RP_NAME ?? "Ataraxia";
  const passkeyExpectedOrigins = (
    process.env.PASSKEY_ORIGINS ??
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

    const tokens = await createAuthTokenPair(created.id);

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
      if (!parsed.data.mfaChallengeId || !parsed.data.mfaCode) {
        const code = `${Math.floor(100000 + Math.random() * 900000)}`;
        const challengeId = randomUUID();

        createMfaChallenge({
          id: challengeId,
          userId: existing.id,
          codeHash: hashMfaCode(code),
          expiresAt: nowPlusMinutesIso(MFA_CHALLENGE_TTL_MINUTES),
        });

        // eslint-disable-next-line no-console
        console.log(`[MFA CODE][${existing.email}] ${code}`);

        res.status(401).json({
          error: "MFA_REQUIRED",
          data: {
            mfaRequired: true,
            mfaChallengeId: challengeId,
          },
        });
        return;
      }

      const mfaValid = useMfaChallenge({
        id: parsed.data.mfaChallengeId,
        userId: existing.id,
        codeHash: hashMfaCode(parsed.data.mfaCode),
      });

      if (!mfaValid) {
        res.status(401).json({ error: "Invalid or expired MFA challenge/code." });
        return;
      }
    }

    const tokens = await createAuthTokenPair(existing.id);

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

      const tokens = await createAuthTokenPair(user.id);

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
    const user = getRefreshSessionUserByTokenHash(refreshTokenHash);

    if (!user) {
      res.status(401).json({ error: "Invalid or expired refresh token." });
      return;
    }

    const newAccessToken = createOpaqueToken();
    const newRefreshToken = createOpaqueToken();

    const rotated = rotateRefreshSessionByTokenHash(refreshTokenHash, {
      id: randomUUID(),
      tokenHash: hashToken(newRefreshToken),
      userId: user.id,
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
          transports,
        });
      } else {
        createPasskeyCredential({
          id: randomUUID(),
          userId: authReq.authUser.id,
          credentialId: credential.id,
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

  app.post("/api/v1/chat", requireAuth, async (req, res) => {
    const parsed = chatSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({ error: "Invalid prompt" });
      return;
    }

    const moderationError = moderatePrompt(parsed.data.prompt);

    if (moderationError) {
      res.status(400).json({ error: moderationError });
      return;
    }

    const answer = await resolveChatAnswer(parsed.data.prompt);

    res.json({ data: { answer } });
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

  app.get("/api/v1/content/practices", (_req, res) => {
    res.json({ data: getPracticeRoutines() });
  });

  app.get("/api/v1/content/community", (_req, res) => {
    res.json({ data: getCommunityCircles() });
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
