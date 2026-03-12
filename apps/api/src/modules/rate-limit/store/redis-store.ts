import { Redis } from "ioredis";
import type { RateLimitDecision, RateLimitStoreInput } from "../types.js";
import type { RateLimitStore } from "./rate-limit-store.js";

const REDIS_RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return {current, ttl}
`;

export class RedisRateLimitStore implements RateLimitStore {
  private readonly client: Redis;

  constructor(
    redisUrl: string,
    private readonly keyPrefix: string,
  ) {
    this.client = new Redis(redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
    });
  }

  async hit(input: RateLimitStoreInput): Promise<RateLimitDecision> {
    const nowMs = input.nowMs ?? Date.now();
    const windowMs = input.windowSeconds * 1000;
    const redisKey = `${this.keyPrefix}:${input.key}`;

    const response = await this.client.eval(REDIS_RATE_LIMIT_SCRIPT, 1, redisKey, String(windowMs));

    if (!Array.isArray(response) || response.length < 2) {
      throw new Error("Unexpected Redis rate limit response shape.");
    }

    const count = Number(response[0]);
    const ttlMsRaw = Number(response[1]);

    if (!Number.isFinite(count)) {
      throw new Error("Redis rate limit count is not numeric.");
    }

    const ttlMs = Number.isFinite(ttlMsRaw) && ttlMsRaw > 0 ? ttlMsRaw : windowMs;
    const resetAtMs = nowMs + ttlMs;

    return {
      allowed: count <= input.maxRequests,
      count,
      remaining: Math.max(0, input.maxRequests - count),
      retryAfterSeconds: Math.max(1, Math.ceil(ttlMs / 1000)),
      resetAtMs,
    };
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect(false);
    }
  }
}
