import { z } from "zod";

export const onboardingChoices = {
  primaryObjective: [
    "Calm anxiety",
    "Build discipline",
    "Make better decisions",
    "Improve relationships",
    "Find meaning",
  ] as const,
  dailyTimeCommitment: ["2 min", "5 min", "10 min", "20+ min"] as const,
  preferredPracticeFormat: [
    "A short practice",
    "A reflection prompt",
    "A lesson",
    "A conversation with the Companion",
  ] as const,
};

export const onboardingSchema = z.object({
  primaryObjective: z.enum(onboardingChoices.primaryObjective),
  dailyTimeCommitment: z.enum(onboardingChoices.dailyTimeCommitment),
  preferredPracticeFormat: z.enum(onboardingChoices.preferredPracticeFormat),
  notes: z.string().trim().max(500).optional().default(""),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export type OnboardingPrimaryObjective = (typeof onboardingChoices.primaryObjective)[number];
export type OnboardingDailyTimeCommitment = (typeof onboardingChoices.dailyTimeCommitment)[number];
export type OnboardingPreferredPracticeFormat = (typeof onboardingChoices.preferredPracticeFormat)[number];

function isChoice<TChoices extends readonly string[]>(
  choices: TChoices,
  value: string,
): value is TChoices[number] {
  return choices.includes(value);
}

const legacyPrimaryObjectiveMap: Record<string, OnboardingPrimaryObjective> = {
  "Better decisions": "Make better decisions",
  "Meaning & purpose": "Find meaning",
};

const legacyDailyTimeCommitmentMap: Record<string, OnboardingDailyTimeCommitment> = {
  "20 min": "20+ min",
  "30+ min": "20+ min",
};

const legacyPreferredPracticeFormatMap: Record<string, OnboardingPreferredPracticeFormat> = {
  Journaling: "A reflection prompt",
  "Breath-grounding": "A short practice",
  "Reflection prompts": "A reflection prompt",
  "Action plans": "A lesson",
  Mixed: "A short practice",
};

export function normalizePrimaryObjective(
  value: string | null | undefined,
): OnboardingPrimaryObjective | null {
  if (!value) {
    return null;
  }

  if (isChoice(onboardingChoices.primaryObjective, value)) {
    return value;
  }

  return legacyPrimaryObjectiveMap[value] ?? null;
}

export function normalizeDailyTimeCommitment(
  value: string | null | undefined,
): OnboardingDailyTimeCommitment | null {
  if (!value) {
    return null;
  }

  if (isChoice(onboardingChoices.dailyTimeCommitment, value)) {
    return value;
  }

  return legacyDailyTimeCommitmentMap[value] ?? null;
}

export function normalizePreferredPracticeFormat(
  value: string | null | undefined,
): OnboardingPreferredPracticeFormat | null {
  if (!value) {
    return null;
  }

  if (isChoice(onboardingChoices.preferredPracticeFormat, value)) {
    return value;
  }

  return legacyPreferredPracticeFormatMap[value] ?? null;
}

function resolvePracticePath(input: {
  primaryObjective: OnboardingPrimaryObjective;
  dailyTimeCommitment: OnboardingDailyTimeCommitment;
}): "daily" | "focus" | "evening" {
  const isShortSession = input.dailyTimeCommitment === "2 min" || input.dailyTimeCommitment === "5 min";

  if (input.primaryObjective === "Build discipline") {
    return isShortSession ? "daily" : "focus";
  }

  if (input.primaryObjective === "Make better decisions") {
    return "focus";
  }

  if (input.primaryObjective === "Improve relationships" || input.primaryObjective === "Find meaning") {
    return "evening";
  }

  return isShortSession ? "daily" : "evening";
}

function resolveLibraryPath(
  dailyTimeCommitment: OnboardingDailyTimeCommitment,
): "starter" | "applied" | "mastery" {
  if (dailyTimeCommitment === "2 min" || dailyTimeCommitment === "5 min") {
    return "starter";
  }

  if (dailyTimeCommitment === "10 min") {
    return "applied";
  }

  return "mastery";
}

function resolveJournalDefaults(input: {
  primaryObjective: OnboardingPrimaryObjective;
  dailyTimeCommitment: OnboardingDailyTimeCommitment;
}): { title: string; mood: string; body: string } {
  const promptsByObjective: Record<OnboardingPrimaryObjective, { title: string; mood: string; prompt: string }> = {
    "Calm anxiety": {
      title: "Calm reset",
      mood: "Anxious",
      prompt: "Name one worry you can release and one stabilizing action you can take now.",
    },
    "Build discipline": {
      title: "Discipline checkpoint",
      mood: "Focused",
      prompt: "What is the smallest repeatable action that keeps your streak alive today?",
    },
    "Make better decisions": {
      title: "Decision clarity",
      mood: "Focused",
      prompt: "Write the options, likely tradeoffs, and the next best decision for the next 24 hours.",
    },
    "Improve relationships": {
      title: "Relationship reset",
      mood: "Grounded",
      prompt: "Identify one conversation to improve and one generous action you can take today.",
    },
    "Find meaning": {
      title: "Meaning check-in",
      mood: "Grateful",
      prompt: "What felt truly worthwhile today, and how can you protect more of that tomorrow?",
    },
  };

  const prompt = promptsByObjective[input.primaryObjective];
  const depthCue =
    input.dailyTimeCommitment === "2 min" || input.dailyTimeCommitment === "5 min"
      ? "Keep it brief: 3-4 lines."
      : input.dailyTimeCommitment === "10 min"
        ? "Take 6-8 lines and end with one commitment."
        : "Go deeper: map patterns, assumptions, and one deliberate action.";

  return {
    title: prompt.title,
    mood: prompt.mood,
    body: `${prompt.prompt} ${depthCue}`,
  };
}

function resolveCompanionPrompt(input: {
  primaryObjective: OnboardingPrimaryObjective;
  dailyTimeCommitment: OnboardingDailyTimeCommitment;
}): string {
  return `Help me with ${input.primaryObjective.toLowerCase()} in a ${input.dailyTimeCommitment} session. Give one practical step and one reflection question.`;
}

export function resolvePersonalizedOnboardingDestination(input: {
  primaryObjective: OnboardingPrimaryObjective;
  dailyTimeCommitment: OnboardingDailyTimeCommitment;
  preferredPracticeFormat: OnboardingPreferredPracticeFormat;
}): string {
  if (input.preferredPracticeFormat === "A short practice") {
    return `/practices?path=${resolvePracticePath(input)}`;
  }

  if (input.preferredPracticeFormat === "A lesson") {
    return `/library?path=${resolveLibraryPath(input.dailyTimeCommitment)}`;
  }

  if (input.preferredPracticeFormat === "A conversation with the Companion") {
    const search = new URLSearchParams({
      prompt: resolveCompanionPrompt(input),
    });
    return `/chat?${search.toString()}`;
  }

  const defaults = resolveJournalDefaults(input);
  const search = new URLSearchParams(defaults);
  return `/journal?${search.toString()}`;
}
