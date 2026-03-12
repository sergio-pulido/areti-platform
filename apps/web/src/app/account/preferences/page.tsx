import Link from "next/link";
import { savePersonalizationAction, saveSettingsAction } from "@/actions/account";
import { PageHeader } from "@/components/dashboard/page-header";
import { SurfaceCard } from "@/components/dashboard/surface-card";
import { apiMe, apiOnboarding } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";
import {
  onboardingChoices,
  onboardingLabels,
  normalizeExperienceLevel,
  normalizePreferredTopics,
  normalizePrimaryGoal,
} from "@/lib/onboarding";

type PreferencesPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

function renderSavedMessage(saved: string): string {
  if (saved === "preferences") {
    return "Preferences saved.";
  }

  if (saved === "personalization") {
    return "Personalization saved.";
  }

  return "Changes saved.";
}

export default async function PreferencesPage({ searchParams }: PreferencesPageProps) {
  const session = await requireSession();
  const [me, onboarding] = await Promise.all([
    apiMe(session.accessToken),
    apiOnboarding(session.accessToken),
  ]);
  const params = ((await searchParams) ?? {}) as Record<string, string | string[] | undefined>;
  const saved = first(params.saved);
  const error = first(params.error);

  const primaryGoal = normalizePrimaryGoal(onboarding.profile?.primaryGoal) ?? "explore_philosophy";
  const preferredTopics = normalizePreferredTopics(onboarding.profile?.preferredTopics);
  const experienceLevel =
    normalizeExperienceLevel(onboarding.profile?.experienceLevel) ?? "new_to_philosophy";

  return (
    <div>
      <PageHeader
        eyebrow="Preferences"
        title="Preferences"
        description="Manage language defaults and product personalization."
      />

      {saved ? (
        <p className="mb-3 rounded-xl border border-sage-300/40 bg-sage-500/10 px-3 py-2 text-sm text-sage-100">
          {renderSavedMessage(saved)}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <SurfaceCard title="Account preferences" subtitle="Language, timezone, and visibility defaults.">
          <form action={saveSettingsAction} className="space-y-3">
            <label className="space-y-1 text-sm text-sand-200">
              <span>Language</span>
              <select
                name="language"
                defaultValue={me.preferences.language}
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
              </select>
            </label>

            <label className="space-y-1 text-sm text-sand-200">
              <span>Timezone</span>
              <input
                name="timezone"
                defaultValue={me.preferences.timezone}
                placeholder="UTC"
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              />
            </label>

            <label className="space-y-1 text-sm text-sand-200">
              <span>Profile visibility</span>
              <select
                name="profileVisibility"
                defaultValue={me.preferences.profileVisibility}
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              >
                <option value="private">Private</option>
                <option value="contacts">Contacts</option>
                <option value="public">Public</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm text-sand-200">
              <input type="checkbox" name="showEmail" defaultChecked={me.preferences.showEmail} />
              Show email on profile
            </label>

            <label className="flex items-center gap-2 text-sm text-sand-200">
              <input type="checkbox" name="showPhone" defaultChecked={me.preferences.showPhone} />
              Show phone on profile
            </label>

            <label className="flex items-center gap-2 text-sm text-sand-200">
              <input type="checkbox" name="allowContact" defaultChecked={me.preferences.allowContact} />
              Allow direct contact requests
            </label>

            <button
              type="submit"
              className="rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
            >
              Save preferences
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard
          title="Personalization"
          subtitle="Adjust your goal, preferred topics, and experience level at any time."
        >
          <form action={savePersonalizationAction} className="space-y-4">
            <label className="space-y-1 text-sm text-sand-200">
              <span>Primary goal</span>
              <select
                name="primaryGoal"
                defaultValue={primaryGoal}
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              >
                {onboardingChoices.primaryGoal.map((goal) => (
                  <option key={goal} value={goal}>
                    {onboardingLabels.primaryGoal[goal]}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm text-sand-200">Preferred topics (choose up to 3)</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {onboardingChoices.preferredTopics.map((topic) => (
                  <label
                    key={topic}
                    className="flex items-center gap-2 rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sm text-sand-200"
                  >
                    <input
                      type="checkbox"
                      name="preferredTopics"
                      value={topic}
                      defaultChecked={preferredTopics.includes(topic)}
                    />
                    {onboardingLabels.preferredTopics[topic]}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="space-y-1 text-sm text-sand-200">
              <span>Experience level</span>
              <select
                name="experienceLevel"
                defaultValue={experienceLevel}
                className="w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2 text-sand-100"
              >
                {onboardingChoices.experienceLevel.map((level) => (
                  <option key={level} value={level}>
                    {onboardingLabels.experienceLevel[level]}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              className="rounded-lg border border-night-600 bg-night-900 px-3 py-1.5 text-xs text-sand-100 hover:border-sage-300"
            >
              Save personalization
            </button>
          </form>
        </SurfaceCard>

        <SurfaceCard title="Related controls" subtitle="Security and communication settings">
          <div className="space-y-2 text-sm">
            <Link
              href="/account/notifications"
              className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600"
            >
              Notification preferences
            </Link>
            <Link
              href="/account/security"
              className="block rounded-xl border border-night-700 px-3 py-2 text-sand-100 hover:border-night-600"
            >
              Security controls
            </Link>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
