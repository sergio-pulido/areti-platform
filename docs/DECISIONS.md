# Decisions

## 2026-03-02 - Monorepo Split (web/api/db)
- **Context:** The product needed a true backend layer with decoupled frontend and shared data model.
- **Decision:** Use npm workspaces with `apps/web`, `apps/api`, and `packages/db`.
- **Why:** Clear ownership boundaries, easier scaling, reusable DB logic, and cleaner testing/deployment.
- **Tradeoff:** Increased workspace/tooling complexity versus a single Next.js app.

## 2026-03-02 - Backend-owned auth/session/journal
- **Context:** Auth and journal were initially implemented directly in the frontend app.
- **Decision:** Move identity/session/journal logic to REST APIs in `apps/api` backed by shared DB package.
- **Why:** Centralized security logic and storage ownership; frontend becomes API client.
- **Tradeoff:** Requires API availability for authenticated UX paths.

## 2026-03-02 - Drizzle migrations as source of truth
- **Context:** DB initialization originally relied on ad-hoc SQL execution in code.
- **Decision:** Add `drizzle-kit` migration generation and `db:migrate` execution path.
- **Why:** Repeatable schema evolution and safer environment-to-environment consistency.
- **Tradeoff:** Extra migration maintenance discipline is required.

## 2026-03-02 - CMS CRUD + publish workflow via API
- **Context:** Content was read-only from frontend perspective after API migration.
- **Decision:** Add admin CRUD and status (draft/published) APIs plus dashboard CMS page.
- **Why:** Non-hardcoded content lifecycle with publish control and internal operations UX.
- **Tradeoff:** Larger API surface area and stricter role gating responsibilities.

## 2026-03-02 - Add integration and e2e tests in-repo
- **Context:** Need confidence across API and frontend boundaries after architectural split.
- **Decision:** Add API integration tests (Vitest/Supertest) and frontend e2e test (Playwright).
- **Why:** Protects critical flows (signup/auth/journal/content publishing/rendering).
- **Tradeoff:** Longer local and CI run time.

## 2026-03-02 - Docker Compose for one-command runtime
- **Context:** Fast local onboarding and reproducible service startup were required.
- **Decision:** Add `Dockerfile.api`, `Dockerfile.web`, and `docker-compose.yml`.
- **Why:** Standardized runtime for web+api with shared persisted data volume.
- **Tradeoff:** Larger build times and image size for local iteration.

## 2026-03-02 - Access/Refresh token model with rotation
- **Context:** Single session token model limited modern auth hardening and session lifecycle control.
- **Decision:** Introduce short-lived access sessions + refresh sessions with refresh token rotation on refresh.
- **Why:** Better containment for token exposure and explicit revocation/rotation semantics.
- **Tradeoff:** More complex frontend session handling and cookie/token synchronization.

## 2026-03-02 - Optional MFA and passkey preference layer
- **Context:** Security settings needed visible account-level hardening options.
- **Decision:** Add MFA challenge verification flow and passkey-enabled preference flags at API/DB level.
- **Why:** Enables step-up authentication path now and full passkey rollout path next.
- **Tradeoff:** MFA delivery remains dev-only until production delivery channel is integrated.

## 2026-03-02 - Backend chatbot + moderation boundary
- **Context:** Chat responses were generated in the web app route, limiting policy and provider control.
- **Decision:** Move chat generation to backend API with moderation checks and provider fallback.
- **Why:** Centralized policy enforcement and easier provider abstraction.
- **Tradeoff:** Additional backend latency and provider-key configuration requirements.

## 2026-03-02 - Admin audit logs for privileged mutations
- **Context:** CMS mutations lacked an immutable operational trace.
- **Decision:** Record admin content mutations to `admin_audit_logs` and expose an admin audit listing endpoint/UI panel.
- **Why:** Improves operational transparency, incident review, and accountability.
- **Tradeoff:** Additional storage growth and payload sanitization considerations over time.

## 2026-03-02 - WebAuthn passkey ceremony implementation
- **Context:** Passkeys existed only as a preference toggle, without real registration/authentication flow.
- **Decision:** Implement full WebAuthn challenge/verification endpoints for passkey registration and passkey sign-in using `@simplewebauthn`, plus browser UX wiring.
- **Why:** Enables practical passwordless authentication and aligns security posture with modern auth expectations.
- **Tradeoff:** Added complexity in challenge lifecycle, browser compatibility constraints, and passkey credential state management.
