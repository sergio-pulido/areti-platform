"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signinAction } from "@/actions/auth";
import { initialAuthActionState } from "@/actions/auth-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Entering agora..." : "Sign In"}
    </button>
  );
}

export function SigninForm() {
  const [state, formAction] = useActionState(signinAction, initialAuthActionState);

  return (
    <form action={formAction} className="space-y-4">
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
          autoComplete="current-password"
          className="w-full rounded-xl border border-night-700 bg-night-900/80 px-4 py-3 text-sm text-sand-100 outline-none ring-0 placeholder:text-night-300 focus:border-sage-300"
          placeholder="Your strong password"
        />
        {state.fieldErrors?.password?.[0] ? (
          <p className="text-xs text-amber-300">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      {state.error ? <p className="text-sm text-amber-300">{state.error}</p> : null}

      <SubmitButton />

      <p className="text-xs text-night-300">
        New here?{" "}
        <Link href="/auth/signup" className="text-sage-200 hover:text-sage-100">
          Create your account
        </Link>
      </p>
    </form>
  );
}
