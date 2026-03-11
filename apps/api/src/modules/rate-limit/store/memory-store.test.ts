import { describe, expect, it } from "vitest";
import { MemoryRateLimitStore } from "./memory-store.js";

describe("MemoryRateLimitStore", () => {
  it("allows until max and blocks after", async () => {
    const store = new MemoryRateLimitStore();

    const first = await store.hit({ key: "k1", windowSeconds: 60, maxRequests: 2, nowMs: 1_000 });
    const second = await store.hit({ key: "k1", windowSeconds: 60, maxRequests: 2, nowMs: 1_100 });
    const third = await store.hit({ key: "k1", windowSeconds: 60, maxRequests: 2, nowMs: 1_200 });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after window expiration", async () => {
    const store = new MemoryRateLimitStore();

    await store.hit({ key: "k2", windowSeconds: 1, maxRequests: 1, nowMs: 1_000 });
    const blocked = await store.hit({ key: "k2", windowSeconds: 1, maxRequests: 1, nowMs: 1_200 });
    const reset = await store.hit({ key: "k2", windowSeconds: 1, maxRequests: 1, nowMs: 2_100 });

    expect(blocked.allowed).toBe(false);
    expect(reset.allowed).toBe(true);
    expect(reset.count).toBe(1);
  });
});
