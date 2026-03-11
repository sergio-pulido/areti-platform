import { createHash, randomUUID } from "node:crypto";
import { createRateLimitBlockEvent } from "@areti/db";
import { maskIp } from "./ip.js";
import type { RateLimitBlockEvent, RateLimitRuntimeConfig } from "./types.js";

export function hashIpAddress(ip: string, salt: string): string {
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function persistRateLimitBlockEvent(
  config: RateLimitRuntimeConfig,
  event: RateLimitBlockEvent,
): void {
  createRateLimitBlockEvent({
    id: randomUUID(),
    policyKey: event.policyKey,
    route: event.route,
    method: event.method,
    ipHash: hashIpAddress(event.ip, config.ipHashSalt),
    ipMasked: maskIp(event.ip),
    userId: event.userId,
    country: event.country,
    plan: event.plan,
    trustLevel: event.trustLevel,
    blocked: event.blocked,
    retryAfterSeconds: event.retryAfterSeconds,
    requestCount: event.requestCount,
    limitValue: event.limitValue,
    windowSeconds: event.windowSeconds,
    scopeType: event.scopeType,
    userAgent: event.userAgent,
    requestId: event.requestId,
  });
}
