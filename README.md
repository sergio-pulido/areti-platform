# Areti Monorepo

Monorepo for a Stoic + Epicurean philosophy platform with a separated frontend, backend API, and shared DB/ORM package.

## Workspace Structure
- `apps/web`: Next.js frontend (auth UI, sectioned app shell, Companion chat UI, legal pages, admin CMS)
- `apps/api`: Express REST API (auth/session/journal/content/admin)
- `packages/db`: Shared SQLite + Drizzle ORM schema/query/migration package

## Architecture
- Auth/session/journal and content are backend-owned via REST APIs.
- Frontend uses server actions + API clients and keeps HTTP-only access+refresh session tokens.
- Shared DB package runs Drizzle migrations; library/practice seed data is loaded via explicit command.

## REST API Surface
### Public
- `GET /health`
- `GET /api/v1/content/landing`
- `GET /api/v1/content/library?q=...`
- `GET /api/v1/content/library/:slug`
- `GET /api/v1/content/practices`
- `GET /api/v1/content/practices/:slug`
- `GET /api/v1/content/community`

### Auth
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/signin`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/passkey/options`
- `POST /api/v1/auth/passkey/verify`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/logout`

### Security
- `GET /api/v1/security/settings`
- `POST /api/v1/security/mfa`
- `POST /api/v1/security/passkeys`
- `POST /api/v1/security/passkeys/register/options`
- `POST /api/v1/security/passkeys/register/verify`

### Chat
- `POST /api/v1/chat`
- `GET /api/v1/chat/threads`
- `POST /api/v1/chat/threads`
- `PATCH /api/v1/chat/threads/:id`
- `DELETE /api/v1/chat/threads/:id`
- `GET /api/v1/chat/threads/:id/messages`
- `POST /api/v1/chat/threads/:id/messages`
- `POST /api/v1/chat/threads/:id/context/summarize`

### User Data
- `GET /api/v1/onboarding`
- `PUT /api/v1/onboarding`
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/journal?limit=...`
- `POST /api/v1/journal`

### Admin CMS
- `GET /api/v1/admin/content`
- `GET /api/v1/admin/audit`
- `GET /api/v1/admin/chat/events` (supports `limit`, `threadId`, `userId`, `eventType`, `memoryOnly`)
- CRUD + publish endpoints for:
  - lessons
  - practices
  - community circles
  - landing pillars
  - landing highlights

## Local Development
1. Install dependencies:

```bash
npm install
```

2. Generate migrations (when schema changes):

```bash
npm run db:generate
```

3. Apply migrations:

```bash
npm run db:migrate
```

4. Seed library and practices (manual, optional but recommended for local):

```bash
npm run db:seed:library-practices
```

5. Run API + web together:

```bash
npm run dev
```

Stop and fully free local dev ports:

```bash
npm run dev:stop
```

Check which process is still listening on the app ports:

```bash
npm run dev:ports
```

6. Open:
- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)

## Testing
- Lint + typechecks:

```bash
npm run lint
```

- Build verification:

```bash
npm run build
```

- Integration + e2e tests:

```bash
npm run test
```

E2E test startup forces `EMAIL_TRANSPORT=disabled`, so signup/resend flows do not hit external email providers.

## Progressive Web App (PWA)
- The web app now includes installable PWA metadata (`apps/web/src/app/manifest.ts`) and service worker offline/runtime caching (`apps/web/public/sw.js`).
- PWA behavior is enabled in production builds; run:

```bash
npm run build --workspace @ataraxia/web
npm run start --workspace @ataraxia/web
```

- Then open the app in a browser with PWA support (Chrome/Edge/Safari) to install it and validate offline fallback at `/offline`.
- For releases that modify PWA behavior, use [`docs/PWA_RELEASE_CHECKLIST.md`](docs/PWA_RELEASE_CHECKLIST.md).

## Docker Compose
Run everything with one command:

```bash
docker compose up --build
```

Services:
- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)
- MailHog UI: [http://localhost:8025](http://localhost:8025)

## Key Environment Variables
- `API_PORT` (default: `4000`)
- `CORS_ORIGINS` (default: `http://localhost:3000`)
- `API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` (web -> api)
- `ATARAXIA_DB_PATH` (SQLite file path; env-specific default if unset)
- `PASSKEY_RP_ID` (default: `localhost`)
- `PASSKEY_RP_NAME` (default: `Areti`)
- `PASSKEY_ORIGINS` (comma-separated origins allowed for WebAuthn verification)
- `CHAT_PROVIDER_ORDER` (comma-separated provider priority; default: `deepseek,openai`)
- `DEEPSEEK_API_KEY` (DeepSeek key for chat provider)
- `DEEPSEEK_CHAT_MODEL` (default: `deepseek-chat`)
- `DEEPSEEK_BASE_URL` (default: `https://api.deepseek.com/v1`)
- `OPENAI_API_KEY` (OpenAI key for chat provider fallback)
- `OPENAI_CHAT_MODEL` (default: `gpt-4.1-mini`)
- `OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)
- `CHAT_GLOBAL_SYSTEM_PROMPT` (optional override for Areti global Companion doctrine/system prompt)
- `CHAT_CONTEXT_CAPACITY` (estimated token capacity for Companion thread context; default: `24000`)
- `CHAT_CONTEXT_SUMMARIZE_PERCENT` (auto-summary threshold; default: `70`)
- `CHAT_CONTEXT_WARNING_PERCENT` (high-usage warning threshold; default: `85`)
- `CHAT_CONTEXT_DEGRADED_PERCENT` (near-limit degraded threshold; default: `95`)
- `CHAT_CONTEXT_RECENT_RAW_MESSAGES` (raw unsummarized messages retained after compaction; default: `12`)
- `WEB_APP_URL` (canonical web origin used in verification links)
- `EMAIL_TRANSPORT` (`disabled` | `resend` | `smtp`; non-prod default: `disabled`, prod default: `resend`)
- `RESEND_API_KEY` (Resend API key for verification email delivery)
- `RESEND_FROM_EMAIL` (verified sender identity for Resend email delivery)
- `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM_EMAIL` (SMTP delivery, e.g. MailHog)

Chat provider keys are read by `apps/api` from process environment on startup.

For `docker compose`, put the chat env vars in a repo-root `.env` file.
For local `npm run dev`, the API now auto-loads `.env` from `apps/api/.env` and repo-root `.env`.

Companion prompt behavior:
- A fixed Areti global system prompt is always applied first.
- Onboarding profile context is injected before user custom instructions.
- Users can add account-level custom Companion instructions in `/account/settings` under **Companion preferences**.
- User instructions are appended after the global prompt and cannot override safety/mission constraints.
- Companion thread context uses estimated token telemetry and summary memory compaction (auto at threshold + manual trigger) to preserve long-session continuity.
