import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { CompleteSignupForm } from "@/components/auth/complete-signup-form";
import { getCurrentUser } from "@/lib/auth/session";
import { apiGetSignupCompletionContext, isApiHttpError } from "@/lib/backend-api";

type CompleteSignupPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function CompleteSignupPage({ searchParams }: CompleteSignupPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    if (user.onboardingCompletedAt) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  const token = params.token?.trim() ?? "";
  if (!token) {
    redirect("/auth/signup");
  }

  let context: Awaited<ReturnType<typeof apiGetSignupCompletionContext>> | null = null;
  let errorTitle = "Signup session expired";
  let errorBody = "Your verification session is no longer active. Start signup again.";

  try {
    context = await apiGetSignupCompletionContext(token);
  } catch (error) {
    if (!isApiHttpError(error)) {
      throw error;
    }

    if (error.code === "INVALID_COMPLETION_TOKEN") {
      errorTitle = "Signup session expired";
      errorBody = "This completion link is invalid or expired. Start again from signup.";
    } else if (error.code === "EMAIL_NOT_VERIFIED") {
      errorTitle = "Email not verified";
      errorBody = "Verify your email first, then continue account setup.";
    }
  }

  if (!context) {
    return (
      <AuthShell
        title={errorTitle}
        subtitle={errorBody}
        guestAuthSwitch={{
          href: "/auth/signin",
          label: "Sign in",
        }}
      >
        <section className="rounded-2xl border border-sage-300/30 bg-sage-500/10 p-4 text-sm text-sage-100">
          <p className="text-night-100">{errorBody}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/auth/signup"
              className="inline-flex rounded-xl border border-sand-100 bg-sand-100 px-4 py-2 text-sm font-semibold text-night-950 hover:bg-sand-50"
            >
              Start again
            </Link>
            <Link
              href="/auth/signin"
              className="inline-flex rounded-xl border border-night-600 bg-night-900/80 px-4 py-2 text-sm text-sand-100 hover:border-night-500"
            >
              Sign in
            </Link>
          </div>
        </section>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Complete your account"
      subtitle="Set your profile details and secure password to activate access."
      guestAuthSwitch={{
        href: "/auth/signin",
        label: "Sign in",
      }}
    >
      <CompleteSignupForm
        completionToken={token}
        email={context.email}
        suggestedUsername={context.suggestedUsername}
        requiresLegalAtCompletion={context.requiresLegalAtCompletion}
        locale={context.locale}
      />
    </AuthShell>
  );
}
