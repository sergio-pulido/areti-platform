import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SigninForm } from "@/components/auth/signin-form";
import { getCurrentUser } from "@/lib/auth/session";

type SigninPageProps = {
  searchParams: Promise<{
    email?: string;
    passkey?: string;
  }>;
};

export default async function SigninPage({ searchParams }: SigninPageProps) {
  const [user, params] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    if (user.onboardingCompletedAt) {
      redirect("/dashboard");
    }

    redirect("/onboarding");
  }

  const initialEmail = params.email?.trim().toLowerCase() ?? "";
  const autoStartPasskey = params.passkey === "1";

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Continue your practice, journal, and conversations."
      guestAuthSwitch={{
        href: "/auth/signup",
        label: "Create account",
      }}
    >
      <SigninForm initialEmail={initialEmail} autoStartPasskey={autoStartPasskey} />
    </AuthShell>
  );
}
