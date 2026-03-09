# Areti — UX/UI, Product, and Development Guidelines

Version: 1.0  
Context: B2C stoicism + epicureanism app  
Audience: product, design, frontend, backend, content, and AI implementation

---

## 1. Product premise

Areti is not a utility people tolerate. It is a product people keep only if it feels calm, useful, trustworthy, and frictionless.

That means the product must do two things well at the same time:

1. Deliver obvious value quickly through lessons, practices, reflections, companion guidance, and progress-supporting content.
2. Make all management flows feel effortless, invisible, and safe.

If the app feels beautiful but confusing, users leave.
If the app feels functional but cold or heavy, users leave.
If the app asks for too much effort before giving value, users leave.

The standard is simple: every screen should either help the user grow, or get out of the way.

---

## 2. Core product principles

### 2.1 Simplicity beats feature count

Do not add features because they sound mature. Add features only when they clearly improve retention, trust, learning outcomes, or monetization.

A bloated B2C product dies from polite abandonment.

### 2.2 Value must appear early

The user should understand the app’s value in the first session.

That means:
- fast onboarding
- immediate useful content
- quick path to first lesson, exercise, or reflection
- no unnecessary setup before first value

### 2.3 Calm is part of the UX

This is not a crypto dashboard, devtool, or SaaS admin panel.
The interface should feel focused, premium, and emotionally regulated.

Avoid:
- noisy layouts
- too many competing CTAs
- excessive badges
- hyperactive animation
- dense enterprise-style settings pages

### 2.4 Trust is product infrastructure

For account, subscription, privacy, and security areas, users judge product maturity fast.
Broken flows, fake settings, weak feedback, or confusing billing make the whole app feel unsafe. A settings page that does not persist is worse than not having the page at all. fileciteturn2file3

### 2.5 The product should reduce mental load

The app exists to help users think better and live better. It should not add cognitive clutter.

Every decision in navigation, copy, content architecture, and interaction design should reduce friction and ambiguity.

---

## 3. UX/UI north star

The Areti experience should feel like this:
- calm
- premium
- reflective
- clear
- modern
- warm but not childish
- minimal but not empty
- emotionally intelligent but not cheesy

Good references are products that feel intentional and composed, not “fun” in a chaotic way.

### The interface should communicate
- clarity over novelty
- focus over density
- confidence over decoration
- rhythm over clutter
- progression over randomness

### Focus and selection state consistency
- Any focused, selected, or deep-linked container must preserve the same corner radius as the base component.
- Focus styling (ring, border, glow, shadow) should wrap and follow the component shape, never introduce square corners on rounded UI.
- This applies across account, security, settings, and dashboard cards.

---

## 4. Information architecture rules

### 4.1 Primary product areas should be obvious

The user should instantly understand the difference between:
- learning/content
- practices/exercises
- journal/reflection
- companion/chat
- account/preferences
- subscription/billing if paid

Do not mix product consumption with account management.
Do not hide important recurring features behind vague labels.

### 4.2 Navigation must reflect user intent

Organize around what the user wants to do, not around internal implementation.

Bad IA usually happens when routes mirror backend thinking instead of human thinking.

### 4.3 Fewer top-level choices is usually better

Especially in B2C, top-level navigation should be brutally selective.
Users should not have to scan a forest of tabs to do something simple.

### 4.4 Product-specific modules must be clearly differentiated

Universal account infrastructure and product-specific modules should not be mixed carelessly. Optional modules should only exist when they are real features, not because the sidebar looks lonely. fileciteturn2file14

---

## 5. Account section strategy

The account area should answer these questions clearly:
- who am I here?
- how is my account protected?
- what preferences shape my experience?
- how does the app communicate with me?
- what am I paying for?
- what data rights and controls do I have?

That is the standard for a serious account section. fileciteturn2file2turn2file17

### Recommended account IA for Areti

Use this simplified B2C structure:
- Profile
- Preferences
- Notifications
- Security
- Subscription
- Privacy

This is intentionally lighter than the full universal SaaS account architecture, which includes broader layers such as Overview, Commercial, Governance, and Support. For B2C products, simpler profile structure, strong privacy controls, easy notification controls, and subscription management usually matter more than enterprise-style complexity. fileciteturn2file2turn2file10

### Rules for account UX

- No bloated sidenav.
- No separate top-level pages for Password, Sessions, or Danger Zone.
- Show icon + title in nav; move explanatory text into the page header.
- Destructive actions belong inside Privacy, at the bottom.
- Security should include password, 2FA, passkeys, and sessions.
- Subscription should clearly show current plan, renewal, and payment state if paid.
- Empty states must explain why they are empty instead of showing dead space. fileciteturn2file6

### Critical account principles

- Do not mix personal account settings with admin or workspace settings. fileciteturn2file3
- Never ship fake settings that do not persist. fileciteturn2file3
- Sensitive settings must show current status and consequences clearly. fileciteturn2file8
- Save behavior must be consistent across account screens. fileciteturn2file8

---

## 6. Content and feature strategy

### 6.1 The product is content + practice + transformation

The real product is not the interface. The real product is the quality and usefulness of:
- lessons
- quotes
- guided reflections
- exercises
- practices
- journaling flows
- companion responses
- progression loops

If content quality is mediocre, no amount of design polish saves retention.

### 6.2 Prioritize return value, not novelty

Users should repeatedly feel:
- “this helped me today”
- “this made something clearer”
- “this gave me something practical to do”
- “this was worth opening again”

That means features should bias toward repeat value, not one-time wow.

### 6.3 Strong feature buckets for Areti

Prioritize features in these buckets:

#### A. Daily value
- daily lesson or reflection
- short actionable exercise
- personalized recommendation
- quick journaling prompts
- saved/favorite content

#### B. Structured growth
- learning paths
- thematic series
- beginner/intermediate/deeper tracks
- progress markers
- streaks only if they help, not if they create cheap guilt

#### C. Emotional utility
- calm reset flows
- reframing exercises
- coping practices
- sleep / stress / anxiety support modules if aligned with product scope

#### D. Retention infrastructure
- reminders
- notification preferences
- saved items
- continue where you left off
- recent activity
- personalized companion continuity

#### E. Revenue infrastructure
- subscription page
- plan comparison
- premium gating with dignity
- value explanation before paywall pressure

### 6.4 Optional modules worth considering later

Because Areti is a content/learning-style product, optional account modules that can make sense later include saved items, rewards/achievements, personal dashboard modules, and AI assistant preferences. Those are product-specific modules that should remain clearly separate from universal account infrastructure. fileciteturn2file7turn2file14

---

## 7. Onboarding strategy

### 7.1 Onboarding must be short

Do not build a ceremonial tunnel of 14 questions before value.
That is startup self-hypnosis.

Ask only what materially improves:
- personalization
- retention
- companion quality
- recommendations

### 7.2 Good onboarding captures
- main goal
- current emotional/mental focus
- preferred content format
- desired frequency
- optional timezone/language

### 7.3 Good onboarding avoids
- over-collecting profile data
- asking deep questions without trust
- blocking access to core value
- turning setup into admin work

### 7.4 Best pattern

Use progressive profiling.
Get the minimum at the start, then ask for more only when it improves something meaningful.

---

## 8. Chat and companion UX

The companion is one of the highest-leverage features in this app, so it cannot feel like a generic chatbot bolted onto a philosophy product.

### 8.1 The companion should feel
- context-aware
- calm
- practical
- emotionally grounded
- useful in under 30 seconds

### 8.2 The companion should not feel
- preachy
- vague
- overlong
- sterile
- like a support bot
- like a fake guru

### 8.3 UX rules for companion flows

- Make it obvious what the companion can help with.
- Provide useful empty states and starter prompts.
- Keep chat navigation simple.
- Preserve continuity across sessions when helpful.
- Make AI limitations invisible where possible, but never lie.
- Keep controls for custom AI preferences scoped and understandable.

The README confirms the product already supports a global system prompt, onboarding profile context, and user-level custom Companion instructions inside account settings. Those account-level Companion preferences should remain a product-specific preference, not a random orphan feature. fileciteturn1file0

---

## 9. Visual design guidelines

### 9.1 Design system tone

The current product direction should stay premium and dark, but premium is not the same as dim, muddy, or low-contrast.

The visual system should prioritize:
- strong typographic hierarchy
- generous spacing
- disciplined radius and border usage
- restrained accent colors
- meaningful emphasis
- clear states for hover, focus, active, disabled, success, warning, and danger

### 9.2 Typography

Typography should do most of the work.
Use size, weight, spacing, and rhythm to reduce the need for visual clutter.

### 9.3 Cards and surfaces

Do not over-card everything.
Cards should group meaningfully, not because every screen needs boxes.

### 9.4 Icons

Use icons to support recognition, not to compensate for weak IA.

### 9.5 Motion

Motion should be subtle and should reinforce orientation, state change, and polish.
Avoid animation that feels performative.
Reduced-motion support should exist when relevant. Accessibility preferences such as reduced motion are part of mature product preferences. fileciteturn2file15

---

## 10. UX writing guidelines

### 10.1 Write like a calm expert

Use copy that is:
- short
- clear
- human
- precise
- non-theatrical

### 10.2 Avoid
- pseudo-spiritual vagueness
- corporate admin jargon
- patronizing encouragement
- overexplaining obvious actions

### 10.3 Good copy pattern

Instead of:
- “Operational account controls”

Use:
- “Protect your account and review active sessions.”

Instead of:
- “Irreversible account actions” as a main section

Use:
- “Deactivate account” or “Delete account” in the right context

---

## 11. Interaction design rules

### 11.1 Pick one save strategy per context

Do not mix random save patterns.
For account screens, use one of these clearly:
- explicit save button
- auto-save with visible confirmation
- section-level save per block

Mixed save logic destroys trust. This is explicitly called out in the account spec. fileciteturn2file6turn2file8

### 11.2 Always show system feedback

For any important action, show:
- loading
- success
- failure
- validation
- empty states
- destructive confirmation

A mature account or settings UX behaves consistently in all of these areas. fileciteturn2file6

### 11.3 Distinguish clearly

Always distinguish between:
- editable vs read-only
- current vs pending state
- enabled vs available
- destructive vs reversible

### 11.4 Never bury security

Security must be easy to find and easy to understand. Confusing navigation around password, sessions, and 2FA is a classic product mistake. fileciteturn2file8

---

## 12. Mobile and responsive strategy

The app must work cleanly on mobile, but not every desktop layout should be mechanically squeezed into fake mobile parity.
Responsive behavior should respect the real usage context. That principle is called out directly in the account UX standards. fileciteturn2file6

### Mobile priorities
- fast access to content
- one-hand-friendly primary actions
- shallow navigation
- stable sticky controls where helpful
- simple forms
- readable line lengths
- no dense sidebars copied blindly from desktop

---

## 13. Product metrics that actually matter

Track metrics that indicate value, not vanity.

### Key metrics
- activation rate
- time to first value
- % of users who complete first lesson/practice/journal
- 7-day and 30-day retention
- companion reuse rate
- saved/favorited content rate
- notification opt-in and retention impact
- subscription conversion
- churn after first paywall
- session frequency by user segment

### Account-specific trust metrics
- profile completion where relevant
- email verification completion
- security setup adoption
- subscription page visits to conversion
- successful self-serve resolution rate
- support tickets caused by settings confusion

---

## 14. Technical architecture guidelines

The README shows the monorepo currently includes a Next.js web app, an Express REST API, and a shared Drizzle ORM SQLite package, with backend-owned auth/session/journal/content flows exposed through REST APIs. fileciteturn1file0

That stack is fine for now. The risk is not the stack. The risk is sloppy boundaries.

### 14.1 Keep clean domain boundaries

Separate concerns into clear domains such as:
- auth
- profile
- preferences
- notifications
- security
- subscription/billing
- privacy/governance
- chat/companion
- content
- journal

### 14.2 Do not overload the user model

The account spec is correct here: a fat `User` table full of profile, billing, legal, preferences, and product-specific fields becomes painful fast. Model separate entities for preferences, notification settings, sessions, auth methods, subscription, consent, and connected apps when needed. fileciteturn2file10turn2file11

### 14.3 Use account-focused API groupings

As the app matures, align APIs around stable user-facing domains like:
- `/me`
- `/me/profile`
- `/me/preferences`
- `/me/notifications`
- `/me/security`
- `/me/billing`
- `/me/privacy`

That pattern is explicitly recommended by the account spec and leads to cleaner frontend ownership. fileciteturn2file11

### 14.4 Sensitive actions require stronger validation

Operations like password change, email change, enabling/disabling 2FA, revoking sessions, exporting personal data, or deleting an account should require stronger server-side validation and not rely on superficial client checks. fileciteturn2file11

### 14.5 Avoid dead UI

If a page exists, it must be wired.
If a switch exists, it must persist.
If a status exists, it must be accurate.
If data is unavailable, use an honest empty state.

---

## 15. Security, privacy, and compliance baseline

For a mature account area, the baseline should include secure session handling, password reset flow, 2FA support, session revocation, linked login method management, suspicious activity visibility, legal acceptance timestamps, data export, deletion path, consent history, and auditability for sensitive actions. fileciteturn2file11

That does not mean you need every advanced feature now. It means you need a real roadmap.

### Immediate baseline for Areti
- visible email verification state
- password change
- 2FA support if possible
- session/device review and revoke
- legal acceptance visibility
- account deactivation or deletion path
- subscription visibility if paid

These are part of the MVP baseline in the account spec. fileciteturn2file19turn2file16

---

## 16. Recommended feature priority for Areti

### Phase 1 — must-have foundation
- polished auth flows
- onboarding with minimal friction
- clean home/discovery surface
- lessons and practices that deliver immediate value
- companion with useful prompts and continuity
- profile
- preferences basics
- notifications basics
- security basics: password + sessions + 2FA if possible
- privacy basics: legal visibility + deletion/deactivation path
- subscription basics if paid

This sequencing aligns with the account spec’s recommended implementation order for foundation and trust. fileciteturn2file16turn2file17

### Phase 2 — trust and maturity
- email change flow
- data export
- security history
- consent management
- billing history and payment methods
- accessibility preferences
- quiet hours and digest settings
- saved items
- better content personalization

### Phase 3 — product depth and differentiation
- passkeys
- connected apps or external integrations
- advanced companion preferences
- personalized paths and routines
- rewards or achievement systems if they truly improve retention
- advanced reflection analytics if useful and ethical

---

## 17. Common mistakes to avoid

These are the traps most likely to waste time or damage the product:

### Product mistakes
- shipping too many tabs and pages
- treating account like an admin console
- hiding core value behind long onboarding
- adding decorative features instead of daily-use value
- weak subscription clarity
- saving philosophy content but neglecting product utility

### UX mistakes
- inconsistent save behavior
- poor feedback after actions
- no clear distinction between editable and read-only states
- burying security in confusing navigation
- empty pages with no explanation
- making users guess what changed

These failures are explicitly listed as common account UX mistakes in the spec. fileciteturn2file8

### Engineering mistakes
- overloading the user record
- relying on client-only validation for sensitive actions
- no audit trail for important security events
- muddy domain boundaries
- dead pages with no persistence

These also map directly to the engineering mistakes called out in the account spec. fileciteturn2file8turn2file11

---

## 18. Practical development rules for the team

### Build rule 1
Every new feature must answer: what recurring user value does this create?

### Build rule 2
Every setting or preference must persist correctly.

### Build rule 3
Every account/security/privacy flow must be self-serve whenever possible.

### Build rule 4
Every empty state must explain itself.

### Build rule 5
Every important action must provide visible feedback.

### Build rule 6
Every new nav item must earn its place.

### Build rule 7
Do not confuse premium design with unnecessary complexity.

### Build rule 8
Do not create “placeholder sophistication.” Users see through fake maturity immediately.

### Build rule 9
Content quality and return value matter more than ornamental UX trends.

### Build rule 10
If a feature increases cognitive load more than it increases value, cut it.

---

## 19. Final standard

A great Areti product experience should make the user feel:
- oriented
- calmer
- supported
- respected
- in control
- rewarded for coming back

A great account area should make the user feel:
- safe
- clear about their status
- able to manage everything important without support
- never overloaded by unnecessary options

That is the bar.
