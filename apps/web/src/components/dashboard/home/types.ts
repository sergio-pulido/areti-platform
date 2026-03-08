export type DashboardActionKind =
  | "practice"
  | "lesson"
  | "reflection"
  | "companion"
  | "reentry";

export type DashboardActionCta = {
  label: string;
  href: string;
};

export type DashboardRecommendedAction = {
  kind: DashboardActionKind;
  heading: string;
  title: string;
  reason: string;
  duration: string;
  primaryCta: DashboardActionCta;
  secondaryCta?: DashboardActionCta;
};

export type DashboardTodayAction = {
  id: string;
  kind: DashboardActionKind;
  title: string;
  description: string;
  meta?: string;
  cta: DashboardActionCta;
};

export type DashboardContinueItem = {
  id: string;
  title: string;
  context: string;
  meta: string;
  href: string;
  ctaLabel: string;
};

export type DashboardReflectionItem = {
  id: string;
  title: string;
  summary: string;
  dateLabel: string;
  theme: string;
  state: string;
  href: string;
  ctaLabel: string;
};

export type DashboardProgressSummary = {
  streakDays: number;
  reflectionsThisWeek: number;
  practicesThisWeek: number;
  lessonProgressPercent: number;
};

export type DashboardCompanionContext = {
  headline: string;
  description: string;
  cta: DashboardActionCta;
  prompts: Array<{
    label: string;
    href: string;
  }>;
};

export type DashboardAccountNudge = {
  id: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};
