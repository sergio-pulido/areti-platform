# Project State

## Current Status
- Monorepo architecture is active with frontend (`apps/web`), backend (`apps/api`), and shared DB/ORM (`packages/db`).
- Canonical section routing is active (`/dashboard` overview, standalone personal tools at `/chat`, `/journal`, `/library`, `/practices`, plus `/community/*`, `/creator/*`, `/account/*`) with contextual sidebars and topbar section entry.
- Community and creator domains are now fully API-backed across pages and CMS.
- Notifications are persisted and wired to topbar bell with unread/read-all/read-one behavior.
- Security settings now include production-ready TOTP enrollment/verification/removal, passkey lifecycle controls, and device/session revocation.
- Chat is productized with persisted threads/messages and user controls (create/switch/rename/archive/delete).
- Chat provider runtime now supports ordered fallback (`deepseek,openai` by default) with provider-specific key/model/base-url env wiring.
- API now auto-loads chat provider env from `apps/api/.env` and repo-root `.env`, and returns explicit `502` when configured providers are unreachable.
- Release quality gates now include one-command CI (`npm run ci`), API integration tests, e2e, build, and accessibility smoke tests.
- Library and practices now use explicit manual seed execution (`db:seed:library-practices`) and no longer auto-seed on DB startup.
- Library/practice cards now route to DB-backed detail pages fetched by slug, with full body content stored in DB.
- Admin-only creation pages are now available directly in member-facing library/practices sections.

## Delivered Scope
- DB/ORM:
  - Added tables for challenges/resources/experts/events/videos.
  - Added tables for notifications, chat threads/messages, TOTP secrets, and device tracking.
  - Added session-refresh linkage to device identity and passkey lifecycle fields.
  - Added `content` and `protocol` fields to library/practice tables for full detail rendering.
  - Switched library/practice seed loading to explicit command-run seeding (`db:seed:library-practices`).
- API:
  - Added content endpoints:
    - `/api/v1/content/challenges`
    - `/api/v1/content/resources`
    - `/api/v1/content/experts`
    - `/api/v1/content/events`
    - `/api/v1/content/videos`
    - `/api/v1/content/library/:slug`
    - `/api/v1/content/practices/:slug`
  - Added admin CRUD/status endpoints under `/api/v1/admin/content/*` for all new content types.
  - Added notifications endpoints:
    - `GET /api/v1/notifications`
    - `PATCH /api/v1/notifications/:id/read`
    - `POST /api/v1/notifications/read-all`
  - Added chat thread endpoints:
    - `GET/POST /api/v1/chat/threads`
    - `PATCH/DELETE /api/v1/chat/threads/:id`
    - `GET/POST /api/v1/chat/threads/:id/messages`
  - Added ordered multi-provider chat resolution with env-driven provider order (`CHAT_PROVIDER_ORDER`) and DeepSeek/OpenAI provider configs.
  - Added security hardening endpoints:
    - `GET/PATCH/DELETE /api/v1/security/passkeys*`
    - `POST /api/v1/security/mfa/totp/setup`
    - `POST /api/v1/security/mfa/totp/verify`
    - `DELETE /api/v1/security/mfa/totp`
    - `GET/DELETE /api/v1/security/devices*`
  - Added chat rate limiting and API env validation.
- Web:
  - Community and creator pages now consume backend content APIs (no hardcoded arrays).
  - Creator root (`/creator`) now renders actionable overview page (no redirect).
  - Topbar bell now consumes notifications API; quick actions remains separate icon/control.
  - Account settings now include:
    - TOTP manager
    - passkey inventory with rename/revoke
    - device/session list with revoke actions
  - Chat UI now persists and manages threads/messages through backend APIs.
  - Library and practices lists now render reusable clickable card components.
  - Added `/library/[slug]` article detail and upgraded `/practices/[slug]` to DB protocol content.
  - Added admin-only create pages:
    - `/library/new`
    - `/practices/new`
  - Added proxy routes for thread chat and TOTP flows in Next route handlers.
- Testing/CI:
  - Expanded API integration tests for notifications, thread chat persistence, and challenge publish lifecycle.
  - Added accessibility smoke e2e checks for core secured routes.
  - Added GitHub Actions CI workflow and `npm run ci` aggregate command.

## Known Gaps
- External production error-monitoring provider credentials/integration are not yet configured (wiring point exists, provider choice pending).
- Final production infrastructure QA (real domain, TLS, deployment config, runtime observability thresholds) is pending.

## Next Milestones
1. Configure production monitoring provider and alerting policy.
2. Execute release candidate QA on staging/production-like infra (desktop/mobile + auth/chat/security).
3. Add performance budgets and track e2e/build trend regressions over time.
