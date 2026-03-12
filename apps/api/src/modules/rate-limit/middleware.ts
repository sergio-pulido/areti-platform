import type { NextFunction, Request, RequestHandler, Response } from "express";
import { buildRateLimitBucketKey } from "./keys.js";
import { logRateLimitBlock } from "./logger.js";
import { getClientIp } from "./ip.js";
import { persistRateLimitBlockEvent } from "./events.js";
import { sendRateLimitedResponse } from "./response.js";
import type { RateLimitResolver } from "./resolver.js";
import type { RateLimitStore } from "./store/rate-limit-store.js";
import type {
  RateLimitActorContext,
  RateLimitPolicyKey,
  RateLimitRequestContext,
  RateLimitRuntimeConfig,
} from "./types.js";

type RequestWithAuth = Request & {
  authUser?: {
    id: string;
    role?: string;
    plan?: string | null;
    trustLevel?: string | null;
  };
};

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

function extractRequestId(request: Request): string | null {
  return firstHeaderValue(request.headers["x-request-id"]);
}

function extractCountry(request: Request): string | null {
  return (
    firstHeaderValue(request.headers["cf-ipcountry"]) ||
    firstHeaderValue(request.headers["x-vercel-ip-country"]) ||
    firstHeaderValue(request.headers["x-country-code"])
  );
}

function extractEmail(request: Request): string | null {
  const body = request.body;

  if (!body || typeof body !== "object") {
    return null;
  }

  const email = (body as { email?: unknown }).email;
  if (typeof email !== "string") {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function buildActorContext(request: RequestWithAuth): RateLimitActorContext {
  return {
    userId: request.authUser?.id ?? null,
    role: request.authUser?.role ?? null,
    plan: request.authUser?.plan ?? null,
    country: extractCountry(request),
    trustLevel: request.authUser?.trustLevel ?? null,
    featureFlags: [],
  };
}

export function createRateLimitMiddlewareFactory(input: {
  config: RateLimitRuntimeConfig;
  resolver: RateLimitResolver;
  store: RateLimitStore;
}): (policyKey: RateLimitPolicyKey, routeId: string) => RequestHandler {
  return (policyKey: RateLimitPolicyKey, routeId: string): RequestHandler => {
    return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
      const requestWithAuth = request as RequestWithAuth;

      try {
        const context: RateLimitRequestContext = {
          request,
          routeId,
          method: request.method.toUpperCase(),
          path: request.path,
          ip: getClientIp(request),
          userAgent: request.header("user-agent")?.slice(0, 255) ?? null,
          requestId: extractRequestId(request),
          email: extractEmail(request),
          actor: buildActorContext(requestWithAuth),
        };

        const resolvedPolicy = await input.resolver.resolve(policyKey, context);

        if (!resolvedPolicy.enabled) {
          next();
          return;
        }

        const bucketKey = buildRateLimitBucketKey(resolvedPolicy, context);
        const decision = await input.store.hit({
          key: bucketKey,
          windowSeconds: resolvedPolicy.windowSeconds,
          maxRequests: resolvedPolicy.maxRequests,
        });

        if (decision.allowed) {
          next();
          return;
        }

        const blockEvent = {
          policyKey: resolvedPolicy.key,
          route: routeId,
          method: context.method,
          ip: context.ip,
          userId: context.actor.userId,
          country: context.actor.country,
          plan: context.actor.plan,
          trustLevel: context.actor.trustLevel,
          blocked: true,
          retryAfterSeconds: decision.retryAfterSeconds,
          requestCount: decision.count,
          limitValue: resolvedPolicy.maxRequests,
          windowSeconds: resolvedPolicy.windowSeconds,
          scopeType: resolvedPolicy.bucketStrategy,
          userAgent: context.userAgent,
          requestId: context.requestId,
        };

        try {
          persistRateLimitBlockEvent(input.config, blockEvent);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(
            `[rate-limit] Unable to persist block event for policy ${resolvedPolicy.key}: ${
              error instanceof Error ? error.message : "unknown error"
            }`,
          );
        }

        logRateLimitBlock(input.config, blockEvent);
        sendRateLimitedResponse(response, decision.retryAfterSeconds);
      } catch (error) {
        next(error);
      }
    };
  };
}
