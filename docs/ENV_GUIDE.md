# Environment Guide

This guide explains every environment variable used by Areti, what it does, valid options, and how to obtain third-party credentials.

## Quick Start

1. Copy template:
```bash
cp .env.example .env
```
2. Fill required values for your target environment.
3. Start app:
```bash
npm run dev
```

## Variable Reference

### `NODE_ENV`
- Purpose: toggles environment behavior (`development`, `test`, `production`).
- Used by: API startup checks, DB default paths, secure cookie flags, test behavior.
- Options: `development` | `test` | `production`.

### `API_PORT`
- Purpose: Express API listening port.
- Used by: `apps/api/src/server.ts`.
- Default: `4000`.

### `CORS_ORIGINS`
- Purpose: allowed origins for API browser requests.
- Used by: API CORS middleware.
- Format: comma-separated URLs.
- Example: `http://localhost:3000,https://app.example.com`.

### `WEB_APP_URL`
- Purpose: canonical frontend URL used in email verification links.
- Used by: verification email generation.
- Required: production.
- Example: `https://app.example.com`.

### `SIGNUP_ENABLED`
- Purpose: controls whether public self-serve signup is available.
- Used by: API signup route enforcement and web auth/preview CTA gating.
- Options: `true` | `false`.
- Default when unset:
  - production: `false` (safe invite-only default)
  - non-production: `true` (keeps dev/test signup flows usable)
- Behavior:
  - `false`: `/auth/signup` shows private-beta messaging, signup CTAs are hidden, and `POST /api/v1/auth/signup` returns `403`.
  - `true`: normal signup flow remains available.

### `API_BASE_URL`
- Purpose: server-side web app calls to API.
- Used by: Next.js server actions/loaders.
- Local default: `http://localhost:4000`.

### `NEXT_PUBLIC_API_BASE_URL`
- Purpose: browser-side web app calls to API.
- Used by: frontend fetches in browser context.
- Local default: `http://localhost:4000`.

### `ATARAXIA_DB_PATH`
- Purpose: optional SQLite path override.
- Used by: DB client and Drizzle config.
- If omitted:
  - dev: `data/ataraxia.dev.db`
  - test: `data/ataraxia.test.db`
  - prod: `data/ataraxia.prod.db`

### `PASSKEY_RP_ID`
- Purpose: WebAuthn relying party ID.
- Used by: passkey challenge verification.
- Typical values:
  - local: `localhost`
  - production: root domain (e.g. `example.com`)

### `PASSKEY_RP_NAME`
- Purpose: display name shown by authenticators.
- Used by: passkey registration options.
- Typical value: product name (e.g. `Areti`).

### `PASSKEY_ORIGINS`
- Purpose: allowed origins for passkey ceremonies.
- Used by: WebAuthn verification.
- Format: comma-separated origins.
- Example: `http://localhost:3000,https://app.example.com`.

### `CHAT_PROVIDER_ORDER`
- Purpose: fallback order for chat providers.
- Used by: API chat runtime config.
- Allowed values: `deepseek`, `openai`.
- Example: `deepseek,openai` or `openai`.

### `DEEPSEEK_API_KEY`
- Purpose: enables DeepSeek chat provider.
- Used by: API provider adapter.
- Required if `deepseek` is in `CHAT_PROVIDER_ORDER`.

### `DEEPSEEK_CHAT_MODEL`
- Purpose: DeepSeek model name.
- Default: `deepseek-chat`.

### `DEEPSEEK_BASE_URL`
- Purpose: DeepSeek API base URL.
- Default: `https://api.deepseek.com/v1`.

### `OPENAI_API_KEY`
- Purpose: enables OpenAI chat provider.
- Used by: API provider adapter.
- Required if `openai` is in `CHAT_PROVIDER_ORDER`.

### `OPENAI_CHAT_MODEL`
- Purpose: OpenAI model name.
- Default: `gpt-4.1-mini`.

### `OPENAI_BASE_URL`
- Purpose: OpenAI-compatible API base URL.
- Default: `https://api.openai.com/v1`.

### `CHAT_GLOBAL_SYSTEM_PROMPT`
- Purpose: optional override for Companion global doctrine/system prompt.
- Used by: API prompt composition.
- Recommendation: leave empty unless you intentionally want to replace default behavior.

### `EMAIL_TRANSPORT`
- Purpose: selects verification email delivery backend.
- Used by: API auth verification delivery.
- Options: `disabled` | `resend` | `smtp`.
- Default:
  - production: `resend`
  - non-production: `disabled`

### `RESEND_API_KEY`
- Purpose: sends signup email verification messages.
- Used by: API auth verification delivery.
- Required when `EMAIL_TRANSPORT=resend` in production.

### `RESEND_FROM_EMAIL`
- Purpose: sender identity for Resend email delivery.
- Used by: API auth verification delivery.
- Must be verified in your Resend account.
- Example: `Areti <no-reply@yourdomain.com>`.

### `SMTP_HOST`
- Purpose: SMTP host for verification email delivery.
- Used by: API auth verification delivery.
- Required when `EMAIL_TRANSPORT=smtp`.

### `SMTP_PORT`
- Purpose: SMTP port.
- Used by: API auth verification delivery.
- Default: `1025`.

### `SMTP_SECURE`
- Purpose: toggles TLS for SMTP transport.
- Used by: API auth verification delivery.
- Options: `true` | `false` (default: `false`).

### `SMTP_USER`
- Purpose: SMTP auth username.
- Used by: API auth verification delivery when SMTP auth is enabled.

### `SMTP_PASS`
- Purpose: SMTP auth password.
- Used by: API auth verification delivery when SMTP auth is enabled.
- Required when `SMTP_USER` is set.

### `SMTP_FROM_EMAIL`
- Purpose: sender identity for SMTP delivery.
- Used by: API auth verification delivery.
- Required when `EMAIL_TRANSPORT=smtp` (falls back to `RESEND_FROM_EMAIL` if unset).

## External Provider Setup

### OpenAI
- Console: [platform.openai.com](https://platform.openai.com/)
- Steps:
  1. Create/sign in to an account.
  2. Add billing.
  3. Create an API key from API keys page.
  4. Set `OPENAI_API_KEY` in `.env`.
  5. Optional: set `OPENAI_CHAT_MODEL`.

### DeepSeek
- Console: [platform.deepseek.com](https://platform.deepseek.com/)
- Steps:
  1. Create/sign in to an account.
  2. Generate API key.
  3. Set `DEEPSEEK_API_KEY` in `.env`.
  4. Optional: set model/base URL.

### Resend
- Console: [resend.com](https://resend.com/)
- Docs: [resend.com/docs](https://resend.com/docs)
- Steps:
  1. Create/sign in to account.
  2. Verify a sending domain or single sender.
  3. Create API key.
  4. Set `RESEND_API_KEY`.
  5. Set `RESEND_FROM_EMAIL` to verified sender.
  6. Set `WEB_APP_URL` for link generation.

## Environment Profiles

### Local development
- Minimum typically needed:
  - `API_BASE_URL`, `NEXT_PUBLIC_API_BASE_URL`
  - `SIGNUP_ENABLED=true` (unless you explicitly want invite-only behavior)
  - one chat provider key (`DEEPSEEK_API_KEY` or `OPENAI_API_KEY`)
- Optional for auth email testing:
  - `EMAIL_TRANSPORT=smtp`
  - `SMTP_HOST=localhost`
  - `SMTP_PORT=1025`
  - `SMTP_SECURE=false`
  - `SMTP_FROM_EMAIL=Areti <no-reply@localhost>`
  - Run MailHog (`docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog`) and open `http://localhost:8025`.

### CI / tests
- Integration tests set their own test-specific values in code.
- E2E forces `EMAIL_TRANSPORT=disabled`, so no external verification emails are sent.

### Production
- Must set:
  - `NODE_ENV=production`
  - `WEB_APP_URL`
  - `SIGNUP_ENABLED` (`false` for private beta; `true` only when public signup is intended)
  - `EMAIL_TRANSPORT` (`resend` or `smtp`)
  - `RESEND_API_KEY` + `RESEND_FROM_EMAIL` when using `resend`
  - `SMTP_HOST` + `SMTP_FROM_EMAIL` (and optional auth vars) when using `smtp`
  - `PASSKEY_RP_ID`, `PASSKEY_ORIGINS`
  - at least one chat provider key matching `CHAT_PROVIDER_ORDER`

## Security Notes

- Never commit real `.env` secrets.
- Rotate provider keys if leaked.
- Use separate keys per environment (dev/staging/prod).
- Restrict CORS/passkey origins to trusted domains only.
- Signup protection must be enforced at API level; hiding UI links alone is not a security control.
