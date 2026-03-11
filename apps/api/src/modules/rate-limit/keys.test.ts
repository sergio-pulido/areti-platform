import { describe, expect, it } from "vitest";
import { buildRateLimitBucketKey } from "./keys.js";
import type { RateLimitRequestContext, ResolvedRateLimitPolicy } from "./types.js";

function makeContext(overrides?: Partial<RateLimitRequestContext>): RateLimitRequestContext {
  return {
    request: {} as RateLimitRequestContext["request"],
    routeId: "POST /api/v1/chat",
    method: "POST",
    path: "/api/v1/chat",
    ip: "203.0.113.10",
    userAgent: "vitest-agent",
    requestId: "req-1",
    email: "user@example.com",
    actor: {
      userId: "user-1",
      role: "user",
      plan: null,
      country: null,
      trustLevel: null,
      featureFlags: [],
    },
    ...overrides,
  };
}

function makePolicy(
  bucketStrategy: ResolvedRateLimitPolicy["bucketStrategy"],
): ResolvedRateLimitPolicy {
  return {
    key: "chat.sendMessage",
    description: "test",
    enabled: true,
    windowSeconds: 60,
    maxRequests: 10,
    bucketStrategy,
    tags: [],
    source: "base",
    sourceReason: "test",
    overrideId: null,
  };
}

describe("buildRateLimitBucketKey", () => {
  it("isolates keys by route", () => {
    const policy = makePolicy("ip_route");
    const first = buildRateLimitBucketKey(policy, makeContext({ routeId: "POST /api/v1/preview/chat" }));
    const second = buildRateLimitBucketKey(policy, makeContext({ routeId: "POST /api/v1/preview/events" }));

    expect(first).not.toBe(second);
  });

  it("separates anonymous IP and authenticated user buckets", () => {
    const anonymousPolicy = makePolicy("ip_route");
    const authenticatedPolicy = makePolicy("user_route");

    const anonymousKey = buildRateLimitBucketKey(
      anonymousPolicy,
      makeContext({ actor: { ...makeContext().actor, userId: null } }),
    );
    const authenticatedKey = buildRateLimitBucketKey(authenticatedPolicy, makeContext());

    expect(anonymousKey).not.toBe(authenticatedKey);
    expect(anonymousKey).toContain("ip:");
    expect(authenticatedKey).toContain("user:");
  });
});
