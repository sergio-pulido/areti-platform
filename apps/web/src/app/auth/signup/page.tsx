import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupSourceTracker } from "@/components/preview/signup-source-tracker";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/auth/session";
import { getSignupGateCopy, isSignupEnabled } from "@/lib/runtime-config";

type SignupPageProps = {
  searchParams: Promise<{ source?: string; from?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const signupEnabled = isSignupEnabled();

  if (user) {
    if (user.onboardingCompletedAt) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  if (!signupEnabled) {
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
