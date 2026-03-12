import type { Response } from "express";

const RATE_LIMIT_MESSAGE = "Too many requests. Please try again later.";

export function sendRateLimitedResponse(response: Response, retryAfterSeconds: number): void {
  const safeRetryAfter = Math.max(1, Math.floor(retryAfterSeconds));

  response.setHeader("Retry-After", String(safeRetryAfter));
  response.status(429).json({
    error: {
      code: "RATE_LIMITED",
      message: RATE_LIMIT_MESSAGE,
      retryAfterSeconds: safeRetryAfter,
    },
    code: "RATE_LIMITED",
    message: RATE_LIMIT_MESSAGE,
  });
}
