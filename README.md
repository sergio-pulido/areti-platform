# Ataraxia Platform

A modern web app that blends Stoicism, Epicureanism, and complementary philosophies into a practical product experience: secure auth, protected dashboard, journal, knowledge library, community, and AI companion.

## Stack
- Next.js 16 + TypeScript
- Tailwind CSS v4
- Better SQLite3 (local file DB)
- Argon2 password hashing

## Features
- Sign up / Sign in / Logout
- Secure server-side session handling (HTTP-only cookies)
- Password hashing with Argon2id
- Server-side input validation with Zod
- Dashboard shell with sidenav + topnav + user dropdown
- Pages: Overview, Library, Practices, Journal, Community, Chatbot, Settings, Account
- Legal pages: Privacy, Terms, Cookies

## Run Locally
1. Install dependencies:

```bash
npm install
```

2. Start development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Notes
- Chatbot responses are currently local deterministic logic (`/api/chat`) for immediate usability.
- For production, add email verification, password reset, and optional passkey/WebAuthn.
