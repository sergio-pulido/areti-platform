import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupSourceTracker } from "@/components/preview/signup-source-tracker";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth/session";
import { apiGetInviteSignupContext, isApiHttpError } from "@/lib/backend-api";
import { getSignupGateCopy, isSignupEnabled } from "@/lib/runtime-config";

type SignupPageProps = {
  searchParams: Promise<{ source?: string; from?: string; invite?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const signupEnabled = isSignupEnabled();
  const inviteToken = params.invite?.trim();
  let inviteContext: Awaited<ReturnType<typeof apiGetInviteSignupContext>> | null = null;
  let inviteErrorTitle = "Invitation unavailable";
  let inviteErrorBody = "This invitation link is not valid anymore.";

  if (user) {
    if (user.onboardingCompletedAt) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  if (!signupEnabled && !inviteToken) {
    const copy = getSignupGateCopy();

    return (
      <AuthShell
        title={copy.title}
        subtitle={copy.body}
        guestAuthSwitch={{
          href: "/auth/signin",
          label: "Sign in",
        }}
      >
        <section className="rounded-2xl border border-sage-300/30 bg-sage-500/10 p-4 text-sm text-sage-100">
          <p className="text-night-100">{copy.body}</p>
          <p className="mt-2 text-night-200">
            If you already have access, sign in to continue.
          </p>
          <Link
            href="/auth/signin"
            className="mt-4 inline-flex rounded-xl border border-sand-100 bg-sand-100 px-4 py-2 text-sm font-semibold text-night-950 hover:bg-sand-50"
          >
            Sign in
          </Link>
        </section>
      </AuthShell>
    );
  }

  if (inviteToken) {
    try {
      inviteContext = await apiGetInviteSignupContext(inviteToken);
    } catch (error) {
      if (!isApiHttpError(error)) {
        throw error;
      }

      if (error.code === "INVITATION_EXPIRED" || error.code === "INVITATION_REVOKED") {
        inviteErrorTitle = "Invitation expired";
        inviteErrorBody = "This invitation is no longer active. Request a new link from your host.";
      } else if (error.code === "INVITATION_ALREADY_USED") {
        inviteErrorTitle = "Invitation already used";
        inviteErrorBody = "This invitation has already been consumed.";
      } else if (error.code === "INVITATION_INVALID") {
        inviteErrorTitle = "Invalid invitation";
        inviteErrorBody = "We could not validate this invitation link.";
      }
    }
  }

  if (inviteToken && !inviteContext) {
    return (
      <AuthShell
        title={inviteErrorTitle}
        subtitle={inviteErrorBody}
        guestAuthSwitch={{
          href: "/auth/signin",
          label: "Sign in",
        }}
      >
        <section className="rounded-2xl border border-sage-300/30 bg-sage-500/10 p-4 text-sm text-sage-100">
          <p className="text-night-100">{inviteErrorBody}</p>
          <Link
            href="/auth/signin"
            className="mt-4 inline-flex rounded-xl border border-sand-100 bg-sand-100 px-4 py-2 text-sm font-semibold text-night-950 hover:bg-sand-50"
          >
            Sign in
          </Link>
        </section>
      </AuthShell>
    );
  }

  if (inviteToken && inviteContext) {
    return (
      <AuthShell
        title="Invitation access"
        subtitle="Confirm your email and we’ll send a secure verification link."
        guestAuthSwitch={{
          href: "/auth/signin",
          label: "Sign in",
        }}
      >
        <SignupForm
          inviteToken={inviteToken}
          inviteEmail={inviteContext.email}
          inviteEmailLocked={inviteContext.emailLocked}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start with your email. We will verify access before account creation."
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
