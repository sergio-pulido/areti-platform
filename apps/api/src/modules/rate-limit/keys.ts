import { createHash } from "node:crypto";
import type { RateLimitRequestContext, ResolvedRateLimitPolicy } from "./types.js";

function toKeyPart(value: string | null | undefined): string {
  if (!value || value.trim().length === 0) {
    return "unknown";
  }
  return value.trim().toLowerCase().replace(/[^a-z0-9._:@-]/g, "_");
}

function resolveEmailPart(context: RateLimitRequestContext): string {
  return toKeyPart(context.email);
}

function resolveUserAgentFingerprint(userAgent: string | null): string {
  const normalized = (userAgent ?? "unknown-agent").trim().slice(0, 255);
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function buildRateLimitBucketKey(
  policy: ResolvedRateLimitPolicy,
  context: RateLimitRequestContext,
): string {
  const routePart = toKeyPart(context.routeId);

  switch (policy.bucketStrategy) {
    case "user_route": {
      const userPart = toKeyPart(context.actor.userId);
      return `rl:${policy.key}:user:${userPart}:route:${routePart}`;
    }

    case "ip_email_route": {
      const ipPart = toKeyPart(context.ip);
      const emailPart = resolveEmailPart(context);
      return `rl:${policy.key}:ip:${ipPart}:email:${emailPart}:route:${routePart}`;
    }

    case "ip_user_agent_route": {
      const ipPart = toKeyPart(context.ip);
      const uaPart = resolveUserAgentFingerprint(context.userAgent);
      return `rl:${policy.key}:ip:${ipPart}:ua:${uaPart}:route:${routePart}`;
    }

    case "ip_route":
    default: {
      const ipPart = toKeyPart(context.ip);
      return `rl:${policy.key}:ip:${ipPart}:route:${routePart}`;
    }
  }
}
