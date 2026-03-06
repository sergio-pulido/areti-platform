# Ataraxia v1.5 Launch Backlog

## M1 Route/Nav
- [x] Use canonical section entry points from topbar and user menu (`/community/*`, `/creator/*`, `/account/*`) | Owner: Codex | Priority: P0 | Acceptance: No nav entry points rely on deprecated section paths
- [x] Keep `/dashboard/*` focused on personal workspace while section sidebars stay isolated | Owner: Codex | Priority: P0 | Acceptance: Sidebar shows only active section tabs
- [x] Remove creator root redirect and provide concrete `/creator` overview page | Owner: Codex | Priority: P1 | Acceptance: `/creator` renders actionable content without redirect

## M2 Community+Creator Data
- [x] Add DB tables and REST APIs for challenges/resources/experts/events/videos | Owner: Codex | Priority: P0 | Acceptance: Public endpoints return persisted data for all five types
- [x] Replace hardcoded arrays in community and creator pages with API-backed data calls | Owner: Codex | Priority: P0 | Acceptance: No static content arrays remain in `community/*` or `creator/*` pages
- [x] Expand CMS admin CRUD/status flows to manage all new content types | Owner: Codex | Priority: P0 | Acceptance: CMS supports create/edit/publish/unpublish/delete for new domains

## M3 Notifications
- [x] Implement notification persistence and REST APIs for list/read/read-all | Owner: Codex | Priority: P0 | Acceptance: `/api/v1/notifications*` endpoints are functional and tested
- [x] Wire topbar bell to API data with unread badge and read actions | Owner: Codex | Priority: P0 | Acceptance: Bell dropdown uses live notification data and updates read state
- [x] Keep quick actions on a separate control from notifications | Owner: Codex | Priority: P0 | Acceptance: Bell and quick-actions controls are distinct and independently functional

## M4 Security
- [x] Implement TOTP setup/verify/remove APIs and settings UI | Owner: Codex | Priority: P0 | Acceptance: MFA can be enrolled and disabled without dev-only code logging
- [x] Add passkey lifecycle management (list/rename/revoke) API + UI | Owner: Codex | Priority: P0 | Acceptance: Passkeys are manageable end-to-end from account settings
- [x] Add session/device visibility and revoke controls | Owner: Codex | Priority: P0 | Acceptance: User can list devices and revoke non-current devices
- [x] Ensure privileged admin and security changes remain auditable | Owner: Codex | Priority: P1 | Acceptance: Existing admin audit log stream continues capturing privileged content actions

## M5 Chat Persistence
- [x] Add chat thread/message persistence tables and APIs | Owner: Codex | Priority: P0 | Acceptance: Thread CRUD and message storage survive refresh
- [x] Migrate chat UI to thread-based backend flows while keeping legacy `/api/v1/chat` compatibility | Owner: Codex | Priority: P0 | Acceptance: Chat page supports create/switch/rename/archive/delete with persisted history
- [x] Add API integration coverage for thread/message flows | Owner: Codex | Priority: P1 | Acceptance: Integration tests validate thread create + message persistence behavior

## M6 Release Gates
- [x] Add one-command CI script and GitHub workflow for lint/typecheck/integration/e2e/build | Owner: Codex | Priority: P0 | Acceptance: `npm run ci` and workflow execute full gate set
- [x] Add automated accessibility smoke checks for core secured routes | Owner: Codex | Priority: P1 | Acceptance: Playwright a11y smoke test validates keyboard + landmark baseline
- [x] Add environment validation and chat/auth rate limiting hardening in API | Owner: Codex | Priority: P0 | Acceptance: API validates env shape and enforces auth/chat request rate limits

## Blockers
- [ ] Production monitoring provider wiring (Sentry/Datadog/etc.) is not yet configured with external credentials | Owner: Product/DevOps | Priority: P1 | Acceptance: Runtime error events are exported to chosen monitoring backend
- [ ] Final browser/device QA pass on production infrastructure | Owner: QA | Priority: P1 | Acceptance: Signoff checklist completed for desktop/mobile + auth/chat/security flows

## Definition of Done
- [x] Every visible CTA/button/card has a concrete action
- [x] No incomplete pages in `/community/*`, `/creator/*`, `/account/*`, `/dashboard/*`
- [x] Community and creator pages are API-backed, not hardcoded
- [x] Security includes TOTP MFA, passkey lifecycle, and device/session controls
- [x] Chat threads/messages are persisted and user-manageable
- [x] CI gates run lint/typecheck/integration/e2e/build
- [x] Accessibility smoke checks cover core routes
