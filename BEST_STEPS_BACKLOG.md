# Best Steps Backlog

## Session Next Best Steps (2026-03-11)

1. Run Playwright e2e suite (`tests/web.e2e.spec.ts`, `tests/signup-gate.e2e.spec.ts`) in CI/staging to validate browser behavior end-to-end.
2. Add a small API endpoint for username availability checks to improve completion UX before submit.
3. Add explicit cleanup job/TTL purge for expired `signup_intents`.
4. Add telemetry for funnel stages (`start`, `verified`, `completed`, `dropoff`) to monitor conversion and invite performance.
5. Switch production to `RATE_LIMIT_STORE=redis` with `REDIS_URL` (memory remains process-local fallback).
6. Add admin CRUD for `rate_limit_policy_overrides` (currently read-only override consumption).
7. Add lightweight caching for DB override lookups to reduce per-request DB reads when overrides are enabled.
8. Add a small ops dashboard slice for grouped/aggregated block trends by policy and route.