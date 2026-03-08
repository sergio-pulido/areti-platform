import { z } from "zod";

export const onboardingChoices = {
  primaryObjective: [
    "Calm anxiety",
    "Build discipline",
    "Better decisions",
    "Improve relationships",
    "Meaning & purpose",
  ] as const,
  biggestDifficulty: [
    "Overthinking",
    "Procrastination",
    "Emotional reactivity",
    "Lack of consistency",
    "Burnout",
  ] as const,
  mainNeed: ["Clarity", "Stability", "Motivation", "Accountability", "Better habits"] as const,
  dailyTimeCommitment: ["5 min", "10 min", "20 min", "30+ min"] as const,
  coachingStyle: ["Direct", "Gentle", "Question-led", "Structured step-by-step"] as const,
  contemplativeExperience: ["New", "Some experience", "Advanced"] as const,
  preferredPracticeFormat: [
    "Journaling",
    "Breath-grounding",
    "Reflection prompts",
    "Action plans",
    "Mixed",
  ] as const,
  successDefinition30d: [
    "Less reactivity",
    "Consistent routine",
    "Better focus",
    "Better relationships",
    "Greater inner calm",
  ] as const,
};

export const onboardingSchema = z.object({
  primaryObjective: z.enum(onboardingChoices.primaryObjective),
  biggestDifficulty: z.enum(onboardingChoices.biggestDifficulty),
  mainNeed: z.enum(onboardingChoices.mainNeed),
  dailyTimeCommitment: z.enum(onboardingChoices.dailyTimeCommitment),
  coachingStyle: z.enum(onboardingChoices.coachingStyle),
  contemplativeExperience: z.enum(onboardingChoices.contemplativeExperience),
  preferredPracticeFormat: z.enum(onboardingChoices.preferredPracticeFormat),
  successDefinition30d: z.enum(onboardingChoices.successDefinition30d),
  notes: z.string().trim().max(500).optional().default(""),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;
