import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { AppTopbar } from "@/components/layout/app-topbar";
import { apiOnboarding } from "@/lib/backend-api";
import { requireSession } from "@/lib/auth/session";

type OnboardingPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const session = await requireSession();
  const params = await searchParams;
  const editMode = params.edit === "1";
  const showVerifiedTopbar = Boolean(session.user.onboardingCompletedAt);

  if (session.user.onboardingCompletedAt && !editMode) {
    redirect("/dashboard");
  }

  const onboarding = await apiOnboarding(session.accessToken);

  return (
    <div className="min-h-screen bg-night-950 text-sand-100">
      <AppTopbar
        user={showVerifiedTopbar ? session.user : undefined}
        accessToken={showVerifiedTopbar ? session.accessToken : undefined}
      />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-night-800 bg-night-900/70 p-6 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-sage-200/90">Onboarding</p>
          <h1 className="mt-2 font-title text-4xl text-sand-100">
            {editMode ? "Update your profile" : "Personalize your Areti experience"}
          </h1>
          <p className="mt-2 text-sm text-night-200">
            {editMode
              ? "Adjust your preferences to refine guidance and Companion behavior."
              : "Answer a few questions so we can tailor your practices, prompts, and Companion guidance."}
          </p>
          <div className="mt-6">
            <OnboardingForm
              profile={onboarding.profile}
              redirectTo={editMode ? "/account/preferences" : "/dashboard"}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
