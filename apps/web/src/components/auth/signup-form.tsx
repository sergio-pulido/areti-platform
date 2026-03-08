"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signupAction } from "@/actions/auth";
import { initialAuthActionState } from "@/actions/auth-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Forging account..." : "Create Account"}
    </button>
  );
}

export function SignupForm() {
  const [state, formAction] = useActionState(signupAction, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="name" className="text-sm text-sand-200">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full rounded-xl border border-night-700 bg-night-900/80 px-4 py-3 text-sm text-sand-100 outline-none ring-0 placeholder:text-night-300 focus:border-sage-300"
          placeholder="Epicurus Aurelius"
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="text-xs text-amber-300">{state.fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm text-sand-200">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-night-700 bg-night-900/80 px-4 py-3 text-sm text-sand-100 outline-none ring-0 placeholder:text-night-300 focus:border-sage-300"
          placeholder="you@philosophy.app"
        />
        {state.fieldErrors?.email?.[0] ? (
          <p className="text-xs text-amber-300">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm text-sand-200">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-xl border border-night-700 bg-night-900/80 px-4 py-3 text-sm text-sand-100 outline-none ring-0 placeholder:text-night-300 focus:border-sage-300"
          placeholder="At least 10 chars, upper/lower/number"
        />
        {state.fieldErrors?.password?.[0] ? (
          <p className="text-xs text-amber-300">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label htmlFor="confirmPassword" className="text-sm text-sand-200">
          Confirm Password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          className="w-full rounded-xl border border-night-700 bg-night-900/80 px-4 py-3 text-sm text-sand-100 outline-none ring-0 placeholder:text-night-300 focus:border-sage-300"
          placeholder="Repeat your password"
        />
        {state.fieldErrors?.confirmPassword?.[0] ? (
          <p className="text-xs text-amber-300">{state.fieldErrors.confirmPassword[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="flex items-start gap-2 text-sm text-sand-200">
          <input
            type="checkbox"
            name="acceptTerms"
            value="true"
            required
            className="mt-1 h-4 w-4 rounded border-night-600 bg-night-900 text-sage-300"
          />
          <span>
            I accept the{" "}
            <Link href="/legal/terms" className="text-sage-200 hover:text-sage-100">
              Terms and Conditions
            </Link>
            .
          </span>
        </label>
        {state.fieldErrors?.acceptTerms?.[0] ? (
          <p className="text-xs text-amber-300">{state.fieldErrors.acceptTerms[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label className="flex items-start gap-2 text-sm text-sand-200">
          <input
            type="checkbox"
            name="acceptPrivacy"
            value="true"
            required
            className="mt-1 h-4 w-4 rounded border-night-600 bg-night-900 text-sage-300"
          />
          <span>
            I accept the{" "}
            <Link href="/legal/privacy" className="text-sage-200 hover:text-sage-100">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {state.fieldErrors?.acceptPrivacy?.[0] ? (
          <p className="text-xs text-amber-300">{state.fieldErrors.acceptPrivacy[0]}</p>
        ) : null}
      </div>

      {state.error ? <p className="text-sm text-amber-300">{state.error}</p> : null}

      <SubmitButton />

      <p className="text-xs text-night-300">
        Already registered?{" "}
        <Link href="/auth/signin" className="text-sage-200 hover:text-sage-100">
          Sign in
        </Link>
      </p>
    </form>
  );
}
