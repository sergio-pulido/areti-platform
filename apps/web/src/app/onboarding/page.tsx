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

      <main className="mx-auto flex min-h-[calc(100dvh-3.5rem)] w-full max-w-4xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="relative w-full overflow-hidden rounded-[2rem] border border-night-700/80 bg-night-900/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm sm:p-10">
          <div className="pointer-events-none absolute -right-20 top-[-90px] h-52 w-52 rounded-full bg-sage-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-[-110px] h-56 w-56 rounded-full bg-night-500/10 blur-3xl" />

          <div className="relative mx-auto max-w-2xl space-y-7">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-sage-200/95">Onboarding</p>
              <h1 className="font-title text-4xl leading-tight text-sand-100 sm:text-5xl">
                {editMode ? "Refine your Areti profile" : "Personalize your Areti experience"}
              </h1>
              <p className="max-w-xl text-sm text-night-200 sm:text-base">
                {editMode
                  ? "Update your setup whenever your focus shifts."
                  : "A few quick choices so your first step feels immediately useful."}
              </p>
            </div>

            <OnboardingForm
              profile={onboarding.profile}
              redirectTo={editMode ? "/account/preferences" : "/dashboard"}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
