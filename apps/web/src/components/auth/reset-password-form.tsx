"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { resetPasswordAction, type ResetPasswordActionState } from "@/actions/auth";
import { AuthTrustMicrocopy } from "@/components/auth/auth-trust-microcopy";
import { PasswordField } from "@/components/auth/password-field";

const initialState: ResetPasswordActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Resetting password..." : "Reset password"}
    </button>
  );
}

type ResetPasswordFormProps = {
  token: string;
};

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction] = useActionState(resetPasswordAction, initialState);
  const [password, setPassword] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState({ password: false });

  function buildLocalErrors(force: boolean): Record<string, string> {
    const errors: Record<string, string> = {};
    const shouldShow = force || submitAttempted;

    // Minimum check on client side
    if ((shouldShow || touched.password) && password.length < 10) {
      errors.password = "Password must be at least 10 characters long.";
    }

    return errors;
  }

  const localFieldErrors = buildLocalErrors(false);
  const passwordError = localFieldErrors.password ?? state.fieldErrors?.newPassword?.[0];

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
      <input type="hidden" name="token" value={token} readOnly />

      <PasswordField
        id="newPassword"
        name="newPassword"
        label="New Password"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        onBlur={() => setTouched((current) => ({ ...current, password: true }))}
        error={passwordError}
        placeholder="Enter your new password"
      />

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

      <AuthTrustMicrocopy text="We'll securely update your password." />
    </form>
  );
}
