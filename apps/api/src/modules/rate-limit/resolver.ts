import type { RateLimitPolicyOverrideRecord } from "@areti/db";
import { RATE_LIMIT_POLICIES } from "./policies.js";
import type {
  RateLimitOverridesProvider,
  RateLimitPolicyDefinition,
  RateLimitPolicyKey,
  RateLimitRequestContext,
  RateLimitRuntimeConfig,
  ResolvedRateLimitPolicy,
} from "./types.js";

const OVERRIDE_SCOPE_PRECEDENCE: Record<RateLimitPolicyOverrideRecord["scopeType"], number> = {
  user: 1,
  role: 2,
  plan: 3,
  country: 4,
  feature_flag: 5,
  global: 6,
};

function isFinitePositiveInteger(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function resolveMaxRequests(policy: RateLimitPolicyDefinition, isAuthenticated: boolean): number {
  if (isAuthenticated && isFinitePositiveInteger(policy.authenticatedMaxRequests)) {
    return Math.floor(policy.authenticatedMaxRequests);
  }

  if (!isAuthenticated && isFinitePositiveInteger(policy.anonymousMaxRequests)) {
    return Math.floor(policy.anonymousMaxRequests);
  }

  if (isFinitePositiveInteger(policy.maxRequests)) {
    return Math.floor(policy.maxRequests);
  }

  if (isFinitePositiveInteger(policy.authenticatedMaxRequests)) {
    return Math.floor(policy.authenticatedMaxRequests);
  }

  if (isFinitePositiveInteger(policy.anonymousMaxRequests)) {
    return Math.floor(policy.anonymousMaxRequests);
  }

  return 1;
}

function applyNumericOverride<T extends RateLimitPolicyDefinition>(
  policy: T,
  key: keyof Pick<
    RateLimitPolicyDefinition,
    | "windowSeconds"
    | "maxRequests"
    | "anonymousMaxRequests"
    | "authenticatedMaxRequests"
    | "burstRequests"
  >,
  value: number | null | undefined,
): void {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    policy[key] = Math.floor(value);
  }
}

function overrideMatchesContext(
  override: RateLimitPolicyOverrideRecord,
  context: RateLimitRequestContext,
): boolean {
  switch (override.scopeType) {
    case "global":
      return true;
    case "user":
      return Boolean(context.actor.userId && override.scopeValue === context.actor.userId);
    case "role":
      return Boolean(context.actor.role && override.scopeValue === context.actor.role);
    case "plan":
      return Boolean(context.actor.plan && override.scopeValue === context.actor.plan);
    case "country":
      return Boolean(context.actor.country && override.scopeValue === context.actor.country);
    case "feature_flag":
      return Boolean(
        override.scopeValue &&
          context.actor.featureFlags.some((featureFlag) => featureFlag === override.scopeValue),
      );
    default:
      return false;
  }
}

function selectBestOverride(
  overrides: RateLimitPolicyOverrideRecord[],
  context: RateLimitRequestContext,
): RateLimitPolicyOverrideRecord | null {
  const matching = overrides.filter((override) => overrideMatchesContext(override, context));

  if (matching.length === 0) {
    return null;
  }

  const sorted = [...matching].sort((left, right) => {
    const leftRank = OVERRIDE_SCOPE_PRECEDENCE[left.scopeType] ?? 999;
    const rightRank = OVERRIDE_SCOPE_PRECEDENCE[right.scopeType] ?? 999;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    if (left.updatedAt !== right.updatedAt) {
      return right.updatedAt.localeCompare(left.updatedAt);
    }

    return right.createdAt.localeCompare(left.createdAt);
  });

  return sorted[0] ?? null;
}

export class RateLimitResolver {
  constructor(
    private readonly config: RateLimitRuntimeConfig,
    private readonly overridesProvider?: RateLimitOverridesProvider,
  ) {}

  async resolve(
    policyKey: RateLimitPolicyKey,
    context: RateLimitRequestContext,
  ): Promise<ResolvedRateLimitPolicy> {
    const basePolicy = RATE_LIMIT_POLICIES[policyKey];

    if (!basePolicy) {
      throw new Error(`Unknown rate limit policy key \"${policyKey}\".`);
    }

    const mutablePolicy: RateLimitPolicyDefinition = {
      ...basePolicy,
      tags: [...basePolicy.tags],
      routePatternHints: [...basePolicy.routePatternHints],
    };

    let source: ResolvedRateLimitPolicy["source"] = "base";
    let sourceReason = "code-defaults";
    let overrideId: string | null = null;

    const envOverride = this.config.policyEnvOverrides[policyKey];
    if (envOverride) {
      if (typeof envOverride.enabled === "boolean") {
        mutablePolicy.enabled = envOverride.enabled;
      }

      applyNumericOverride(mutablePolicy, "windowSeconds", envOverride.windowSeconds);
      applyNumericOverride(mutablePolicy, "maxRequests", envOverride.maxRequests);
      applyNumericOverride(mutablePolicy, "anonymousMaxRequests", envOverride.anonymousMaxRequests);
      applyNumericOverride(
        mutablePolicy,
        "authenticatedMaxRequests",
        envOverride.authenticatedMaxRequests,
      );
      applyNumericOverride(mutablePolicy, "burstRequests", envOverride.burstRequests);

      source = "env";
      sourceReason = "env-policy-override";
    }

    if (this.config.useDbOverrides && this.overridesProvider) {
      const asOfIso = new Date().toISOString();
      const activeOverrides = await this.overridesProvider(policyKey, asOfIso);
      const selectedOverride = selectBestOverride(activeOverrides, context);

      if (selectedOverride) {
        if (typeof selectedOverride.enabled === "boolean") {
          mutablePolicy.enabled = selectedOverride.enabled;
        }

        applyNumericOverride(mutablePolicy, "windowSeconds", selectedOverride.windowSeconds);
        applyNumericOverride(mutablePolicy, "maxRequests", selectedOverride.maxRequests);
        applyNumericOverride(
          mutablePolicy,
          "anonymousMaxRequests",
          selectedOverride.anonymousMaxRequests,
        );
        applyNumericOverride(
          mutablePolicy,
          "authenticatedMaxRequests",
          selectedOverride.authenticatedMaxRequests,
        );
        applyNumericOverride(mutablePolicy, "burstRequests", selectedOverride.burstRequests);

        source = "db";
        sourceReason = `${selectedOverride.scopeType}:${selectedOverride.scopeValue ?? "*"}`;
        overrideId = selectedOverride.id;
      }
    }

    const maxRequests = Math.max(1, resolveMaxRequests(mutablePolicy, Boolean(context.actor.userId)));
    const windowSeconds = Math.max(1, Math.floor(mutablePolicy.windowSeconds));

    return {
      key: mutablePolicy.key,
      description: mutablePolicy.description,
      enabled: this.config.enabled && mutablePolicy.enabled,
      windowSeconds,
      maxRequests,
      bucketStrategy: mutablePolicy.bucketStrategy,
      tags: mutablePolicy.tags,
      source,
      sourceReason,
      overrideId,
    };
  }
}
