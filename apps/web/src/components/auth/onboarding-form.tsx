"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveOnboardingAction, type OnboardingActionState } from "@/actions/auth";
import { OnboardingOptionCard } from "@/components/auth/onboarding-option-card";
import { OnboardingProgress } from "@/components/auth/onboarding-progress";
import { OnboardingStepShell } from "@/components/auth/onboarding-step-shell";
import type { ApiOnboardingProfile } from "@/lib/backend-api";
import {
  onboardingChoices,
  normalizeDailyTimeCommitment,
  normalizePreferredPracticeFormat,
  normalizePrimaryObjective,
  type OnboardingDailyTimeCommitment,
  type OnboardingPreferredPracticeFormat,
  type OnboardingPrimaryObjective,
} from "@/lib/onboarding";

type OnboardingFormProps = {
  profile: ApiOnboardingProfile | null;
  redirectTo: string;
};

type OnboardingSelections = {
  primaryObjective: OnboardingPrimaryObjective | "";
  dailyTimeCommitment: OnboardingDailyTimeCommitment | "";
  preferredPracticeFormat: OnboardingPreferredPracticeFormat | "";
};

type OnboardingStepField = keyof OnboardingSelections;

type OnboardingStep = {
  field: OnboardingStepField;
  question: string;
  helper?: string;
  options: readonly string[];
};

const onboardingSteps: readonly OnboardingStep[] = [
  {
    field: "primaryObjective",
    question: "What brings you here most right now?",
    helper: "Choose the one that feels most true in this moment.",
    options: onboardingChoices.primaryObjective,
  },
  {
    field: "dailyTimeCommitment",
    question: "How much time do you realistically have each day?",
    helper: "We will shape your first experience to match your real schedule.",
    options: onboardingChoices.dailyTimeCommitment,
  },
  {
    field: "preferredPracticeFormat",
    question: "What would help most today?",
    helper: "This decides the first thing we open for you right after this.",
    options: onboardingChoices.preferredPracticeFormat,
  },
];

function isChoice<TChoices extends readonly string[]>(
  choices: TChoices,
  value: string,
): value is TChoices[number] {
  return choices.includes(value);
}

function firstIncompleteStepIndex(selections: OnboardingSelections): number {
  const index = onboardingSteps.findIndex((step) => selections[step.field] === "");
  return index < 0 ? onboardingSteps.length - 1 : index;
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
      {pending
        ? "Creating your path..."
        : editing
          ? "Save profile"
          : "Create my path"}
    </button>
  );
}

export function OnboardingForm({ profile, redirectTo }: OnboardingFormProps) {
  const editing = Boolean(profile);
  const initialSelections = useMemo<OnboardingSelections>(() => {
    return {
      primaryObjective: normalizePrimaryObjective(profile?.primaryObjective) ?? "",
      dailyTimeCommitment: normalizeDailyTimeCommitment(profile?.dailyTimeCommitment) ?? "",
      preferredPracticeFormat: normalizePreferredPracticeFormat(profile?.preferredPracticeFormat) ?? "",
    };
  }, [profile]);

  const [state, formAction] = useActionState<OnboardingActionState, FormData>(saveOnboardingAction, {});
  const [stepIndex, setStepIndex] = useState(() => firstIncompleteStepIndex(initialSelections));
  const [selections, setSelections] = useState<OnboardingSelections>(initialSelections);

  const activeStep = onboardingSteps[stepIndex];
  const totalSteps = onboardingSteps.length;
  const isFinalStep = stepIndex === totalSteps - 1;

  const isComplete =
    selections.primaryObjective.length > 0 &&
    selections.dailyTimeCommitment.length > 0 &&
    selections.preferredPracticeFormat.length > 0;

  const activeStepError = state.fieldErrors?.[activeStep.field]?.[0];

  function updateSelection(field: OnboardingStepField, value: string): void {
    if (field === "primaryObjective" && isChoice(onboardingChoices.primaryObjective, value)) {
      setSelections((prev) => ({ ...prev, primaryObjective: value }));
      return;
    }

    if (field === "dailyTimeCommitment" && isChoice(onboardingChoices.dailyTimeCommitment, value)) {
      setSelections((prev) => ({ ...prev, dailyTimeCommitment: value }));
      return;
    }

    if (
      field === "preferredPracticeFormat" &&
      isChoice(onboardingChoices.preferredPracticeFormat, value)
    ) {
      setSelections((prev) => ({ ...prev, preferredPracticeFormat: value }));
    }
  }

  function goNext(): void {
    setStepIndex((current) => Math.min(current + 1, totalSteps - 1));
  }

  function goBack(): void {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <input type="hidden" name="primaryObjective" value={selections.primaryObjective} />
      <input type="hidden" name="dailyTimeCommitment" value={selections.dailyTimeCommitment} />
      <input type="hidden" name="preferredPracticeFormat" value={selections.preferredPracticeFormat} />

      <OnboardingProgress currentStep={stepIndex + 1} totalSteps={totalSteps} />

      <nav className="flex items-center gap-2" aria-label="Onboarding steps">
        {onboardingSteps.map((step, index) => {
          const available =
            index === 0 ||
            onboardingSteps
              .slice(0, index)
              .every((item) => selections[item.field].length > 0);

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
        <OnboardingStepShell id={`onboarding-step-${stepIndex + 1}`} title={activeStep.question} description={activeStep.helper}>
          <fieldset className="space-y-3" aria-describedby={activeStepError ? `${activeStep.field}-error` : undefined}>
            <legend className="sr-only">{activeStep.question}</legend>
            {activeStep.options.map((option, index) => (
              <OnboardingOptionCard
                key={option}
                id={`${activeStep.field}-${index}`}
                name={`onboarding-${activeStep.field}`}
                value={option}
                checked={selections[activeStep.field] === option}
                onChange={(value) => updateSelection(activeStep.field, value)}
              />
            ))}
          </fieldset>
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
            disabled={selections[activeStep.field].length === 0}
            className="h-11 rounded-xl border border-sand-100 bg-sand-100 px-5 text-sm font-semibold text-night-950 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue
          </button>
        )}
      </div>

      {state.error ? <p className="text-sm text-amber-300">{state.error}</p> : null}
      <p className="text-xs text-night-300">You can refine preferences later in Account settings.</p>
    </form>
  );
}
