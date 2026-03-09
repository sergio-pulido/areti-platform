import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupSourceTracker } from "@/components/preview/signup-source-tracker";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth/session";

type SignupPageProps = {
  searchParams: Promise<{ source?: string; from?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (user) {
    if (user.onboardingCompletedAt) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start your practice, journal, and AI-guided reflection in under a minute."
      guestAuthSwitch={{
        href: "/auth/signin",
        label: "Sign in",
      }}
    >
      <SignupSourceTracker source={params.source?.trim()} from={params.from?.trim()} />
      <SignupForm />
    </AuthShell>
  );
}
