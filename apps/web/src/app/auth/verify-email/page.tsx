import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { getCurrentUser } from "@/lib/auth/session";
import { apiResendVerification } from "@/lib/backend-api";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
    resend?: string;
    resendStatus?: string;
    resendError?: string;
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
  const shouldResend = params.resend === "1";

  if (shouldResend && email) {
    const nextParams = new URLSearchParams();
    nextParams.set("email", email);
    if (token) {
      nextParams.set("token", token);
    }

    try {
      const result = await apiResendVerification(email);
      nextParams.set("resendStatus", result.alreadyVerified ? "already-verified" : "sent");
    } catch (error) {
      nextParams.set(
        "resendError",
        error instanceof Error ? error.message : "Unable to resend verification email.",
      );
    }

    redirect(`/auth/verify-email?${nextParams.toString()}`);
  }

  let initialInfo = "";
  if (params.resendStatus === "sent") {
    initialInfo = "Verification email sent. Enter the 6-digit code.";
  } else if (params.resendStatus === "already-verified") {
    initialInfo = "This account is already verified. You can sign in now.";
  }

  const initialError = params.resendError?.trim() ?? "";

  return (
    <AuthShell
      title="Verify your email"
      subtitle="Check your inbox for a verification link and 6-digit code."
      guestAuthSwitch={{
        href: "/auth/signin",
        label: "Sign in",
      }}
    >
      <VerifyEmailForm
        initialEmail={email}
        token={token}
        initialInfo={initialInfo}
        initialError={initialError}
      />
    </AuthShell>
  );
}
