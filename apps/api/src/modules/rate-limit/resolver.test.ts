import { describe, expect, it } from "vitest";
import { RateLimitResolver } from "./resolver.js";
import type {
  RateLimitPolicyKey,
  RateLimitRequestContext,
  RateLimitRuntimeConfig,
} from "./types.js";

function makeConfig(): RateLimitRuntimeConfig {
  return {
    enabled: true,
    store: "memory",
    redisUrl: null,
    redisPrefix: "areti:ratelimit",
    trustProxy: false,
    logBlocks: true,
    adminMaxRows: 100,
    useDbOverrides: true,
    ipHashSalt: "test-salt",
    policyEnvOverrides: {
      "chat.sendMessage": {
        authenticatedMaxRequests: 25,
        windowSeconds: 120,
      },
    },
  };
}

function makeContext(overrides?: Partial<RateLimitRequestContext>): RateLimitRequestContext {
  return {
    request: {} as RateLimitRequestContext["request"],
    routeId: "POST /api/v1/chat/threads/:id/messages",
    method: "POST",
    path: "/api/v1/chat/threads/1/messages",
    ip: "203.0.113.10",
    userAgent: "vitest-agent",
    requestId: "req-test",
    email: null,
    actor: {
      userId: "user-1",
      role: "user",
      plan: "free",
      country: "ES",
      trustLevel: null,
      featureFlags: ["beta_chat"],
    },
    ...overrides,
  };
}

describe("RateLimitResolver", () => {
  it("applies env overrides when present", async () => {
    const resolver = new RateLimitResolver(makeConfig(), async () => []);
    const resolved = await resolver.resolve("chat.sendMessage", makeContext());

    expect(resolved.maxRequests).toBe(25);
    expect(resolved.windowSeconds).toBe(120);
    expect(resolved.source).toBe("env");
  });

  it("applies highest-precedence DB override (user > plan > global)", async () => {
    const resolver = new RateLimitResolver(makeConfig(), async (policyKey: RateLimitPolicyKey) => {
      if (policyKey !== "chat.sendMessage") {
        return [];
      }

      return [
        {
          id: "global-1",
          policyKey,
          scopeType: "global",
          scopeValue: null,
          windowSeconds: 300,
          maxRequests: null,
          anonymousMaxRequests: null,
          authenticatedMaxRequests: 40,
          burstRequests: null,
          costWeight: null,
          enabled: true,
          startsAt: null,
          endsAt: null,
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          id: "plan-free",
          policyKey,
          scopeType: "plan",
          scopeValue: "free",
          windowSeconds: 300,
          maxRequests: null,
          anonymousMaxRequests: null,
          authenticatedMaxRequests: 12,
          burstRequests: null,
          costWeight: null,
          enabled: true,
          startsAt: null,
          endsAt: null,
          createdAt: "2026-01-02T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
        },
        {
          id: "user-1",
          policyKey,
          scopeType: "user",
          scopeValue: "user-1",
          windowSeconds: 90,
          maxRequests: null,
          anonymousMaxRequests: null,
          authenticatedMaxRequests: 6,
          burstRequests: null,
          costWeight: null,
          enabled: true,
          startsAt: null,
          endsAt: null,
          createdAt: "2026-01-03T00:00:00.000Z",
          updatedAt: "2026-01-03T00:00:00.000Z",
        },
      ];
    });

    const resolved = await resolver.resolve("chat.sendMessage", makeContext());

    expect(resolved.source).toBe("db");
    expect(resolved.overrideId).toBe("user-1");
    expect(resolved.maxRequests).toBe(6);
    expect(resolved.windowSeconds).toBe(90);
  });
});
