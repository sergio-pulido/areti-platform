import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { getCurrentUser } from "@/lib/auth/session";
import {
  apiResendVerification,
  apiVerifyEmail,
  isApiHttpError,
} from "@/lib/backend-api";

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
    resend?: string;
    resendStatus?: string;
    resendError?: string;
  }>;
};

function resolveVerificationErrorMessage(error: unknown): string {
  if (isApiHttpError(error)) {
    if (error.code === "INVALID_VERIFICATION_TOKEN") {
      return "This verification link is invalid or expired. Request a new verification email.";
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to verify this link.";
}

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

  if (token) {
    let verificationResult: Awaited<ReturnType<typeof apiVerifyEmail>> | null = null;
    try {
      verificationResult = await apiVerifyEmail({ token, email: email || undefined });
    } catch (error) {
      const verificationError = resolveVerificationErrorMessage(error);

      return (
        <AuthShell
          title="Verification link issue"
          subtitle="This link could not be confirmed. You can request a fresh one."
          guestAuthSwitch={{
            href: "/auth/signin",
            label: "Sign in",
          }}
        >
          <section className="space-y-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 text-sm text-amber-100">
            <p>{verificationError}</p>
            {email ? (
              <VerifyEmailForm initialEmail={email} initialError={verificationError} />
            ) : (
              <div className="space-y-2">
                <p className="text-night-100">Start again from signup to request a new verification link.</p>
                <Link
                  href="/auth/signup"
                  className="inline-flex rounded-xl border border-sand-100 bg-sand-100 px-4 py-2 text-sm font-semibold text-night-950 hover:bg-sand-50"
                >
                  Back to signup
                </Link>
              </div>
            )}
          </section>
        </AuthShell>
      );
    }

    redirect(`/auth/signup/complete?token=${encodeURIComponent(verificationResult.completionToken)}`);
  }

  let initialInfo = "Check your inbox and open the verification link to continue.";
  if (params.resendStatus === "sent") {
    initialInfo = "Verification email sent. Check your inbox for the latest link.";
  } else if (params.resendStatus === "already-verified") {
    initialInfo = "This account is already verified. You can continue with sign in.";
  }

  const initialError = params.resendError?.trim() ?? "";

  return (
    <AuthShell
      title="Check your email"
      subtitle="We sent a secure verification link. Open it to continue account activation."
      guestAuthSwitch={{
        href: "/auth/signin",
        label: "Sign in",
      }}
    >
      <VerifyEmailForm initialEmail={email} initialInfo={initialInfo} initialError={initialError} />
    </AuthShell>
  );
}
