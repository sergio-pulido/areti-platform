"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { signupAction } from "@/actions/auth";
import { initialAuthActionState } from "@/actions/auth-state";
import { AuthField } from "@/components/auth/auth-field";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { AuthTrustMicrocopy } from "@/components/auth/auth-trust-microcopy";
import { LegalConsent } from "@/components/auth/legal-consent";
import { Input } from "@/components/ui/input";
import { isValidEmail } from "@/lib/auth/client-validation";
import { cn } from "@/lib/cn";

function SubmitButton({ inviteMode }: { inviteMode: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Sending verification..." : inviteMode ? "Accept invite" : "Continue"}
    </button>
  );
}

type SignupFormProps = {
  inviteToken?: string;
  inviteEmail?: string | null;
  inviteEmailLocked?: boolean;
};

export function SignupForm({ inviteToken, inviteEmail, inviteEmailLocked = false }: SignupFormProps) {
  const [state, formAction] = useActionState(signupAction, initialAuthActionState);
  const inviteMode = Boolean(inviteToken);
  const [email, setEmail] = useState(inviteEmail ?? "");
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState({ email: false, acceptLegal: false });

  function buildLocalErrors(force: boolean): Record<string, string> {
    const errors: Record<string, string> = {};
    const shouldShow = force || submitAttempted;

    if ((shouldShow || touched.email) && !isValidEmail(email)) {
      errors.email = "Use a valid email address.";
    }

    if (!inviteMode && (shouldShow || touched.acceptLegal) && !acceptLegal) {
      errors.acceptLegal = "Please agree to the Terms and Privacy Policy.";
    }

    return errors;
  }

  const localFieldErrors = buildLocalErrors(false);
  const emailError = localFieldErrors.email ?? state.fieldErrors?.email?.[0];
  const legalError = localFieldErrors.acceptLegal ?? state.fieldErrors?.acceptLegal?.[0];

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        setSubmitAttempted(true);
        if (Object.keys(buildLocalErrors(true)).length > 0) {
          event.preventDefault();
        }
      }}
    >
      <AuthField id="email" label="Email" error={emailError}>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          readOnly={inviteEmailLocked}
          onChange={(event) => setEmail(event.currentTarget.value)}
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          placeholder="name@example.com"
          className={cn(
            "h-11 border-night-600/90 bg-night-950/85 px-4 transition-colors duration-150 hover:border-night-500/90 focus:border-sage-300",
            inviteEmailLocked ? "cursor-not-allowed opacity-80" : undefined,
            emailError ? "border-amber-400/80 focus:border-amber-300" : undefined,
          )}
        />
      </AuthField>

      {!inviteMode ? (
        <LegalConsent
          checked={acceptLegal}
          onChange={setAcceptLegal}
          onBlur={() => setTouched((current) => ({ ...current, acceptLegal: true }))}
          error={legalError}
        />
      ) : (
        <p className="rounded-xl border border-sage-300/30 bg-sage-500/10 px-3 py-2 text-sm text-sage-100">
          We will send a verification link to this email before you complete your account.
        </p>
      )}

      {inviteToken ? <input type="hidden" name="inviteToken" value={inviteToken} /> : null}

      {state.error ? (
        <p className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton inviteMode={inviteMode} />

      <AuthFooterLink text="Already have an account?" href="/auth/signin" cta="Sign in" />
      <AuthTrustMicrocopy text="We verify every account before activation." />
    </form>
  );
}
