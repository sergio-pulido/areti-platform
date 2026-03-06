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

## 2026-03-02 - Eliminate dead CTA patterns in dashboard UX
- **Context:** Several dashboard controls looked clickable but had no action (dead buttons/static prompt cards), creating misleading UX.
- **Decision:** Convert dead controls to real interactions by wiring them to routes, quick-action menus, and query-driven prefill flows.
- **Why:** Prevents false affordances, improves navigation clarity, and ensures every visible CTA has a concrete user outcome.
- **Tradeoff:** More route coupling through query params, which requires basic sanitization and maintenance of accepted prefill values.

## 2026-03-02 - Standardize interactive card + CTA regression checks
- **Context:** Clickable UI patterns were implemented ad-hoc, and CTA regressions could return without automated coverage.
- **Decision:** Add a shared `InteractiveCardLink` component, baseline keyboard focus-visible styles, and Playwright coverage for key dashboard CTA flows.
- **Why:** Improves UX consistency, accessibility, and prevents future dead CTA regressions through automated checks.
- **Tradeoff:** Slightly larger UI abstraction surface and longer e2e runtime for local/CI pipelines.

## 2026-03-02 - Shift dashboard nav to domain-based IA with contextual sidebars
- **Context:** Flat navigation mixed personal tools with account/security and creator operations, causing unclear mental models.
- **Decision:** Introduce sectioned navigation domains (Personal, Community, Creator, Account), move Settings into Account, add dedicated sub-pages for Community and Creator areas, and render only the active section's sidebar tabs.
- **Why:** Aligns navigation with user intent and ownership boundaries (self-work vs community vs publishing vs account), while removing cross-section tab noise.
- **Tradeoff:** More routes and navigation metadata to maintain as features evolve.

## 2026-03-02 - Canonical section URLs + topbar section entry
- **Context:** Section discovery and switching needed to happen from topbar/user menu instead of sidebar-level global switching.
- **Decision:** Add canonical section route families (`/community/*`, `/creator/*`, `/account/*`), keep `/dashboard/*` as personal workspace, and expose section entry via topbar plus user dropdown for Account/Community/Creator.
- **Why:** Matches expected mental model: topbar controls section context, sidebar shows only local tabs for the active section.
- **Tradeoff:** Temporary route duplication (`/dashboard/*` and canonical aliases) is maintained during the build phase.

## 2026-03-02 - Enforce creator role gating in section navigation
- **Context:** Creator functionality should not appear as available to all authenticated users.
- **Decision:** Gate Creator section entry and links by role (admin-only), and enforce route-level access control on `/creator/*`.
- **Why:** Aligns UI affordances with authorization boundaries and prevents misleading entry points.
- **Tradeoff:** Test flows must handle role-dependent navigation visibility.
