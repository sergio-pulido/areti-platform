# Decisions

## 2026-03-09 - Completion-aware progression + light gamification + deduped behavior notifications
- **Context:** Core content, notifications, and rewards existed but progression clarity and behavioral loops were weak: users could finish items without visible pathing, rewards was deferred, and notifications were mostly passive.
- **Decision:** Add completion-aware progression UX in `/library` and `/practices` (recommended-next + completion badges), expose authenticated completion inventory via `GET /api/v1/progress/completions`, replace `/account/rewards` placeholder with live milestone badges driven by journal/completion signals, and generate behavior notifications (content completion milestones and momentum reminders) with duplicate suppression windows.
- **Why:** Improves day-to-day guidance and retention loops without introducing heavy game mechanics or noisy notification spam.
- **Tradeoff:** Behavior notifications are generated from app activity (progress/dashboard route usage) rather than an always-on scheduler, so reminder timing is session-dependent.

## 2026-03-09 - Template-based content paths and regression coverage for rewards/progression
- **Context:** Completion-aware cards improved visibility, but users still needed faster route-level path selection and automated regression checks for new rewards/progression UX.
- **Decision:** Add lightweight path-template filters in content routes (`/library?path=starter|applied|mastery`, `/practices?path=daily|focus|evening`) and extend Playwright coverage to assert progression badges, template routing, and rewards page rendering.
- **Why:** Makes progression choices explicit in one click and protects newly shipped motivation surfaces against UI regressions.
- **Tradeoff:** Path templates are heuristic tags over existing content metadata rather than a fully modeled curriculum graph.

## 2026-03-09 - Centralize rewards milestone computation in backend progress API
- **Context:** Rewards milestone logic initially lived in web route code, duplicating progress calculations and making cross-client consistency harder.
- **Decision:** Add `GET /api/v1/progress/rewards` with server-side milestone computation (earned count, next milestone, and signal payload) and consume it from `/account/rewards`; add integration and e2e coverage for milestone transition behavior.
- **Why:** Keeps milestone rules in one source of truth, reduces frontend drift risk, and simplifies future channel expansion (mobile/app widgets).
- **Tradeoff:** Slightly larger API surface area and one additional authenticated request for rewards page load.

## 2026-03-09 - Public preview section with no-auth feature walkthroughs
- **Context:** Product needed a low-friction way for guests to explore key experiences before signup, while preserving existing authenticated flows.
- **Decision:** Add a dedicated public preview section (`/preview`) with unauthenticated preview pages for chat, dashboard, journal, library, and practices; back `/preview/chat` with a no-auth preview API (`/api/preview/chat`) using provider-backed responses with strict guest rate limits and token caps; add preview analytics event ingestion (`/api/v1/preview/events`) plus admin conversion summary endpoint (`/api/v1/admin/preview/analytics`), retention cleanup (90 days), and lightweight anti-bot heuristics (honeypot + minimum interaction time).
- **Why:** Enables feature discovery and conversion measurement without account creation, while keeping authenticated Companion thread behavior and secured data flows unchanged.
- **Tradeoff:** Preview surfaces are simplified/non-persistent and analytics relies on anonymous session IDs rather than authenticated user identity.

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

## 2026-03-07 - Standalone Companion section IA
- **Context:** Chat lived inside Personal navigation and mixed thread management into the main conversation surface.
- **Decision:** Promote `/chat` into a dedicated top-level Companion section with its own sidebar and conversation-history controls.
- **Why:** Gives chat a clear product identity, improves wayfinding, and keeps thread workflows consistent with section-based IA.
- **Tradeoff:** Added client-state coordination between chat pane and sidebar via URL + lightweight browser events.

## 2026-03-07 - Chat UX Wave 1 keeps non-streaming + active-only history
- **Context:** Wave 1 prioritized IA and usability upgrades over transport-level response streaming and archive mailbox complexity.
- **Decision:** Keep request/response chat transport, keep sidebar history focused on active threads, and defer SSE/archive tabs to later waves.
- **Why:** Delivers immediate UX gains with lower implementation risk and no backend API expansion.
- **Tradeoff:** No token-by-token response rendering and no archived-thread browsing UI in this iteration.

## 2026-03-07 - Companion uses draft-first thread creation
- **Context:** Creating a thread record from sidebar click caused premature DB writes and exposed management UI before the first message existed.
- **Decision:** Treat `/chat` as the draft state; `New thread` clears selection back to `/chat`, and thread creation is deferred until first message send.
- **Why:** Aligns behavior with user expectations and common AI chat products: drafting first, persisting only once a conversation starts.
- **Tradeoff:** Requires URL/query-state coordination so intro UI, starters, and active-thread controls switch cleanly after first send.

## 2026-03-07 - Auto-title untitled threads after first response
- **Context:** Deferred thread creation produces temporary untitled/default thread names unless title generation occurs after first exchange.
- **Decision:** Auto-generate a concise thread title for untitled threads right after the first assistant response and persist it via thread update.
- **Why:** Produces meaningful history labels without forcing manual rename and better matches modern chat UX norms.
- **Tradeoff:** Adds lightweight title-generation logic to the message write path and slight complexity in first-message handling.

## 2026-03-08 - Global Companion doctrine prompt with user addendum
- **Context:** Companion responses needed consistent philosophy-specialized behavior while still allowing personal customization.
- **Decision:** Apply a fixed global Areti system prompt first (env-overridable), then append optional user-level custom instructions from account preferences.
- **Why:** Preserves product identity/safety constraints while enabling personal tone and coaching preferences.
- **Tradeoff:** Adds a small preferences persistence surface and prompt-composition logic in chat request flow.

## 2026-03-08 - Companion archived thread tabs in Wave 2
- **Context:** Active-only history simplified Wave 1 but blocked practical archive/restore workflows.
- **Decision:** Add Active/Archived tabs in Companion history, keep active as default, and support restore via thread details actions.
- **Why:** Improves thread lifecycle management without introducing new routes or transport changes.
- **Tradeoff:** Slightly more complex UI state between selected thread, tab scope, and detail actions.

## 2026-03-08 - Persist chat lifecycle telemetry in first-party DB
- **Context:** Operational visibility into thread/message lifecycle was limited to ad-hoc logs.
- **Decision:** Persist chat events (`thread_first_message_created`, `thread_auto_titled`, rename/archive/restore/delete, provider failures) in `chat_events` and expose admin read API.
- **Why:** Enables deterministic QA and operational review without external analytics dependency.
- **Tradeoff:** Additional DB writes and retention considerations for telemetry growth over time.

## 2026-03-08 - Require verified email before session issuance
- **Context:** Signup previously created authenticated sessions immediately, without verified email ownership.
- **Decision:** Convert signup to pending-account mode, require `/api/v1/auth/verify-email` (token or 6-digit code), and issue tokens only after verification.
- **Why:** Strengthens account integrity and aligns auth lifecycle with production expectations.
- **Tradeoff:** Adds verification step friction and introduces resend/challenge lifecycle complexity.

## 2026-03-08 - Persist auditable legal consent at signup
- **Context:** Legal acceptance was not explicitly captured with policy-version evidence.
- **Decision:** Require Terms/Privacy checkboxes at signup and persist versioned acceptance records (`policy type/version`, timestamp, IP, user-agent) in `user_legal_consents`.
- **Why:** Improves compliance posture and supports future legal/version audits.
- **Tradeoff:** Slightly larger auth payloads and additional write overhead on signup.

## 2026-03-08 - Conversion-focused auth UX with low-friction signup
- **Context:** Auth pages were visually strong but had avoidable signup friction and unclear primary actions.
- **Decision:** Redesign `/auth/signin` and `/auth/signup` around explicit CTA hierarchy, visible field labels, passkey secondary CTA, stronger error/loading states, and a simplified auth-only topbar nav; remove signup `name` + `confirmPassword`; unify legal consent into one required checkbox (`acceptLegal`) while still recording both Terms and Privacy acceptance server-side.
- **Why:** Reduces initial account-creation friction, improves trust clarity, and keeps modern passkey flows visible without sacrificing compliance evidence.
- **Tradeoff:** New accounts now receive a provisional display name derived from email local-part until users personalize profile details later.

## 2026-03-08 - Enforce onboarding gate before secured app usage
- **Context:** Personalization signals were insufficient and optional onboarding allowed users into app flows without profile context.
- **Decision:** Add required `/onboarding` flow with persisted profile answers, block secured-shell access until completion, and allow edits later from Account settings.
- **Why:** Enables consistent personalization and prompt shaping from first authenticated usage.
- **Tradeoff:** Initial activation is longer by one required step.

## 2026-03-08 - Gate protected routes on cookie consent
- **Context:** Cookie policy existed, but runtime consent acknowledgment was not enforced before app usage.
- **Decision:** Add bottom-banner consent UX plus route-level gate redirecting protected paths to `/legal/cookies?next=...` until consent cookie is present.
- **Why:** Aligns product behavior with transparent cookie disclosure and acceptance flow.
- **Tradeoff:** Requires additional middleware/proxy logic and a consent cookie dependency for route access.

## 2026-03-08 - Unify topbar across guest and authenticated surfaces
- **Context:** Header behavior was fragmented across landing/auth/legal/secured pages and mobile action discoverability was inconsistent.
- **Decision:** Introduce shared `AppTopbar` for guest and authenticated states, keep desktop action ordering, and move mobile actions/search into user-dropdown patterns.
- **Why:** Delivers consistent navigation semantics and reduces duplicated header implementations.
- **Tradeoff:** Adds one shared component with broader responsibilities across route contexts.

## 2026-03-08 - Separate legal IA from account IA and expand account overview
- **Context:** Account sidenav mixed legal-policy links with profile/security controls, and `/account` lacked a comprehensive “typical account” dashboard.
- **Decision:** Keep account navigation focused on profile/settings, route legal policies canonically under `/legal/*`, and redesign `/account` into a multi-card overview for identity, security posture, activity, and common actions.
- **Why:** Improves information architecture clarity and gives users an account home that matches expected account-management patterns.
- **Tradeoff:** More account-page surface area to maintain, plus legacy `/account/{privacy,terms,cookies}` paths now act as redirect aliases.

## 2026-03-08 - Expand account into grouped multi-tab IA
- **Context:** A single account/settings surface was insufficient for typical account-management workflows (profile subsections, security operations, communication controls, saved content).
- **Decision:** Add grouped account navigation and dedicated routes for profile (`/account/profile`, `/account/extra-data`, `/account/contact`, `/account/professional`), security (`/account/security`, `/account/password`, `/account/sessions`, `/account/danger`), communication (`/account/notifications`, `/account/feedback`), and saved content (`/account/calendar`, `/account/likes`, `/account/favourites`, `/account/comments`, `/account/spaces`, `/account/documents`), keeping preferences in `/account/settings`.
- **Why:** Aligns account UX with expected product patterns and enables focused pages with clearer responsibilities.
- **Tradeoff:** Increased route/UI maintenance surface, with some pages currently scaffolded pending deeper data-model integration.

## 2026-03-08 - Stoicism-native account domain over copied `/account/*` API pattern
- **Context:** Reference material from another app provided useful IA ideas but included mismatched API/domain boundaries and features not aligned with this product.
- **Decision:** Keep account behavior in native domain surfaces (`/auth`, `/notifications`, `/onboarding`, `/security`) and implement only core account capabilities now: identity/profile persistence, preferences, notification preferences, password change, sessions/security, and deletion lifecycle.
- **Why:** Preserves architectural coherence, minimizes unnecessary endpoints, and keeps implementation aligned with existing backend ownership and schema patterns.
- **Tradeoff:** Deferred sections stay intentionally disabled/visible (“Coming soon”) until product scope promotes them.

## 2026-03-08 - Dashboard shifted from stats-first to action-first daily hub
- **Context:** The dashboard looked premium but prioritized passive metrics over immediate user action, reducing fast time-to-value on return visits.
- **Decision:** Redesign `/dashboard` around a dominant next-step recommendation, actionable daily shortcuts, continuity/resume content, structured reflections, contextual Companion prompts, lightweight practical progress, and conditional account nudges.
- **Why:** Aligns homepage behavior with retention and daily engagement goals by answering "what should I do now?" in under 10 seconds.
- **Tradeoff:** Some progress signals are currently heuristic/mocked until deeper lesson/practice progress APIs are available.

## 2026-03-08 - Compute dashboard progress signals server-side
- **Context:** Dashboard progress and recency behavior depended on frontend heuristics, which could drift from persisted user activity.
- **Decision:** Extend `/api/v1/dashboard/summary` to include computed progress (`streakDays`, `reflectionsThisWeek`, `daysSinceLastEntry`) derived from journal history on the backend.
- **Why:** Provides a single, authoritative progress source for home recommendations and UI summaries.
- **Tradeoff:** Current signals are journal-derived; lesson/practice completion remains a later API extension.

## 2026-03-08 - Track lesson/practice completion as first-party progress data
- **Context:** Dashboard lesson/practice progress still depended on heuristics because completion events were not persisted.
- **Decision:** Add `user_content_completions` persistence and `POST /api/v1/progress/complete`, then include completion-backed fields in dashboard summary (`lessonsCompleted`, `totalLessons`, `practicesCompletedThisWeek`).
- **Why:** Makes progress indicators behaviorally meaningful and tied to real user actions.
- **Tradeoff:** Completion is currently user-declared (explicit "mark complete"), not yet auto-derived from deep interaction telemetry.

## 2026-03-08 - Remove runtime Google font dependency for deterministic dev/e2e startup
- **Context:** Turbopack/dev e2e runs intermittently failed when Google font fetch/internal font module resolution was unavailable.
- **Decision:** Replace `next/font/google` runtime imports in root layout with deterministic local CSS font stacks via `--font-title` and `--font-body` variables.
- **Why:** Stabilizes local/dev/test startup and removes external network dependency for core rendering.
- **Tradeoff:** Typography is now system-stack based until self-hosted custom font assets are introduced.

## 2026-03-08 - Consolidate profile UX for personal-use product fit
- **Context:** Splitting profile into main/extra/contact/professional tabs reflected a copied enterprise/community pattern and did not match this app’s personal-use scope.
- **Decision:** Collapse account identity editing into a single `/account/profile` tab and remove extra/professional profile sections from account navigation (legacy routes redirect to profile).
- **Why:** Simpler IA, less cognitive load, and better alignment with a solo personal-practice product.
- **Tradeoff:** Existing schema can still hold extra fields, but UI/API focus intentionally limits surfaced profile controls.

## 2026-03-08 - Companion UX Wave 3 focuses on guided reflective conversation
- **Context:** Companion had strong visual polish but remained overly container-heavy and passive, with weak chat hierarchy, generic composer behavior, and low thread re-entry clarity.
- **Decision:** Refactor frontend chat UX in `apps/web` to reduce chrome and increase guidance: compact thread header with overflow actions, denser preview-first sidebar rows, structured assistant message rendering, contextual follow-up chips, and a mode-driven composer with rotating suggestions + resume cues.
- **Why:** Moves the product from “styled chatbot” toward a premium reflective companion that improves scanability, continuity, and practical next-step behavior without backend surface expansion.
- **Tradeoff:** Adds client-side UI/state logic for message structuring and suggestion helpers, which increases component complexity while keeping transport/API semantics unchanged.

## 2026-03-08 - B2C account IA simplification with canonical routes
- **Context:** Account navigation still looked like an admin console (home/settings/password/sessions/danger) and was harder to scan for consumer users.
- **Decision:** Move to six consumer-oriented tabs with canonical URLs: Profile (`/account/profile`), Preferences (`/account/preferences`), Notifications (`/account/notifications`), Security (`/account/security`), Subscription (`/account/subscription`), Privacy (`/account/privacy`). Merge password and sessions into Security, move deletion into Privacy, and redirect legacy routes.
- **Why:** Reduces cognitive load, improves first-scan comprehension, and aligns with a calm B2C product mental model.
- **Tradeoff:** Adds redirect-compatibility surface and consolidates more controls on the Security page.

## 2026-03-08 - Hide deferred account tabs until promoted to core scope
- **Context:** Showing disabled "coming soon" items in account nav increased noise and made the personal-use account IA feel unfinished.
- **Decision:** Keep deferred routes in code but remove them from account sidenav for now; only core tabs are visible.
- **Why:** Reduces cognitive load and keeps account navigation focused on actions users can complete today.
- **Tradeoff:** Deferred capabilities are less discoverable until explicitly reintroduced.

## 2026-03-08 - Prioritize completion-backed continuity on dashboard
- **Context:** Dashboard continuity cards still relied mostly on journal-only heuristics even after lesson/practice completion persistence existed.
- **Decision:** Extend dashboard summary with `progress.recentCompletions` and prefer those items in "Continue your path", with journal fallback when no completions exist.
- **Why:** Improves return-to-value by steering users back into recent useful behaviors instead of generic restarts.
- **Tradeoff:** Completion-based continuity currently favors explicit "mark complete" interactions and not partial-progress telemetry.

## 2026-03-08 - Make startup seed inserts conflict-safe
- **Context:** Parallel process startup (web/api/e2e seed scripts) could race on initial seed inserts and trigger unique-slug violations (`content_highlights.slug`).
- **Decision:** Keep startup seed checks but make seed inserts use conflict-ignore semantics so duplicate writes become no-ops.
- **Why:** Preserves deterministic startup in local/dev/test without adding locking complexity.
- **Tradeoff:** Seed conflicts are now tolerated by design, so accidental duplicate intent in seed data can be less visible unless explicitly validated.

## 2026-03-09 - Continue UI dedup pass for shared topbar and auth client helpers
- **Context:** Topbar/auth/security client code still had redundant files and repeated helper logic, increasing maintenance cost for styling and behavior updates.
- **Decision:** Keep `AppTopbar` as the single topbar implementation, extract guest CTA/legal actions into a dedicated shared component, delete unreferenced duplicate UI files, and centralize client API-response parsing plus auth validation helpers.
- **Why:** Reduces duplicate maintenance, keeps behavior consistent across routes, and lowers regression risk for future visual/theme changes.
- **Tradeoff:** Shared helpers/components now have broader usage, so changes in one place affect more flows and require focused verification.

## 2026-03-09 - Make email delivery transport explicit to protect test quotas
- **Context:** E2E signup/resend flows could use configured Resend credentials during local test runs, consuming provider quota.
- **Decision:** Add `EMAIL_TRANSPORT` modes (`disabled`, `resend`, `smtp`) with safe non-production default (`disabled`), keep production default (`resend`), and wire optional SMTP settings for MailHog/local inbox capture.
- **Why:** Prevents accidental external sends in automated/local testing while preserving production-grade delivery options.
- **Tradeoff:** Delivery behavior is now config-driven and requires explicit transport selection when testing real email inbox flows.

## 2026-03-09 - Standardize rounded deep-link focus highlight in account surfaces
- **Context:** Account pages accepted `?focus=*` parameters, but target emphasis was inconsistent and could render non-rounded highlight edges around rounded containers.
- **Decision:** Introduce a shared account focus highlight contract (`account-focus-highlight` + helper utility), apply it to all active account deep-link targets (Security + Privacy), and add e2e assertions for `focus=totp`, `focus=passkeys`, and `focus=deletion`.
- **Why:** Ensures deterministic, accessible visual orientation when users are redirected into dense settings screens, without per-page style drift.
- **Tradeoff:** Adds a small shared styling/API surface that must remain aligned with global design tokens.

## 2026-03-09 - Ship first-party PWA baseline with offline fallback
- **Context:** The web product needed installability and resilient offline behavior across mobile/desktop without adding heavy plugin/dependency overhead.
- **Decision:** Implement native Next.js PWA primitives: `app/manifest.ts`, generated app/apple icons, client-side service-worker registration, versioned custom service worker (`public/sw.js`), and an `/offline` fallback route; add no-cache header policy for `sw.js`.
- **Why:** Delivers install-ready UX, faster repeat visits, and graceful offline navigation while keeping the stack dependency-light and transparent.
- **Tradeoff:** Cache strategy is now app-owned code and requires explicit version bumps/maintenance when behavior changes.

## 2026-03-09 - Avoid caching authenticated API traffic in service worker
- **Context:** The initial service worker runtime strategy cached same-origin API GET responses, which risks stale or sensitive authenticated payload persistence.
- **Decision:** Keep `/api/*` requests network-only in the service worker and return explicit offline `503` JSON without cache fallback.
- **Why:** Reduces privacy/security risk and avoids hard-to-debug stale account/chat/security state when offline.
- **Tradeoff:** Offline API UX is less permissive; protected API responses are unavailable offline by design.

## 2026-03-09 - Add PWA release operational checklist and smoke regression test
- **Context:** PWA behavior now depends on app-owned manifest/service-worker logic, so regressions can slip in without explicit release discipline.
- **Decision:** Add `docs/PWA_RELEASE_CHECKLIST.md` and a Playwright smoke test (`tests/pwa.e2e.spec.ts`) validating manifest, `sw.js` headers, and offline route availability.
- **Why:** Makes cache/version/install verification explicit and automatable in CI/local release flow.
- **Tradeoff:** Slightly longer QA flow and one more e2e file to maintain as PWA behavior evolves.
