"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  resendVerificationAction,
  type EmailVerificationActionState,
} from "@/actions/auth";

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
  initialInfo?: string;
  initialError?: string;
};

export function VerifyEmailForm({
  initialEmail,
  initialInfo = "",
  initialError = "",
}: VerifyEmailFormProps) {
  const [resendState, resendAction] = useActionState<EmailVerificationActionState, FormData>(
    resendVerificationAction,
    {
      email: initialEmail,
    },
  );
  const [email, setEmail] = useState(resendState.email ?? initialEmail);

  const resolvedInfo = resendState.info ?? initialInfo;
  const resolvedError = resendState.error ?? initialError;
  const emailError = resendState.fieldErrors?.email?.[0];

  return (
    <div className="space-y-5">
      {resolvedInfo ? <p className="rounded-xl border border-sage-300/30 bg-sage-500/10 px-3 py-2 text-sm text-sage-100">{resolvedInfo}</p> : null}
      {resolvedError ? <p className="rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{resolvedError}</p> : null}

      <form action={resendAction} className="space-y-3">
        <label className="space-y-1 text-sm text-sand-200" htmlFor="resend-email">
          <span>Email</span>
          <input
            id="resend-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
            className="w-full rounded-xl border border-night-700 bg-night-900/80 px-4 py-3 text-sm text-sand-100 outline-none ring-0 placeholder:text-night-300 focus:border-sage-300"
            placeholder="you@areti.app"
          />
        </label>

        {emailError ? <p className="text-xs text-amber-300">{emailError}</p> : null}
        <ResendButton />
      </form>

      <p className="text-xs text-night-300">
        Need to use another email?{" "}
        <Link href="/auth/signup" className="text-sage-200 hover:text-sage-100">
          Restart signup
        </Link>
        .
      </p>
    </div>
  );
}
