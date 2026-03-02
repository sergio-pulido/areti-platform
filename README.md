# Ataraxia Monorepo

Monorepo for a Stoic + Epicurean philosophy platform with a separated frontend, backend API, and shared DB/ORM package.

## Workspace Structure
- `apps/web`: Next.js frontend (auth UI, dashboard, chatbot UI, legal pages, admin CMS)
- `apps/api`: Express REST API (auth/session/journal/content/admin)
- `packages/db`: Shared SQLite + Drizzle ORM schema/query/migration package

## Architecture
- Auth/session/journal and content are backend-owned via REST APIs.
- Frontend uses server actions + API clients and keeps HTTP-only access+refresh session tokens.
- Shared DB package runs Drizzle migrations and seeds initial content.

## REST API Surface
### Public
- `GET /health`
- `GET /api/v1/content/landing`
- `GET /api/v1/content/library?q=...`
- `GET /api/v1/content/practices`
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

4. Run API + web together:

```bash
npm run dev
```

5. Open:
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
