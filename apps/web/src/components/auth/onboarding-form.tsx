"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveOnboardingAction, type OnboardingActionState } from "@/actions/auth";
import { onboardingChoices } from "@/lib/onboarding";
import type { ApiOnboardingProfile } from "@/lib/backend-api";

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving..." : editing ? "Save onboarding profile" : "Continue to dashboard"}
    </button>
  );
}

type OnboardingFormProps = {
  profile: ApiOnboardingProfile | null;
  redirectTo: string;
};

function renderSelect(
  name: string,
  label: string,
  options: readonly string[],
  defaultValue: string,
  error?: string,
) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm text-sand-200">
        {label}
      </label>
      <select
        id={name}
        name={name}
        required
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-night-700 bg-night-900/80 px-4 py-3 text-sm text-sand-100 outline-none ring-0 focus:border-sage-300"
      >
        <option value="" disabled>
          Select one option
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? <p className="text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}

export function OnboardingForm({ profile, redirectTo }: OnboardingFormProps) {
  const [state, formAction] = useActionState<OnboardingActionState, FormData>(saveOnboardingAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      {renderSelect(
        "primaryObjective",
        "Primary objective",
        onboardingChoices.primaryObjective,
        profile?.primaryObjective ?? "",
        state.fieldErrors?.primaryObjective?.[0],
      )}

      {renderSelect(
        "biggestDifficulty",
        "Current biggest difficulty",
        onboardingChoices.biggestDifficulty,
        profile?.biggestDifficulty ?? "",
        state.fieldErrors?.biggestDifficulty?.[0],
      )}

      {renderSelect(
        "mainNeed",
        "Main need right now",
        onboardingChoices.mainNeed,
        profile?.mainNeed ?? "",
        state.fieldErrors?.mainNeed?.[0],
      )}

      {renderSelect(
        "dailyTimeCommitment",
        "Daily time available",
        onboardingChoices.dailyTimeCommitment,
        profile?.dailyTimeCommitment ?? "",
        state.fieldErrors?.dailyTimeCommitment?.[0],
      )}

      {renderSelect(
        "coachingStyle",
        "Preferred coaching style",
        onboardingChoices.coachingStyle,
        profile?.coachingStyle ?? "",
        state.fieldErrors?.coachingStyle?.[0],
      )}

      {renderSelect(
        "contemplativeExperience",
        "Experience with contemplative practice",
        onboardingChoices.contemplativeExperience,
        profile?.contemplativeExperience ?? "",
        state.fieldErrors?.contemplativeExperience?.[0],
      )}

      {renderSelect(
        "preferredPracticeFormat",
        "Preferred practice format",
        onboardingChoices.preferredPracticeFormat,
        profile?.preferredPracticeFormat ?? "",
        state.fieldErrors?.preferredPracticeFormat?.[0],
      )}

      {renderSelect(
        "successDefinition30d",
        "30-day success definition",
        onboardingChoices.successDefinition30d,
        profile?.successDefinition30d ?? "",
        state.fieldErrors?.successDefinition30d?.[0],
      )}

      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm text-sand-200">
          Additional context (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={profile?.notes ?? ""}
          rows={4}
          maxLength={500}
          className="w-full rounded-xl border border-night-700 bg-night-900/80 px-4 py-3 text-sm text-sand-100 outline-none ring-0 placeholder:text-night-300 focus:border-sage-300"
          placeholder="Any context we should know to personalize your experience?"
        />
        {state.fieldErrors?.notes?.[0] ? (
          <p className="text-xs text-amber-300">{state.fieldErrors.notes[0]}</p>
        ) : null}
      </div>

      {state.error ? <p className="text-sm text-amber-300">{state.error}</p> : null}
      <SubmitButton editing={Boolean(profile)} />
    </form>
  );
}
