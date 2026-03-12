"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveOnboardingAction, type OnboardingActionState } from "@/actions/auth";
import { OnboardingOptionCard } from "@/components/auth/onboarding-option-card";
import { OnboardingProgress } from "@/components/auth/onboarding-progress";
import { OnboardingStepShell } from "@/components/auth/onboarding-step-shell";
import { cn } from "@/lib/cn";
import type { ApiOnboardingProfile } from "@/lib/backend-api";
import {
  onboardingChoices,
  onboardingLabels,
  normalizeExperienceLevel,
  normalizePreferredTopics,
  normalizePrimaryGoal,
  type OnboardingExperienceLevel,
  type OnboardingPreferredTopic,
  type OnboardingPrimaryGoal,
} from "@/lib/onboarding";

type OnboardingFormProps = {
  profile: ApiOnboardingProfile | null;
  redirectTo: string;
};

type OnboardingSelections = {
  primaryGoal: OnboardingPrimaryGoal | "";
  preferredTopics: OnboardingPreferredTopic[];
  experienceLevel: OnboardingExperienceLevel | "";
};

type OnboardingStepField = keyof OnboardingSelections;

type OnboardingStep = {
  field: OnboardingStepField;
  question: string;
  helper?: string;
};

const onboardingSteps: readonly OnboardingStep[] = [
  {
    field: "primaryGoal",
    question: "What would you like Areti to help with first?",
    helper: "Choose the one that best matches your current focus.",
  },
  {
    field: "preferredTopics",
    question: "Which topics should we prioritize?",
    helper: "Pick 1 to 3 topics. You can edit this later in Preferences.",
  },
  {
    field: "experienceLevel",
    question: "How familiar are you with philosophy?",
    helper: "This helps us calibrate depth and pacing.",
  },
];

function firstIncompleteStepIndex(selections: OnboardingSelections): number {
  if (selections.primaryGoal.length === 0) {
    return 0;
  }

  if (selections.preferredTopics.length === 0) {
    return 1;
  }

  if (selections.experienceLevel.length === 0) {
    return 2;
  }

  return 2;
}

function SubmitButton({
  editing,
  disabled,
}: {
  editing: boolean;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="h-11 rounded-xl border border-sand-100 bg-sand-100 px-5 text-sm font-semibold text-night-950 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving..." : editing ? "Save personalization" : "Continue"}
    </button>
  );
}

export function OnboardingForm({ profile, redirectTo }: OnboardingFormProps) {
  const editing = Boolean(profile);
  const initialSelections = useMemo<OnboardingSelections>(() => {
    return {
      primaryGoal: normalizePrimaryGoal(profile?.primaryGoal) ?? "",
      preferredTopics: normalizePreferredTopics(profile?.preferredTopics),
      experienceLevel: normalizeExperienceLevel(profile?.experienceLevel) ?? "",
    };
  }, [profile]);

  const [state, formAction] = useActionState<OnboardingActionState, FormData>(saveOnboardingAction, {});
  const [stepIndex, setStepIndex] = useState(() => firstIncompleteStepIndex(initialSelections));
  const [selections, setSelections] = useState<OnboardingSelections>(initialSelections);

  const activeStep = onboardingSteps[stepIndex];
  const totalSteps = onboardingSteps.length;
  const isFinalStep = stepIndex === totalSteps - 1;

  const isComplete =
    selections.primaryGoal.length > 0 &&
    selections.preferredTopics.length > 0 &&
    selections.preferredTopics.length <= 3 &&
    selections.experienceLevel.length > 0;

  const activeStepError = state.fieldErrors?.[activeStep.field]?.[0];

  function setPrimaryGoal(value: OnboardingPrimaryGoal): void {
    setSelections((prev) => ({ ...prev, primaryGoal: value }));
  }

  function setExperienceLevel(value: OnboardingExperienceLevel): void {
    setSelections((prev) => ({ ...prev, experienceLevel: value }));
  }

  function togglePreferredTopic(value: OnboardingPreferredTopic): void {
    setSelections((prev) => {
      if (prev.preferredTopics.includes(value)) {
        return { ...prev, preferredTopics: prev.preferredTopics.filter((topic) => topic !== value) };
      }

      if (prev.preferredTopics.length >= 3) {
        return prev;
      }

      return { ...prev, preferredTopics: [...prev.preferredTopics, value] };
    });
  }

  function goNext(): void {
    setStepIndex((current) => Math.min(current + 1, totalSteps - 1));
  }

  function goBack(): void {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  const canContinueCurrentStep =
    activeStep.field === "primaryGoal"
      ? selections.primaryGoal.length > 0
      : activeStep.field === "preferredTopics"
        ? selections.preferredTopics.length > 0
        : selections.experienceLevel.length > 0;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="primaryGoal" value={selections.primaryGoal} />
      <input type="hidden" name="experienceLevel" value={selections.experienceLevel} />
      {selections.preferredTopics.map((topic) => (
        <input key={topic} type="hidden" name="preferredTopics" value={topic} />
      ))}

      <OnboardingProgress currentStep={stepIndex + 1} totalSteps={totalSteps} />

      <nav className="flex items-center gap-2" aria-label="Onboarding steps">
        {onboardingSteps.map((step, index) => {
          const available =
            index === 0 ||
            onboardingSteps.slice(0, index).every((item) => {
              if (item.field === "preferredTopics") {
                return selections.preferredTopics.length > 0;
              }

              return selections[item.field].length > 0;
            });

          return (
            <button
              key={step.field}
              type="button"
              onClick={() => setStepIndex(index)}
              disabled={!available}
              aria-current={stepIndex === index ? "step" : undefined}
              className="inline-flex items-center rounded-full border border-night-700/90 px-3 py-1 text-xs text-night-200 transition hover:border-night-500 hover:text-sand-100 aria-[current=step]:border-sage-300 aria-[current=step]:bg-sage-500/12 aria-[current=step]:text-sage-100 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {index + 1}
            </button>
          );
        })}
      </nav>

      <div key={activeStep.field}>
        <OnboardingStepShell
          id={`onboarding-step-${stepIndex + 1}`}
          title={activeStep.question}
          description={activeStep.helper}
        >
          {activeStep.field === "primaryGoal" ? (
            <fieldset className="space-y-3" aria-describedby={activeStepError ? "primaryGoal-error" : undefined}>
              <legend className="sr-only">{activeStep.question}</legend>
              {onboardingChoices.primaryGoal.map((option, index) => (
                <OnboardingOptionCard
                  key={option}
                  id={`primaryGoal-${index}`}
                  name="onboarding-primaryGoal"
                  value={onboardingLabels.primaryGoal[option]}
                  checked={selections.primaryGoal === option}
                  onChange={() => setPrimaryGoal(option)}
                />
              ))}
            </fieldset>
          ) : null}

          {activeStep.field === "preferredTopics" ? (
            <fieldset className="space-y-3" aria-describedby={activeStepError ? "preferredTopics-error" : undefined}>
              <legend className="sr-only">{activeStep.question}</legend>
              <p className="text-xs text-night-300">Selected: {selections.preferredTopics.length}/3</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {onboardingChoices.preferredTopics.map((topic) => {
                  const checked = selections.preferredTopics.includes(topic);
                  const disabled = !checked && selections.preferredTopics.length >= 3;

                  return (
                    <label
                      key={topic}
                      htmlFor={`preferredTopic-${topic}`}
                      className={cn(
                        "group block min-h-14 cursor-pointer rounded-2xl border border-night-700/80 bg-night-950/60 px-4 py-3 text-left transition duration-300",
                        "hover:border-sage-300/65 hover:bg-night-900/90",
                        checked ? "border-sage-300 bg-sage-500/12" : "",
                        disabled ? "cursor-not-allowed opacity-45" : "",
                      )}
                    >
                      <input
                        id={`preferredTopic-${topic}`}
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => togglePreferredTopic(topic)}
                        className="sr-only"
                      />
                      <span className="text-[0.97rem] font-medium text-sand-100">
                        {onboardingLabels.preferredTopics[topic]}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          {activeStep.field === "experienceLevel" ? (
            <fieldset className="space-y-3" aria-describedby={activeStepError ? "experienceLevel-error" : undefined}>
              <legend className="sr-only">{activeStep.question}</legend>
              {onboardingChoices.experienceLevel.map((option, index) => (
                <OnboardingOptionCard
                  key={option}
                  id={`experienceLevel-${index}`}
                  name="onboarding-experienceLevel"
                  value={onboardingLabels.experienceLevel[option]}
                  checked={selections.experienceLevel === option}
                  onChange={() => setExperienceLevel(option)}
                />
              ))}
            </fieldset>
          ) : null}

          {activeStepError ? (
            <p id={`${activeStep.field}-error`} className="text-sm text-amber-300">
              {activeStepError}
            </p>
          ) : null}
        </OnboardingStepShell>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-night-800/80 pt-4">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="h-11 rounded-xl border border-night-700 bg-night-900/80 px-4 text-sm text-sand-100 transition hover:border-night-500 hover:bg-night-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Back
        </button>

        {isFinalStep ? (
          <SubmitButton editing={editing} disabled={!isComplete} />
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!canContinueCurrentStep}
            className="h-11 rounded-xl border border-sand-100 bg-sand-100 px-5 text-sm font-semibold text-night-950 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        )}
      </div>

      {state.error ? <p className="text-sm text-amber-300">{state.error}</p> : null}
      <p className="text-xs text-night-300">You can revisit these choices in Account preferences.</p>
    </form>
  );
}
