import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SignupPage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.onboardingCompletedAt) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the platform and unlock your dashboard, practices, journal, and AI companion."
    >
      <SignupForm />
    </AuthShell>
  );
}
