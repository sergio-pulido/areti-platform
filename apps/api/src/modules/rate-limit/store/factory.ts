import type { RateLimitRuntimeConfig } from "../types.js";
import type { RateLimitStore } from "./rate-limit-store.js";
import { MemoryRateLimitStore } from "./memory-store.js";
import { RedisRateLimitStore } from "./redis-store.js";

export function createRateLimitStore(config: RateLimitRuntimeConfig): RateLimitStore {
  if (config.store === "redis") {
    if (!config.redisUrl) {
      throw new Error("RATE_LIMIT_STORE=redis requires REDIS_URL.");
    }

    return new RedisRateLimitStore(config.redisUrl, config.redisPrefix);
  }

  return new MemoryRateLimitStore();
}
