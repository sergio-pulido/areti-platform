import type { RateLimitDecision, RateLimitStoreInput } from "../types.js";

export interface RateLimitStore {
  hit(input: RateLimitStoreInput): Promise<RateLimitDecision>;
  disconnect?(): Promise<void>;
}
