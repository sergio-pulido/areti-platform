import type { RateLimitPolicyEnvOverride, RateLimitPolicyKey, RateLimitRuntimeConfig } from "./types.js";

const TRUST_PROXY_KEYWORDS = new Set(["loopback", "linklocal", "uniquelocal"]);

function parseBooleanEnv(rawValue: string | undefined, fallback: boolean): boolean {
  const normalized = rawValue?.trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new Error(`Unsupported boolean value \"${rawValue}\". Use true or false.`);
}

function parseBoundedInteger(rawValue: string | undefined, fallback: number, min: number, max: number): number {
  if (!rawValue || rawValue.trim().length === 0) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
}

function parseTrustProxy(rawValue: string | undefined): boolean | number | string {
  if (!rawValue || rawValue.trim().length === 0) {
    return false;
  }

  const normalized = rawValue.trim().toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  const asNumber = Number.parseInt(normalized, 10);
  if (Number.isFinite(asNumber) && String(asNumber) === normalized) {
    return Math.max(0, asNumber);
  }

  if (TRUST_PROXY_KEYWORDS.has(normalized)) {
    return normalized;
  }

  throw new Error(
    `Unsupported RATE_LIMIT_TRUST_PROXY value \"${rawValue}\". Use true, false, integer hops, or loopback/linklocal/uniquelocal.`,
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parsePolicyOverridesJson(
  rawValue: string | undefined,
): Partial<Record<RateLimitPolicyKey, RateLimitPolicyEnvOverride>> {
  if (!rawValue || rawValue.trim().length === 0) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch {
    throw new Error("RATE_LIMIT_POLICY_OVERRIDES_JSON must be valid JSON.");
  }

  if (!isPlainObject(parsed)) {
    throw new Error("RATE_LIMIT_POLICY_OVERRIDES_JSON must be an object keyed by policy key.");
  }

  const result: Partial<Record<RateLimitPolicyKey, RateLimitPolicyEnvOverride>> = {};

  for (const [key, value] of Object.entries(parsed)) {
    if (!isPlainObject(value)) {
      continue;
    }

    const override: RateLimitPolicyEnvOverride = {};

    if (typeof value.enabled === "boolean") {
      override.enabled = value.enabled;
    }

    const numericKeys: Array<keyof Omit<RateLimitPolicyEnvOverride, "enabled">> = [
      "windowSeconds",
      "maxRequests",
      "anonymousMaxRequests",
      "authenticatedMaxRequests",
      "burstRequests",
    ];

    for (const numericKey of numericKeys) {
      const rawNumeric = value[numericKey];
      if (typeof rawNumeric === "number" && Number.isFinite(rawNumeric)) {
        override[numericKey] = Math.max(1, Math.floor(rawNumeric));
      }
    }

    if (Object.keys(override).length > 0) {
      result[key as RateLimitPolicyKey] = override;
    }
  }

  return result;
}

export function createRateLimitRuntimeConfig(env: NodeJS.ProcessEnv): RateLimitRuntimeConfig {
  const storeRaw = env.RATE_LIMIT_STORE?.trim().toLowerCase();
  const store = storeRaw === "redis" ? "redis" : "memory";

  if (storeRaw && storeRaw !== "memory" && storeRaw !== "redis") {
    throw new Error(`Unsupported RATE_LIMIT_STORE value \"${env.RATE_LIMIT_STORE}\". Use memory or redis.`);
  }

  return {
    enabled: parseBooleanEnv(env.RATE_LIMIT_ENABLED, true),
    store,
    redisUrl: env.REDIS_URL?.trim() || null,
    redisPrefix: env.RATE_LIMIT_REDIS_PREFIX?.trim() || "areti:ratelimit",
    trustProxy: parseTrustProxy(env.RATE_LIMIT_TRUST_PROXY),
    logBlocks: parseBooleanEnv(env.RATE_LIMIT_LOG_BLOCKS, true),
    adminMaxRows: parseBoundedInteger(env.RATE_LIMIT_ADMIN_MAX_ROWS, 100, 1, 500),
    useDbOverrides: parseBooleanEnv(env.RATE_LIMIT_USE_DB_OVERRIDES, false),
    ipHashSalt: env.RATE_LIMIT_IP_HASH_SALT?.trim() || "areti-rate-limit-default-salt",
    policyEnvOverrides: parsePolicyOverridesJson(env.RATE_LIMIT_POLICY_OVERRIDES_JSON),
  };
}
