import type { RateLimitDecision, RateLimitStoreInput } from "../types.js";
import type { RateLimitStore } from "./rate-limit-store.js";

type MemoryBucketState = {
  count: number;
  resetAtMs: number;
};

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, MemoryBucketState>();

  private hitCountSinceCleanup = 0;

  async hit(input: RateLimitStoreInput): Promise<RateLimitDecision> {
    const nowMs = input.nowMs ?? Date.now();
    const windowMs = input.windowSeconds * 1000;
    const existing = this.buckets.get(input.key);

    let nextState: MemoryBucketState;
    if (!existing || existing.resetAtMs <= nowMs) {
      nextState = {
        count: 1,
        resetAtMs: nowMs + windowMs,
      };
    } else {
      nextState = {
        count: existing.count + 1,
        resetAtMs: existing.resetAtMs,
      };
    }

    this.buckets.set(input.key, nextState);
    this.hitCountSinceCleanup += 1;

    if (this.hitCountSinceCleanup >= 200) {
      this.cleanupExpired(nowMs);
      this.hitCountSinceCleanup = 0;
    }

    const blocked = nextState.count > input.maxRequests;
    const remaining = Math.max(0, input.maxRequests - nextState.count);
    const retryAfterSeconds = Math.max(1, Math.ceil((nextState.resetAtMs - nowMs) / 1000));

    return {
      allowed: !blocked,
      count: nextState.count,
      remaining,
      retryAfterSeconds,
      resetAtMs: nextState.resetAtMs,
    };
  }

  private cleanupExpired(nowMs: number): void {
    for (const [key, value] of this.buckets.entries()) {
      if (value.resetAtMs <= nowMs) {
        this.buckets.delete(key);
      }
    }
  }
}
