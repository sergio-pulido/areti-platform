"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { forgotPasswordAction, type ForgotPasswordActionState } from "@/actions/auth";
import { AuthField } from "@/components/auth/auth-field";
import { AuthTrustMicrocopy } from "@/components/auth/auth-trust-microcopy";
import { Input } from "@/components/ui/input";
import { isValidEmail } from "@/lib/auth/client-validation";
import { cn } from "@/lib/cn";

const initialState: ForgotPasswordActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Sending link..." : "Send reset link"}
    </button>
  );
}

type ForgotPasswordFormProps = {
  initialEmail?: string;
};

export function ForgotPasswordForm({ initialEmail = "" }: ForgotPasswordFormProps) {
  const [state, formAction] = useActionState(forgotPasswordAction, initialState);
  const [email, setEmail] = useState(initialEmail);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState({ email: false });

  function buildLocalErrors(force: boolean): Record<string, string> {
    const errors: Record<string, string> = {};
    const shouldShow = force || submitAttempted;

    if ((shouldShow || touched.email) && !isValidEmail(email)) {
      errors.email = "Use a valid email address.";
    }

    return errors;
  }

  const localFieldErrors = buildLocalErrors(false);
  const emailError = localFieldErrors.email ?? state.fieldErrors?.email?.[0];

  if (state.info) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-sage-400/40 bg-sage-500/10 px-4 py-3 text-sm text-sage-100">
          {state.info}
        </div>
        <Link
          href="/auth/signin"
          className="block w-full text-center rounded-xl border border-night-600/90 bg-night-800/50 px-4 py-3 text-sm font-semibold tracking-wide text-sand-50 transition hover:bg-night-700/50 active:scale-[0.99]"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

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

      {state.error ? (
        <div className="rounded-xl border border-amber-400/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-200" role="alert">
          {state.error}
        </div>
      ) : null}

      <SubmitButton />

      <div className="text-center mt-6">
        <Link href="/auth/signin" className="text-sm font-medium text-sage-200 hover:text-sage-100 transition-colors">
          Back to sign in
        </Link>
      </div>

      <AuthTrustMicrocopy text="We'll send a secure link to reset your password." />
    </form>
  );
}
