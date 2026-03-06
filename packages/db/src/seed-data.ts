export const PILLAR_SEED = [
  {
    slug: "stoic-core",
    title: "Stoic Core",
    description: "Control, virtue, and disciplined action under uncertainty.",
  },
  {
    slug: "epicurean-balance",
    title: "Epicurean Balance",
    description: "Measured pleasure, friendship, and freedom from needless fear.",
  },
  {
    slug: "cross-tradition",
    title: "Other Traditions",
    description: "Buddhist clarity, Taoist flow, and practical modern psychology.",
  },
] as const;

export const HIGHLIGHT_SEED = [
  {
    slug: "secure-auth",
    description: "Secure account system with hashed passwords and hardened server sessions",
  },
  {
    slug: "dashboard-architecture",
    description: "Role-ready dashboard architecture with side navigation and quick actions",
  },
  {
    slug: "ai-coach",
    description: "Integrated AI companion for practical philosophical coaching",
  },
  {
    slug: "structured-workflows",
    description: "Structured practices, journaling, library, community, and account settings",
  },
] as const;

export const LIBRARY_SEED = [
  {
    slug: "dichotomy-control-work",
    title: "Dichotomy of Control in High-Pressure Work",
    tradition: "Stoicism",
    level: "Intermediate",
    minutes: 12,
    summary: "Separate controllables from externals and act with precision under pressure.",
  },
  {
    slug: "epicurean-filter",
    title: "Pleasure Without Excess: The Epicurean Filter",
    tradition: "Epicureanism",
    level: "Beginner",
    minutes: 8,
    summary: "Choose stable pleasures, reduce anxiety, and reject performative desire.",
  },
  {
    slug: "wu-wei-leadership",
    title: "Wu Wei for Product Leaders",
    tradition: "Taoism",
    level: "Advanced",
    minutes: 11,
    summary: "Reduce forced effort and move teams through rhythm, timing, and leverage.",
  },
  {
    slug: "non-attachment-recovery",
    title: "Non-Attachment and Emotional Recovery",
    tradition: "Buddhism",
    level: "Intermediate",
    minutes: 10,
    summary: "Release clinging to outcomes and recover calm after emotional setbacks.",
  },
  {
    slug: "friendship-resilience",
    title: "Meaningful Friendship as Strategic Resilience",
    tradition: "Epicureanism",
    level: "Beginner",
    minutes: 7,
    summary: "Treat friendship as a central good that strengthens courage and stability.",
  },
] as const;

export const PRACTICE_SEED = [
  {
    slug: "morning-premeditatio",
    title: "Morning Premeditatio",
    description:
      "Visualize potential obstacles and choose your virtuous response before the day starts.",
    cadence: "Daily · 6 min",
  },
  {
    slug: "pleasure-audit",
    title: "Pleasure Audit",
    description:
      "Epicurean check: remove one needless desire and reinforce one natural healthy joy.",
    cadence: "Daily · 4 min",
  },
  {
    slug: "evening-examen",
    title: "Evening Examen",
    description:
      "Review actions with compassion and precision. Keep what served virtue, adjust the rest.",
    cadence: "Daily · 8 min",
  },
  {
    slug: "taoist-unforcing",
    title: "Taoist Unforcing Block",
    description:
      "For 20 minutes, work with fluid focus and no over-control. Let rhythm replace force.",
    cadence: "3x week · 20 min",
  },
] as const;

export const COMMUNITY_SEED = [
  {
    slug: "builders-circle",
    name: "Builders Circle",
    focus: "Founders and operators applying philosophy to execution.",
    schedule: "Tuesdays 7:00 PM",
  },
  {
    slug: "calm-mind-collective",
    name: "Calm Mind Collective",
    focus: "Stress, anxiety, and cognitive reframing with real examples.",
    schedule: "Wednesdays 6:30 PM",
  },
  {
    slug: "friendship-meaning",
    name: "Friendship & Meaning Group",
    focus: "Epicurean themes: friendship, pleasure, limits, and gratitude.",
    schedule: "Fridays 5:30 PM",
  },
] as const;

export const COMMUNITY_CHALLENGES_SEED = [
  {
    slug: "morning-clarity",
    title: "Morning Clarity Sprint",
    duration: "7 days",
    summary: "Start each day with one intentional practice and one clear priority.",
  },
  {
    slug: "friction-to-focus",
    title: "Friction to Focus",
    duration: "14 days",
    summary: "Transform recurring distractions into clear routines with accountability.",
  },
  {
    slug: "calm-under-pressure",
    title: "Calm Under Pressure",
    duration: "10 days",
    summary: "Practice emotional steadiness in deadlines, conflict, and uncertainty.",
  },
] as const;

export const COMMUNITY_RESOURCES_SEED = [
  {
    slug: "challenge-starter-kit",
    title: "Challenge Starter Kit",
    description: "Templates and checklists to launch a focused group challenge.",
    href: "/dashboard/library?q=challenge",
    cta: "Open in library",
  },
  {
    slug: "facilitation-playbook",
    title: "Facilitation Playbook",
    description: "Guide for running practical dialogues with clear outcomes.",
    href: "/community",
    cta: "View circles",
  },
  {
    slug: "reflection-prompts-bank",
    title: "Reflection Prompts Bank",
    description: "Prompt collection for retrospectives, reviews, and planning.",
    href: "/dashboard/chat?prompt=Give%20me%2010%20high-quality%20reflection%20prompts%20for%20a%20community%20group.",
    cta: "Generate prompts",
  },
] as const;

export const COMMUNITY_EXPERTS_SEED = [
  {
    slug: "livia-maren",
    name: "Livia Maren",
    focus: "Stoic leadership and decision quality under pressure.",
  },
  {
    slug: "theo-ardan",
    name: "Theo Ardan",
    focus: "Epicurean wellbeing, sustainable pleasure, and life design.",
  },
  {
    slug: "mika-sol",
    name: "Mika Sol",
    focus: "Taoist/Buddhist calm integrated with modern execution habits.",
  },
] as const;

export const COMMUNITY_EVENTS_SEED = [
  {
    slug: "weekly-dialogue",
    title: "Weekly Socratic Dialogue",
    schedule: "Tuesdays · 19:00",
    summary: "Discuss a difficult decision and stress-test reasoning with the group.",
  },
  {
    slug: "focus-lab",
    title: "Focus Lab",
    schedule: "Thursdays · 18:00",
    summary: "Live deep-work block followed by short reflective debrief.",
  },
  {
    slug: "monthly-retrospective",
    title: "Monthly Retrospective Circle",
    schedule: "Last Friday · 20:00",
    summary: "Review commitments, setbacks, and next practical adjustments.",
  },
] as const;

export const CREATOR_VIDEOS_SEED = [
  {
    slug: "3-minute-insight",
    title: "3-Minute Insight",
    format: "Short",
    summary: "Quick tactical concept for immediate application.",
    videoUrl: "https://example.com/videos/3-minute-insight",
  },
  {
    slug: "guided-practice",
    title: "Guided Practice",
    format: "Workshop",
    summary: "Step-by-step routine walkthrough with facilitator prompts.",
    videoUrl: "https://example.com/videos/guided-practice",
  },
  {
    slug: "deep-dive-comparative",
    title: "Comparative Deep Dive",
    format: "Long-form",
    summary: "Cross-tradition deep dive for advanced practitioners.",
    videoUrl: "https://example.com/videos/comparative-deep-dive",
  },
] as const;
