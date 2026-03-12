import { beforeEach, describe, expect, it, vi } from "vitest";

const evalMock = vi.fn();
const quitMock = vi.fn();
const disconnectMock = vi.fn();

vi.mock("ioredis", () => {
  return {
    Redis: class MockRedis {
      eval = evalMock;
      quit = quitMock;
      disconnect = disconnectMock;
    },
  };
});

import { RedisRateLimitStore } from "./redis-store.js";

describe("RedisRateLimitStore", () => {
  beforeEach(() => {
    evalMock.mockReset();
    quitMock.mockReset();
    disconnectMock.mockReset();
  });

  it("maps redis counter responses to rate-limit decisions", async () => {
    evalMock.mockResolvedValueOnce([3, 45_000]);

    const store = new RedisRateLimitStore("redis://localhost:6379", "test");
    const result = await store.hit({ key: "bucket", windowSeconds: 60, maxRequests: 2, nowMs: 1_000 });

    expect(evalMock).toHaveBeenCalledTimes(1);
    expect(result.allowed).toBe(false);
    expect(result.count).toBe(3);
    expect(result.retryAfterSeconds).toBe(45);
  });

  it("falls back to window duration when redis ttl is unavailable", async () => {
    evalMock.mockResolvedValueOnce([1, -1]);

    const store = new RedisRateLimitStore("redis://localhost:6379", "test");
    const result = await store.hit({ key: "bucket", windowSeconds: 30, maxRequests: 3, nowMs: 10_000 });

    expect(result.allowed).toBe(true);
    expect(result.retryAfterSeconds).toBe(30);
    expect(result.resetAtMs).toBe(40_000);
  });
});
