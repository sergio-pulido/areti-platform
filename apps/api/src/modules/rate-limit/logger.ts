import type { RateLimitBlockEvent, RateLimitRuntimeConfig } from "./types.js";

export function logRateLimitBlock(config: RateLimitRuntimeConfig, event: RateLimitBlockEvent): void {
  if (!config.logBlocks) {
    return;
  }

  const payload = {
    ts: new Date().toISOString(),
    event: "rate_limit_block",
    policyKey: event.policyKey,
    route: event.route,
    method: event.method,
    ip: event.ip,
    userId: event.userId,
    authenticated: Boolean(event.userId),
    retryAfterSeconds: event.retryAfterSeconds,
    requestCount: event.requestCount,
    limitValue: event.limitValue,
    windowSeconds: event.windowSeconds,
    scopeType: event.scopeType,
    userAgent: event.userAgent,
    requestId: event.requestId,
    country: event.country,
    plan: event.plan,
    trustLevel: event.trustLevel,
  };

  // eslint-disable-next-line no-console
  console.warn(`[rate-limit] ${JSON.stringify(payload)}`);
}
