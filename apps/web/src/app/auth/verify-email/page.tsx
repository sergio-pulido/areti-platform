import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { getCurrentUser } from "@/lib/auth/session";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    if (user.onboardingCompletedAt) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  const email = params.email?.trim().toLowerCase() ?? "";
  const token = params.token?.trim() ?? "";

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Check your inbox for a verification link and 6-digit code."
    >
      <VerifyEmailForm initialEmail={email} token={token} />
    </AuthShell>
  );
}
