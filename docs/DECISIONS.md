# Decisions

## 2026-03-01 - Build with Next.js App Router + embedded SQLite
- **Context:** Empty repository; requirement was a complete app with auth, dashboard, and legal pages.
- **Decision:** Use Next.js 16 + TypeScript + Better SQLite3 for fast local delivery and maintainable architecture.
- **Why:** Keeps infrastructure minimal while enabling full-stack server components and server actions.
- **Tradeoff:** Embedded SQLite is not horizontally scalable for high-concurrency production.

## 2026-03-01 - Custom server-session auth instead of external auth SaaS
- **Context:** Requirement asked for modern auth/security while keeping app immediately runnable.
- **Decision:** Implement local auth with Argon2id password hashing and DB-backed session tokens stored in HTTP-only cookies.
- **Why:** Works offline/local without external credentials and enforces strong baseline security patterns.
- **Tradeoff:** Advanced features (MFA, magic links, passkeys) are not included yet.

## 2026-03-01 - Philosophy platform IA with dashboard-first UX
- **Context:** Need complete “platform” experience with structured navigation and common account/legal surfaces.
- **Decision:** Use protected dashboard layout with sidenav + topnav and dedicated pages for library, practices, journal, community, chatbot, settings, and account.
- **Why:** Matches product expectations for multi-feature SaaS and gives clear expansion paths.
- **Tradeoff:** Some modules currently ship with seeded/sample content rather than full CMS integration.
