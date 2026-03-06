# Project State

## Current Status
- Monorepo architecture is active with frontend (`apps/web`), backend (`apps/api`), and shared DB/ORM (`packages/db`).
- Frontend authentication now uses access + refresh session tokens stored in HTTP-only cookies.
- Backend provides refresh-token rotation, optional MFA challenge flow, WebAuthn passkey registration/login, and admin audit logging.
- Content remains fully API-driven with admin CMS CRUD + publish controls.
- Dashboard UX interaction audit completed: previously dead CTAs/cards were wired to real destinations or actions.
- Reusable interactive card component and focus-visible accessibility baseline are in place for keyboard navigation consistency.
- Dashboard information architecture is now domain-based (Personal, Community, Creator, Account) with Settings moved under Account and contextual sidebars per active section.
- Canonical section routes are now available at `/community/*`, `/creator/*`, and `/account/*`, with section entry from topbar and account/community/creator access from the user dropdown.
- Creator section visibility is now role-gated (admin-only) in topbar, sidebar context resolution, and user dropdown links.
- Integration tests, e2e tests, migration tooling, and Docker Compose startup are in place.

## Delivered Scope
- Workspace setup and orchestration scripts (`dev`, `build`, `lint`, `test`).
- Shared DB package:
  - Drizzle schema for users/sessions/refresh/mfa/passkeys/audit/journal/content
  - migration generation + apply tooling
  - automatic migration run on initialization
  - content seed bootstrap
- Backend REST APIs:
  - auth: signup/signin/me/refresh/logout
  - passkey auth: challenge options + assertion verification
  - security: settings, MFA toggle, passkey toggle
  - passkey registration: challenge options + attestation verification
  - user data: dashboard summary + journal list/create
  - chat: backend endpoint with moderation + provider hook fallback
  - public content: landing/library/practices/community
  - admin CMS APIs: CRUD + publish/unpublish + audit log listing
- Frontend integration:
  - signup/signin wired to access+refresh tokens
  - MFA-required sign-in second step UI
  - passkey sign-in in auth UI and passkey registration in settings
  - dashboard/journal/CMS/settings fully backend-backed
  - settings controls for MFA/passkey toggles
  - chat route proxies through backend chat API
  - CMS shows recent admin audit logs
  - dashboard topnav quick actions, practices/community CTAs, and chat prompt cards are now fully interactive
  - contextual sidenav per active domain with topbar-driven section entry and new Community/Creator sub-areas
- QA and tooling:
  - API integration tests (`vitest + supertest`)
  - frontend e2e tests (`playwright`) now include dashboard CTA navigation and section-specific sidebar isolation checks
  - Dockerfiles + `docker-compose.yml`

## Tech Stack
- Frontend: Next.js 16 + TypeScript + Tailwind CSS v4
- Backend: Express + TypeScript
- DB/ORM: SQLite + Drizzle ORM + Drizzle Kit
- Testing: Vitest, Supertest, Playwright
- Containers: Docker + Docker Compose

## Known Gaps
- MFA delivery is currently dev-oriented (verification code logged server-side) instead of email/SMS/TOTP app delivery.
- Passkey management is minimal (register + sign-in). Credential revocation, naming, and device inventory UX are not implemented.
- Chat provider integration currently uses direct provider call with fallback response; no persisted conversation history yet.

## Next Milestones
1. Add passkey lifecycle management (list, rename, revoke) and recovery fallback UX.
2. Replace dev MFA code logging with production delivery (TOTP app or transactional channel).
3. Persist chat threads and message history with user controls.
4. Add CI workflow execution and artifact publishing for e2e traces.
