import { PageHeader } from "@/components/dashboard/page-header";
import { DashboardAccountNudges } from "@/components/dashboard/dashboard-account-nudges";
import { DashboardCompanionPanel } from "@/components/dashboard/dashboard-companion-panel";
import { DashboardContinueSection } from "@/components/dashboard/dashboard-continue-section";
import { DashboardHeroNextStep } from "@/components/dashboard/dashboard-hero-next-step";
import { DashboardProgressSummary } from "@/components/dashboard/dashboard-progress-summary";
import { DashboardRecentReflections } from "@/components/dashboard/dashboard-recent-reflections";
import { DashboardTodayActions } from "@/components/dashboard/dashboard-today-actions";
import type {
  DashboardAccountNudge,
  DashboardCompanionContext,
  DashboardContinueItem,
  DashboardProgressSummary as DashboardProgressSummaryType,
  DashboardRecommendedAction,
  DashboardReflectionItem,
  DashboardTodayAction,
} from "@/components/dashboard/home/types";
import { requireSession } from "@/lib/auth/session";
import type { ApiJournalEntry } from "@/lib/backend-api";
import { apiDashboardSummary, apiJournalList, apiSecuritySettings } from "@/lib/backend-api";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

function getFirstName(fullName: string): string {
  return fullName.split(" ")[0] ?? "there";
}

function getDaysSince(dateValue: string | null): number {
  if (!dateValue) {
    return 30;
  }

  const diffMs = Date.now() - new Date(dateValue).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function getGreetingHour(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function summarizeReflection(body: string): string {
  const trimmed = body.trim();

  if (!trimmed) {
    return "Reflect again to turn this into your next useful step.";
  }

  const sentence = trimmed.split(/[.!?]/)[0]?.trim() ?? trimmed;
  return sentence.length > 120 ? `${sentence.slice(0, 117)}...` : sentence;
}

function deriveTheme(entry: ApiJournalEntry): string {
  const haystack = `${entry.title} ${entry.body}`.toLowerCase();

  if (haystack.includes("control") || haystack.includes("attention")) {
    return "Control";
  }

  if (haystack.includes("discipline") || haystack.includes("habit")) {
    return "Discipline";
  }

  if (haystack.includes("relationship") || haystack.includes("family")) {
    return "Relationships";
  }

  if (haystack.includes("anx") || haystack.includes("restless")) {
    return "Anxiety";
  }

  if (haystack.includes("rest") || haystack.includes("sleep")) {
    return "Recovery";
  }

  return "Clarity";
}

function deriveState(mood: string): string {
  const normalized = mood.toLowerCase();

  if (normalized.includes("focus") || normalized.includes("clear")) {
    return "Clear";
  }

  if (normalized.includes("calm") || normalized.includes("ground")) {
    return "Grounded";
  }

  if (normalized.includes("stress") || normalized.includes("overwhelm")) {
    return "Overwhelmed";
  }

  if (normalized.includes("restless") || normalized.includes("anx")) {
    return "Restless";
  }

  return mood.charAt(0).toUpperCase() + mood.slice(1);
}

function buildRecommendedAction(input: {
  entriesCount: number;
  daysSinceLatestEntry: number;
  latestEntry: ApiJournalEntry | null;
}): DashboardRecommendedAction {
  const { entriesCount, daysSinceLatestEntry, latestEntry } = input;

  if (entriesCount === 0) {
    return {
      kind: "reflection",
      heading: "Start your first reflection",
      title: "Begin with one short check-in.",
      reason: "A 2-minute reflection is the fastest way to personalize your next steps.",
      duration: "2 min",
      primaryCta: {
        label: "Start reflection",
        href: "/journal?title=First%20check-in&mood=Grounded",
      },
      secondaryCta: {
        label: "Try a 3-minute reset",
        href: "/practices",
      },
    };
  }

  if (daysSinceLatestEntry >= 3) {
    return {
      kind: "reentry",
      heading: "Restart gently",
      title: "You have been away for a few days. Start with a quick reset.",
      reason: "Re-entry works best with one small action before you return to longer sessions.",
      duration: "3 min",
      primaryCta: {
        label: "Start guided check-in",
        href: "/chat?prompt=Guide%20a%203-minute%20reset%20and%20help%20me%20restart%20today.",
      },
      secondaryCta: {
        label: "Open reflection prompt",
        href: "/journal?title=What%20is%20pulling%20my%20attention%20today%3F&mood=Restless",
      },
    };
  }

  if (daysSinceLatestEntry >= 1) {
    return {
      kind: "practice",
      heading: "Build momentum",
      title: "Take a 4-minute grounding practice.",
      reason: "You reflected recently. A short practice now turns that insight into steadier action.",
      duration: "4 min",
      primaryCta: {
        label: "Start today’s practice",
        href: "/practices",
      },
      secondaryCta: {
        label: "Ask for perspective",
        href: "/chat?prompt=Help%20me%20think%20clearly%20about%20today%20in%20under%205%20minutes.",
      },
    };
  }

  return {
    kind: "lesson",
    heading: "Deepen today's session",
    title: "Continue Lesson 2: Control and attention.",
    reason: latestEntry
      ? `You last reflected on "${deriveTheme(latestEntry)}". This lesson helps translate that into clearer choices.`
      : "Continue your current lesson to keep continuity across practice and reflection.",
    duration: "8 min",
    primaryCta: {
      label: "Continue lesson",
      href: "/library",
    },
    secondaryCta: {
      label: "Open Companion",
      href: "/chat",
    },
  };
}

function buildTodayActions(input: {
  daysSinceLatestEntry: number;
  latestEntry: ApiJournalEntry | null;
}): DashboardTodayAction[] {
  const { daysSinceLatestEntry, latestEntry } = input;
  const reflectionMood = latestEntry ? deriveState(latestEntry.mood) : "Grounded";

  return [
    {
      id: "today-practice",
      kind: "practice",
      title: "Today’s practice",
      description: "Reset attention before the day accelerates.",
      meta: "4 min",
      cta: {
        label: "Start practice",
        href: "/practices",
      },
    },
    {
      id: "reflection-prompt",
      kind: "reflection",
      title: "Reflection prompt",
      description:
        daysSinceLatestEntry >= 2
          ? "Name what has been draining your attention lately."
          : "Clarify what deserves your energy next.",
      meta: "2 min",
      cta: {
        label: "Write reflection",
        href: `/journal?title=What%20deserves%20my%20attention%20next%3F&mood=${encodeURIComponent(reflectionMood)}`,
      },
    },
    {
      id: "continue-lesson",
      kind: "lesson",
      title: "Continue lesson",
      description: "Resume where you stopped without re-reading everything.",
      meta: "8 min",
      cta: {
        label: "Resume lesson",
        href: "/library",
      },
    },
    {
      id: "ask-companion",
      kind: "companion",
      title: "Ask Companion",
      description: "Get practical perspective in under 30 seconds.",
      meta: "Chat",
      cta: {
        label: "Open Companion",
        href: "/chat?prompt=What%20should%20I%20focus%20on%20today%3F",
      },
    },
  ];
}

function buildContinueItems(latestEntries: ApiJournalEntry[]): DashboardContinueItem[] {
  if (latestEntries.length === 0) {
    return [
      {
        id: "continue-lesson-intro",
        title: "Start Lesson 1: What is in your control",
        context: "A foundational lesson to orient your first week.",
        meta: "Lesson starter",
        href: "/library",
        ctaLabel: "Begin",
      },
      {
        id: "continue-practice-starter",
        title: "Try the morning reset protocol",
        context: "Short breathing + attention protocol for calm focus.",
        meta: "Practice",
        href: "/practices",
        ctaLabel: "Start",
      },
    ];
  }

  const [latest] = latestEntries;
  const items: DashboardContinueItem[] = [
    {
      id: "continue-lesson",
      title: "Lesson 2: Control and attention",
      context: "Continue from your last checkpoint and apply one principle today.",
      meta: "In progress",
      href: "/library",
      ctaLabel: "Resume",
    },
    {
      id: "continue-practice",
      title: "Evening unwinding protocol",
      context: "You started this recently. Finish it to close the day with clarity.",
      meta: "Started",
      href: "/practices",
      ctaLabel: "Continue",
    },
    {
      id: `continue-reflection-${latest.id}`,
      title: latest.title,
      context: summarizeReflection(latest.body),
      meta: `Reflected ${dateFormatter.format(new Date(latest.createdAt))}`,
      href: "/journal",
      ctaLabel: "Revisit",
    },
  ];

  return items;
}

function buildRecentReflections(entries: ApiJournalEntry[]): DashboardReflectionItem[] {
  return entries.slice(0, 4).map((entry) => ({
    id: entry.id,
    title: entry.title,
    summary: summarizeReflection(entry.body),
    dateLabel: dateFormatter.format(new Date(entry.createdAt)),
    theme: deriveTheme(entry),
    state: deriveState(entry.mood),
    href: "/journal",
    ctaLabel: "Revisit",
  }));
}

function buildProgressSummary(input: {
  entriesCount: number;
  daysSinceLatestEntry: number;
  recentEntries: ApiJournalEntry[];
}): DashboardProgressSummaryType {
  const reflectionsThisWeek = input.recentEntries.filter((entry) => {
    const ageInDays = getDaysSince(entry.createdAt);
    return ageInDays <= 7;
  }).length;

  const streakDays =
    input.entriesCount === 0
      ? 0
      : Math.max(1, Math.min(30, input.entriesCount + (input.daysSinceLatestEntry <= 1 ? 2 : 0)));
  const practicesThisWeek = Math.max(
    0,
    Math.min(7, reflectionsThisWeek + (input.daysSinceLatestEntry <= 1 ? 1 : 0)),
  );
  const lessonProgressPercent = Math.max(12, Math.min(96, 24 + input.entriesCount * 6));

  return {
    streakDays,
    reflectionsThisWeek,
    practicesThisWeek,
    lessonProgressPercent,
  };
}

function buildCompanionContext(daysSinceLatestEntry: number): DashboardCompanionContext {
  return {
    headline:
      daysSinceLatestEntry >= 3
        ? "Restart with a guided check-in."
        : "Use Companion to sharpen your next decision.",
    description:
      daysSinceLatestEntry >= 3
        ? "In under 3 minutes, get a calm reset and one practical next step."
        : "Bring one concrete situation and get perspective grounded in Stoic-Epicurean practice.",
    cta: {
      label: "Start guided check-in",
      href: "/chat",
    },
    prompts: [
      {
        label: "Help me think clearly",
        href: "/chat?prompt=Help%20me%20think%20clearly%20about%20this%20situation.",
      },
      {
        label: "Guide a 3-minute reset",
        href: "/chat?prompt=Guide%20a%203-minute%20reset%20for%20me%20right%20now.",
      },
      {
        label: "Help me reframe this",
        href: "/chat?prompt=Help%20me%20reframe%20this%20without%20avoiding%20reality.",
      },
      {
        label: "What should I focus on today?",
        href: "/chat?prompt=What%20should%20I%20focus%20on%20today%20and%20why%3F",
      },
    ],
  };
}

function buildAccountNudges(input: {
  mfaEnabled: boolean;
  passkeyEnabled: boolean;
  emailVerifiedAt: string | null;
}): DashboardAccountNudge[] {
  const nudges: DashboardAccountNudge[] = [];

  if (!input.passkeyEnabled) {
    nudges.push({
      id: "nudge-passkey",
      title: "Add a passkey",
      description: "Sign in faster and reduce account-recovery friction.",
      href: "/account/security?focus=passkeys",
      ctaLabel: "Set up passkey",
    });
  }

  if (!input.mfaEnabled) {
    nudges.push({
      id: "nudge-mfa",
      title: "Enable two-factor authentication",
      description: "Add an extra layer of protection for your account.",
      href: "/account/security?focus=totp",
      ctaLabel: "Enable 2FA",
    });
  }

  if (!input.emailVerifiedAt) {
    nudges.push({
      id: "nudge-email-verification",
      title: "Verify your email",
      description: "Keep recovery options available if you lose access.",
      href: "/account/profile",
      ctaLabel: "Review account email",
    });
  }

  return nudges;
}

export default async function DashboardPage() {
  const session = await requireSession();
  const user = session.user;
  const [summary, security, journalEntries] = await Promise.all([
    apiDashboardSummary(session.accessToken),
    apiSecuritySettings(session.accessToken),
    apiJournalList(session.accessToken, 8),
  ]);

  const firstName = getFirstName(user.name);
  const latestEntry = journalEntries[0] ?? null;
  const daysSinceLatestEntry = getDaysSince(latestEntry?.createdAt ?? null);

  const nextRecommendedAction = buildRecommendedAction({
    entriesCount: summary.entriesCount,
    daysSinceLatestEntry,
    latestEntry,
  });
  const todayActions = buildTodayActions({
    daysSinceLatestEntry,
    latestEntry,
  });
  const continueItems = buildContinueItems(journalEntries);
  const recentReflections = buildRecentReflections(journalEntries);
  const progressSummary = buildProgressSummary({
    entriesCount: summary.entriesCount,
    daysSinceLatestEntry,
    recentEntries: journalEntries,
  });
  const companionContext = buildCompanionContext(daysSinceLatestEntry);
  const accountNudges = buildAccountNudges({
    mfaEnabled: security.mfaEnabled,
    passkeyEnabled: security.passkeyEnabled,
    emailVerifiedAt: user.emailVerifiedAt,
  });

  return (
    <div className="space-y-6 md:space-y-7">
      <PageHeader
        eyebrow="Dashboard"
        title={`${getGreetingHour()}, ${firstName}`}
        description="Start with the most useful next step, then keep momentum with focused actions."
      />

      <DashboardHeroNextStep userFirstName={firstName} action={nextRecommendedAction} />

      <DashboardTodayActions actions={todayActions} />

      <DashboardContinueSection items={continueItems} />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <DashboardRecentReflections items={recentReflections} />
        <DashboardCompanionPanel companion={companionContext} />
      </section>

      <DashboardProgressSummary summary={progressSummary} />

      <DashboardAccountNudges nudges={accountNudges} />
    </div>
  );
}
