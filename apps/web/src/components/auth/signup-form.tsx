"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { signupAction } from "@/actions/auth";
import { initialAuthActionState } from "@/actions/auth-state";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthField } from "@/components/auth/auth-field";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { AuthTrustMicrocopy } from "@/components/auth/auth-trust-microcopy";
import { LegalConsent } from "@/components/auth/legal-consent";
import { PasskeyButton } from "@/components/auth/passkey-button";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrengthChecklist } from "@/components/auth/password-strength-checklist";
import { Input } from "@/components/ui/input";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/constants";
import { isValidEmail, isValidPassword } from "@/lib/auth/client-validation";
import { cn } from "@/lib/cn";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Creating account..." : "Create free account"}
    </button>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(signupAction, initialAuthActionState);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptLegal, setAcceptLegal] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, acceptLegal: false });
  const [passkeyPending, setPasskeyPending] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  function buildLocalErrors(force: boolean): Record<string, string> {
    const errors: Record<string, string> = {};
    const shouldShow = force || submitAttempted;

    if ((shouldShow || touched.email) && !isValidEmail(email)) {
      errors.email = "Use a valid email address.";
    }

    if ((shouldShow || touched.password) && !isValidPassword(password)) {
      errors.password =
        `Use at least ${PASSWORD_MIN_LENGTH} characters, including upper and lower case letters and a number.`;
    }

    if ((shouldShow || touched.acceptLegal) && !acceptLegal) {
      errors.acceptLegal = "Please agree to the Terms and Privacy Policy.";
    }

    return errors;
  }

  const localFieldErrors = buildLocalErrors(false);

  const emailError = localFieldErrors.email ?? state.fieldErrors?.email?.[0];
  const passwordError = localFieldErrors.password ?? state.fieldErrors?.password?.[0];
  const legalError = localFieldErrors.acceptLegal ?? state.fieldErrors?.acceptLegal?.[0];

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        setSubmitAttempted(true);
        setPasskeyError(null);

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
          onChange={(event) => setEmail(event.currentTarget.value)}
          onBlur={() => setTouched((current) => ({ ...current, email: true }))}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "email-error" : undefined}
          placeholder="name@example.com"
          className={cn(
            "h-11 border-night-600/90 bg-night-950/85 px-4 transition-colors duration-150 hover:border-night-500/90 focus:border-sage-300",
            emailError ? "border-amber-400/80 focus:border-amber-300" : undefined,
          )}
        />
      </AuthField>

      <div className="space-y-2">
        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          value={password}
          onChange={setPassword}
          onBlur={() => setTouched((current) => ({ ...current, password: true }))}
          error={passwordError}
          hint={`Use at least ${PASSWORD_MIN_LENGTH} characters, including upper and lower case letters and a number.`}
          placeholder="Create a password"
        />
        <PasswordStrengthChecklist password={password} />
      </div>

      <LegalConsent
        checked={acceptLegal}
        onChange={setAcceptLegal}
        onBlur={() => setTouched((current) => ({ ...current, acceptLegal: true }))}
        error={legalError}
      />

      {state.error ? (
        <p className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />

      <AuthDivider />
      <PasskeyButton
        onClick={() => {
          const normalizedEmail = email.trim().toLowerCase();
          setSubmitAttempted(true);

          if (!isValidEmail(normalizedEmail)) {
            setPasskeyError("Enter your email to continue with passkey sign-in.");
            return;
          }

          setPasskeyError(null);
          setPasskeyPending(true);
          router.push(`/auth/signin?email=${encodeURIComponent(normalizedEmail)}&passkey=1`);
        }}
        pending={passkeyPending}
      />

      {passkeyError ? (
        <p className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200" role="alert">
          {passkeyError}
        </p>
      ) : null}

      <AuthFooterLink text="Already have an account?" href="/auth/signin" cta="Sign in" />
      <AuthTrustMicrocopy text="Free to start. Private by default." />
    </form>
  );
}
