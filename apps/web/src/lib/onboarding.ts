import { z } from "zod";

export const onboardingChoices = {
  primaryGoal: [
    "reflect_more_clearly",
    "reduce_stress",
    "build_discipline",
    "explore_philosophy",
    "improve_emotional_awareness",
  ] as const,
  preferredTopics: [
    "stoicism",
    "epicureanism",
    "mindfulness",
    "psychology",
    "habits",
    "journaling",
  ] as const,
  experienceLevel: ["new_to_philosophy", "somewhat_familiar", "advanced"] as const,
};

export const onboardingLabels = {
  primaryGoal: {
    reflect_more_clearly: "Reflect more clearly",
    reduce_stress: "Reduce stress",
    build_discipline: "Build discipline",
    explore_philosophy: "Explore philosophy",
    improve_emotional_awareness: "Improve emotional awareness",
  } as const,
  preferredTopics: {
    stoicism: "Stoicism",
    epicureanism: "Epicureanism",
    mindfulness: "Mindfulness",
    psychology: "Psychology",
    habits: "Habits",
    journaling: "Journaling",
  } as const,
  experienceLevel: {
    new_to_philosophy: "New to philosophy",
    somewhat_familiar: "Somewhat familiar",
    advanced: "Advanced",
  } as const,
};

export const onboardingSchema = z.object({
  primaryGoal: z.enum(onboardingChoices.primaryGoal),
  preferredTopics: z
    .array(z.enum(onboardingChoices.preferredTopics))
    .min(1, "Choose at least one topic.")
    .max(3, "Choose up to three topics.")
    .refine((topics) => new Set(topics).size === topics.length, "Preferred topics must be unique."),
  experienceLevel: z.enum(onboardingChoices.experienceLevel),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export type OnboardingPrimaryGoal = (typeof onboardingChoices.primaryGoal)[number];
export type OnboardingPreferredTopic = (typeof onboardingChoices.preferredTopics)[number];
export type OnboardingExperienceLevel = (typeof onboardingChoices.experienceLevel)[number];

function isChoice<TChoices extends readonly string[]>(
  choices: TChoices,
  value: string,
): value is TChoices[number] {
  return choices.includes(value);
}

export function normalizePrimaryGoal(value: string | null | undefined): OnboardingPrimaryGoal | null {
  if (!value) {
    return null;
  }

  return isChoice(onboardingChoices.primaryGoal, value) ? value : null;
}

export function normalizeExperienceLevel(
  value: string | null | undefined,
): OnboardingExperienceLevel | null {
  if (!value) {
    return null;
  }

  return isChoice(onboardingChoices.experienceLevel, value) ? value : null;
}

export function normalizePreferredTopics(
  value: string[] | null | undefined,
): OnboardingPreferredTopic[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = Array.from(new Set(value));
  return unique.filter((item): item is OnboardingPreferredTopic =>
    isChoice(onboardingChoices.preferredTopics, item),
  );
}

function resolvePracticePath(goal: OnboardingPrimaryGoal): "daily" | "focus" | "evening" {
  if (goal === "reduce_stress") {
    return "daily";
  }

  if (goal === "build_discipline") {
    return "focus";
  }

  return "evening";
}

function resolveLibraryPath(level: OnboardingExperienceLevel): "starter" | "applied" | "mastery" {
  if (level === "new_to_philosophy") {
    return "starter";
  }

  if (level === "somewhat_familiar") {
    return "applied";
  }

  return "mastery";
}

function resolveJournalPrompt(goal: OnboardingPrimaryGoal, topics: OnboardingPreferredTopic[]): string {
  const goalPrompt: Record<OnboardingPrimaryGoal, string> = {
    reflect_more_clearly: "I want to think more clearly today.",
    reduce_stress: "I want to reduce stress and feel grounded.",
    build_discipline: "I want to strengthen consistency and follow-through.",
    explore_philosophy: "I want to explore one practical philosophical idea.",
    improve_emotional_awareness: "I want to better understand my emotional patterns.",
  };

  const topicsHint = topics.slice(0, 2).map((topic) => onboardingLabels.preferredTopics[topic]).join(", ");
  if (topicsHint.length === 0) {
    return goalPrompt[goal];
  }

  return `${goalPrompt[goal]} Focus this reflection around ${topicsHint}.`;
}

export function resolvePersonalizedOnboardingDestination(input: {
  primaryGoal: OnboardingPrimaryGoal;
  preferredTopics: OnboardingPreferredTopic[];
  experienceLevel: OnboardingExperienceLevel;
}): string {
  if (input.primaryGoal === "reduce_stress" || input.primaryGoal === "build_discipline") {
    return `/practices?path=${resolvePracticePath(input.primaryGoal)}`;
  }

  if (input.primaryGoal === "explore_philosophy") {
    return `/library?path=${resolveLibraryPath(input.experienceLevel)}`;
  }

  const search = new URLSearchParams({
    title: "Onboarding reflection",
    mood: "Focused",
    body: resolveJournalPrompt(input.primaryGoal, input.preferredTopics),
  });
  return `/journal?${search.toString()}`;
}
