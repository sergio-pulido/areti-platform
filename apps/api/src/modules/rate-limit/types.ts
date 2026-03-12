import type { Request } from "express";
import type { RateLimitPolicyOverrideRecord } from "@areti/db";

export type RateLimitPolicyKey =
  | "auth.signin"
  | "auth.signup"
  | "auth.resendVerification"
  | "auth.refresh"
  | "auth.passkeyOptions"
  | "auth.passkeyVerify"
  | "auth.passwordChange"
  | "auth.deleteAccount"
  | "security.sensitive"
  | "chat.createThread"
  | "chat.sendMessage"
  | "chat.threadMutation"
  | "email.trigger"
  | "llm.expensiveAction"
  | "preview.chat"
  | "preview.events"
  | "admin.contentMutation"
  | "admin.systemUnlock"
  | "admin.inviteUser";

export type RateLimitBucketStrategy =
  | "ip_route"
  | "user_route"
  | "ip_email_route"
  | "ip_user_agent_route";

export type RateLimitPolicyDefinition = {
  key: RateLimitPolicyKey;
  description: string;
  enabled: boolean;
  windowSeconds: number;
  maxRequests?: number;
  anonymousMaxRequests?: number;
  authenticatedMaxRequests?: number;
  burstRequests?: number;
  costWeight?: number;
  tags: string[];
  routePatternHints: string[];
  priority: number;
  bucketStrategy: RateLimitBucketStrategy;
};

export type RateLimitActorContext = {
  userId: string | null;
  role: string | null;
  plan: string | null;
  country: string | null;
  trustLevel: string | null;
  featureFlags: string[];
};

export type RateLimitRequestContext = {
  request: Request;
  routeId: string;
  method: string;
  path: string;
  ip: string;
  userAgent: string | null;
  requestId: string | null;
  email: string | null;
  actor: RateLimitActorContext;
};

export type ResolvedRateLimitPolicy = {
  key: RateLimitPolicyKey;
  description: string;
  enabled: boolean;
  windowSeconds: number;
  maxRequests: number;
  bucketStrategy: RateLimitBucketStrategy;
  tags: string[];
  source: "base" | "env" | "db";
  sourceReason: string;
  overrideId: string | null;
};

export type RateLimitPolicyEnvOverride = {
  enabled?: boolean;
  windowSeconds?: number;
  maxRequests?: number;
  anonymousMaxRequests?: number;
  authenticatedMaxRequests?: number;
  burstRequests?: number;
};

export type RateLimitRuntimeConfig = {
  enabled: boolean;
  store: "memory" | "redis";
  redisUrl: string | null;
  redisPrefix: string;
  trustProxy: boolean | number | string;
  logBlocks: boolean;
  adminMaxRows: number;
  useDbOverrides: boolean;
  ipHashSalt: string;
  policyEnvOverrides: Partial<Record<RateLimitPolicyKey, RateLimitPolicyEnvOverride>>;
};

export type RateLimitDecision = {
  allowed: boolean;
  count: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAtMs: number;
};

export type RateLimitStoreInput = {
  key: string;
  windowSeconds: number;
  maxRequests: number;
  nowMs?: number;
};

export type RateLimitBlockEvent = {
  policyKey: RateLimitPolicyKey;
  route: string;
  method: string;
  ip: string;
  userId: string | null;
  country: string | null;
  plan: string | null;
  trustLevel: string | null;
  blocked: boolean;
  retryAfterSeconds: number;
  requestCount: number;
  limitValue: number;
  windowSeconds: number;
  scopeType: RateLimitBucketStrategy;
  userAgent: string | null;
  requestId: string | null;
};

export type RateLimitOverridesProvider = (
  policyKey: RateLimitPolicyKey,
  asOfIso: string,
) => Promise<RateLimitPolicyOverrideRecord[]>;
