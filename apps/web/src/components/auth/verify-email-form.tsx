"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  resendVerificationAction,
  type EmailVerificationActionState,
  verifyEmailAction,
} from "@/actions/auth";

function VerifyButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Verifying..." : "Verify Email"}
    </button>
  );
}

function ResendButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-night-600 bg-night-900/80 px-4 py-3 text-sm font-medium text-sand-100 transition hover:border-sage-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Sending..." : "Resend verification email"}
    </button>
  );
}

type VerifyEmailFormProps = {
  initialEmail: string;
  token: string;
};

export function VerifyEmailForm({ initialEmail, token }: VerifyEmailFormProps) {
  const [verifyState, verifyAction] = useActionState<EmailVerificationActionState, FormData>(
    verifyEmailAction,
    {
      email: initialEmail,
      code: "",
    },
  );

  const [resendState, resendAction] = useActionState<EmailVerificationActionState, FormData>(
    resendVerificationAction,
    {
      email: initialEmail,
    },
  );

  const resolvedEmail = verifyState.email ?? resendState.email ?? initialEmail;

  return (
    <div className="space-y-6">
      <form action={verifyAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm text-sand-200">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            readOnly={Boolean(token)}
            defaultValue={resolvedEmail}
            className="w-full rounded-xl border border-night-700 bg-night-900/80 px-4 py-3 text-sm text-sand-100 outline-none ring-0 placeholder:text-night-300 focus:border-sage-300"
            placeholder="you@philosophy.app"
          />
          {verifyState.fieldErrors?.email?.[0] ? (
            <p className="text-xs text-amber-300">{verifyState.fieldErrors.email[0]}</p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="code" className="text-sm text-sand-200">
            Verification code
          </label>
          <input
            id="code"
            name="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            defaultValue={verifyState.code ?? ""}
            className="w-full rounded-xl border border-night-700 bg-night-900/80 px-4 py-3 text-sm text-sand-100 outline-none ring-0 placeholder:text-night-300 focus:border-sage-300"
            placeholder="6-digit code"
          />
          {verifyState.fieldErrors?.code?.[0] ? (
            <p className="text-xs text-amber-300">{verifyState.fieldErrors.code[0]}</p>
          ) : null}
        </div>

        {verifyState.error ? <p className="text-sm text-amber-300">{verifyState.error}</p> : null}
        {verifyState.info ? <p className="text-sm text-sage-200">{verifyState.info}</p> : null}

        <VerifyButton />
      </form>

      <form action={resendAction} className="space-y-3">
        <input type="hidden" name="email" value={resolvedEmail} />
        {resendState.error ? <p className="text-sm text-amber-300">{resendState.error}</p> : null}
        {resendState.info ? <p className="text-sm text-sage-200">{resendState.info}</p> : null}
        <ResendButton />
      </form>

      <p className="text-xs text-night-300">
        Already verified?{" "}
        <Link href="/auth/signin" className="text-sage-200 hover:text-sage-100">
          Sign in
        </Link>
      </p>
    </div>
  );
}
