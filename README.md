# Ataraxia Monorepo

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

### User Data
- `GET /api/v1/dashboard/summary`
- `GET /api/v1/journal?limit=...`
- `POST /api/v1/journal`

### Admin CMS
- `GET /api/v1/admin/content`
- `GET /api/v1/admin/audit`
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

## Docker Compose
Run everything with one command:

```bash
docker compose up --build
```

Services:
- Web: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:4000](http://localhost:4000)

## Key Environment Variables
- `API_PORT` (default: `4000`)
- `CORS_ORIGINS` (default: `http://localhost:3000`)
- `API_BASE_URL` / `NEXT_PUBLIC_API_BASE_URL` (web -> api)
- `ATARAXIA_DB_PATH` (SQLite file path; env-specific default if unset)
- `PASSKEY_RP_ID` (default: `localhost`)
- `PASSKEY_RP_NAME` (default: `Ataraxia`)
- `PASSKEY_ORIGINS` (comma-separated origins allowed for WebAuthn verification)
- `CHAT_PROVIDER_ORDER` (comma-separated provider priority; default: `deepseek,openai`)
- `DEEPSEEK_API_KEY` (DeepSeek key for chat provider)
- `DEEPSEEK_CHAT_MODEL` (default: `deepseek-chat`)
- `DEEPSEEK_BASE_URL` (default: `https://api.deepseek.com/v1`)
- `OPENAI_API_KEY` (OpenAI key for chat provider fallback)
- `OPENAI_CHAT_MODEL` (default: `gpt-4.1-mini`)
- `OPENAI_BASE_URL` (default: `https://api.openai.com/v1`)
- `CHAT_GLOBAL_SYSTEM_PROMPT` (optional override for Ataraxia global Companion doctrine/system prompt)

Chat provider keys are read by `apps/api` from process environment on startup.

For `docker compose`, put the chat env vars in a repo-root `.env` file.
For local `npm run dev`, the API now auto-loads `.env` from `apps/api/.env` and repo-root `.env`.

Companion prompt behavior:
- A fixed Ataraxia global system prompt is always applied first.
- Users can add account-level custom Companion instructions in `/account/settings` under **Companion preferences**.
- User instructions are appended after the global prompt and cannot override safety/mission constraints.
