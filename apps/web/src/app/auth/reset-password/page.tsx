import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getCurrentUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    if (user.onboardingCompletedAt) {
      redirect("/dashboard");
    }
    redirect("/onboarding");
  }

  const token = params.token?.trim();

  if (!token) {
    return (
      <AuthShell
        title="Invalid Link"
        subtitle="This password reset link is invalid or has expired."
      >
        <div className="space-y-6">
          <Link
            href="/auth/forgot-password"
            className="block w-full text-center rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 active:scale-[0.99]"
          >
            Request a new link
          </Link>
          <div className="text-center">
            <Link href="/auth/signin" className="text-sm font-medium text-sage-200 hover:text-sage-100 transition-colors">
              Return to sign in
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create new password"
      subtitle="Please enter your new password below."
    >
      <ResetPasswordForm token={token} />
    </AuthShell>
  );
}
