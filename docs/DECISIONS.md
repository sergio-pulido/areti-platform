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

## 2026-03-06 - Expand content domains to publish-ready API-backed sections
- **Context:** Community/creator pages still relied on static arrays for challenges/resources/experts/events/videos.
- **Decision:** Add dedicated DB tables, public content endpoints, and admin CRUD/status APIs for each missing content domain.
- **Why:** Eliminates hardcoded page data and enables full CMS lifecycle for visible community/creator content.
- **Tradeoff:** Larger API and CMS surface area increases maintenance overhead.

## 2026-03-06 - Persist notifications and use topbar bell as real inbox
- **Context:** Notification bell UI existed but did not reflect server-backed state.
- **Decision:** Introduce `user_notifications` persistence and read/read-all REST APIs, then wire topbar bell to live unread/read behavior.
- **Why:** Removes fake affordances and enables reliable, stateful notification UX.
- **Tradeoff:** Additional write/read volume and revalidation paths for shell-level UI.

## 2026-03-06 - Productize chat with thread/message persistence
- **Context:** Chat was stateless and lost context on refresh/navigation.
- **Decision:** Introduce thread/message tables and thread-oriented APIs while keeping legacy `POST /api/v1/chat` compatibility.
- **Why:** Preserves user context, enables thread management, and supports publish-ready conversational UX.
- **Tradeoff:** More UI complexity (thread lifecycle management) and larger test matrix.

## 2026-03-06 - Replace dev MFA flow with TOTP lifecycle
- **Context:** MFA previously depended on server-logged verification codes unsuitable for production.
- **Decision:** Implement TOTP setup/verify/remove APIs and account UI backed by persisted user TOTP secret records.
- **Why:** Delivers production-appropriate second-factor flow with standard authenticator apps.
- **Tradeoff:** Secret management complexity and additional recovery/operational policy considerations.

## 2026-03-06 - Add passkey/device lifecycle controls
- **Context:** Passkeys existed for registration/sign-in but lacked lifecycle management and session/device controls.
- **Decision:** Add passkey list/rename/revoke APIs, device/session tracking table integration, and revoke-device actions in settings.
- **Why:** Gives users direct security posture control and closes major account-management gaps.
- **Tradeoff:** More session state coupling and account settings complexity.

## 2026-03-06 - Enforce release gate automation and accessibility smoke checks
- **Context:** Pre-release quality checks were present but not unified into a publish-ready gate.
- **Decision:** Add one-command CI (`npm run ci`), GitHub Actions workflow, and Playwright accessibility smoke suite on core routes.
- **Why:** Improves release confidence and catches regressions before publishing.
- **Tradeoff:** Increased CI runtime and operational cost.

## 2026-03-06 - Manual library/practice seeding with DB-backed detail pages
- **Context:** Library and practices required a true empty-state startup plus explicit initial content loading, while detail pages needed full DB content instead of static UI scaffolding.
- **Decision:** Remove auto-seeding for library/practice tables, add explicit `db:seed:library-practices` seeder, add full-body DB fields (`content`, `protocol`), and expose slug detail endpoints for both content types.
- **Why:** Gives deterministic environment control (empty vs seeded), enables realistic member-facing detail experiences, and keeps list/detail data fully backend-owned.
- **Tradeoff:** Slightly more setup responsibility in local/test environments (seeder command required when prefilled content is expected).

## 2026-03-06 - Admin content creation entrypoints in member sections
- **Context:** Admin creation existed only in CMS, while the product needed direct add flows from library/practice pages.
- **Decision:** Add admin-only create pages at `/library/new` and `/practices/new`, with reusable lesson/practice form field components shared with CMS add forms.
- **Why:** Reduces friction for content operations and keeps create schemas consistent across workflows.
- **Tradeoff:** Additional route surface and role-gated UX states to maintain.

## 2026-03-06 - Keep dashboard as overview, flatten personal tool URLs
- **Context:** Personal tools (chat/journal/library/practices) were nested under `/dashboard/*`, while the intended IA treats dashboard as a single overview page.
- **Decision:** Make `/dashboard` overview-only and expose personal tools as standalone routes: `/chat`, `/journal`, `/library`, `/practices` (including detail/create subroutes).
- **Why:** Cleaner URL model, simpler navigation mental model, and route structure aligned with section-level IA.
- **Tradeoff:** Existing internal links/revalidation logic required coordinated updates across nav, pages, and actions.

## 2026-03-06 - Ordered multi-provider chat runtime (DeepSeek primary, OpenAI fallback)
- **Context:** Chat had a single-provider configuration path, limiting runtime resilience and provider portability.
- **Decision:** Introduce ordered provider runtime config (`CHAT_PROVIDER_ORDER`) with OpenAI-compatible adapters for DeepSeek and OpenAI, defaulting to `deepseek,openai`.
- **Why:** Enables provider failover without code changes and keeps provider wiring extensible for future additions.
- **Tradeoff:** Additional environment configuration surface (provider keys/models/base URLs) to manage per environment.

## 2026-03-06 - Chat provider failure transparency + monorepo `.env` auto-loading
- **Context:** Local `npm run dev` could miss repo-root provider keys (workspace cwd), and provider failures were silently hidden by generic fallback answers.
- **Decision:** Auto-load `.env` from `apps/api` and monorepo root in API startup, and return explicit `502` errors when configured providers all fail.
- **Why:** Improves local reliability and makes provider misconfiguration/outage visible instead of masking it as successful chat output.
- **Tradeoff:** Chat no longer degrades to synthetic fallback when providers are configured but unavailable.
