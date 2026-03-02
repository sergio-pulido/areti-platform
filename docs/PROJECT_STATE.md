# Project State

## Current Status
- A full Next.js web app has been created for a Stoic + Epicurean philosophy platform named **Ataraxia**.
- The app includes secure account creation/sign-in, protected dashboard areas, legal pages, and a working chatbot API route.
- Core user journey is implemented end-to-end and runnable locally.

## Delivered Scope
- Public landing page with product positioning and calls to action.
- Authentication flows:
  - `Sign up`
  - `Sign in`
  - `Logout`
- Security baseline:
  - Argon2id password hashing
  - HTTP-only session cookies
  - Server-side validation with Zod
  - In-memory rate-limiting hooks for auth actions
- Protected dashboard shell:
  - Left sidenav
  - Topnav with search and quick actions
  - User dropdown with account/legal/logout paths
- Dashboard pages:
  - Overview
  - Library
  - Practices
  - Journal (persisted to DB)
  - Community
  - Chatbot
  - Settings
  - Account
- Legal pages:
  - Privacy
  - Terms
  - Cookies

## Tech Stack
- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- Better SQLite3 (embedded local DB)
- Argon2 (password hashing)

## Known Gaps
- Chatbot currently uses deterministic local response logic (no external LLM provider yet).
- Rate limiting is memory-based and not distributed (sufficient for local/prototype use).
- No email verification / password reset flow yet.
- No automated test suite yet.

## Next Milestones
1. Add email verification, password reset, and optional passkey/WebAuthn.
2. Integrate a production-grade LLM provider for the chatbot.
3. Add role-based permissions and admin content tooling.
4. Add automated tests (unit + integration + e2e) and CI checks.
5. Add observability (error monitoring + auth audit logs).
