import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SigninForm } from "@/components/auth/signin-form";
import { getCurrentUser } from "@/lib/auth/session";

export default async function SigninPage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.onboardingCompletedAt) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your philosophical practice and dashboard workflow."
    >
      <SigninForm />
    </AuthShell>
  );
}
