import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

type ForgotPasswordPageProps = {
  searchParams: Promise<{
    email?: string;
  }>;
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  // If user is already logged in, no need to be here
  if (user) {
    if (user.onboardingCompletedAt) {
      redirect("/dashboard");
    }
    redirect("/onboarding");
  }

  const initialEmail = params.email?.trim().toLowerCase() ?? "";

  return (
    <AuthShell
      title="Reset password"
      subtitle="Enter your email to receive a secure reset link."
    >
      <ForgotPasswordForm initialEmail={initialEmail} />
    </AuthShell>
  );
}
