"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { signinAction } from "@/actions/auth";
import { initialAuthActionState } from "@/actions/auth-state";

type PasskeyAuthOptionsData = {
  challengeId: string;
  options: PublicKeyCredentialRequestOptionsJSON;
};

function SubmitButton({ mfaRequired }: { mfaRequired: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Checking..." : mfaRequired ? "Verify Code" : "Sign In"}
    </button>
  );
}

async function parseApiData<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { data?: T; error?: string };

  if (!response.ok || !payload.data) {
    throw new Error(payload.error ?? "Request failed");
  }

  return payload.data;
}

export function SigninForm() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const [state, formAction] = useActionState(signinAction, initialAuthActionState);
  const [passkeyPending, setPasskeyPending] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const mfaRequired = Boolean(state.mfaRequired && state.mfaChallengeId);

  async function handlePasskeySignin() {
    const email = emailRef.current?.value.trim().toLowerCase() ?? "";

    if (!email || !email.includes("@")) {
      setPasskeyError("Enter your account email first, then use passkey sign-in.");
      return;
    }

    setPasskeyPending(true);
    setPasskeyError(null);

    try {
      const optionsResponse = await fetch("/api/passkeys/auth/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const optionsPayload = await parseApiData<PasskeyAuthOptionsData>(optionsResponse);

      const assertion = (await startAuthentication({
        optionsJSON: optionsPayload.options,
      })) as AuthenticationResponseJSON;

      const verifyResponse = await fetch("/api/passkeys/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          challengeId: optionsPayload.challengeId,
          response: assertion,
        }),
      });

      await parseApiData<{ user: { id: string } }>(verifyResponse);

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (error instanceof Error) {
        setPasskeyError(error.message);
      } else {
        setPasskeyError("Unable to sign in with passkey.");
      }
    } finally {
      setPasskeyPending(false);
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm text-sand-200">
          Email
        </label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={state.email ?? ""}
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

      {mfaRequired ? (
        <>
          <input type="hidden" name="mfaChallengeId" value={state.mfaChallengeId} readOnly />
          <div className="space-y-1">
            <label htmlFor="mfaCode" className="text-sm text-sand-200">
              MFA Code
            </label>
            <input
              id="mfaCode"
              name="mfaCode"
              type="text"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              className="w-full rounded-xl border border-night-700 bg-night-900/80 px-4 py-3 text-sm text-sand-100 outline-none ring-0 placeholder:text-night-300 focus:border-sage-300"
              placeholder="6-digit verification code"
            />
            {state.fieldErrors?.mfaCode?.[0] ? (
              <p className="text-xs text-amber-300">{state.fieldErrors.mfaCode[0]}</p>
            ) : null}
          </div>
        </>
      ) : null}

      {state.info ? <p className="text-sm text-sage-200">{state.info}</p> : null}
      {state.error ? <p className="text-sm text-amber-300">{state.error}</p> : null}

      <SubmitButton mfaRequired={mfaRequired} />

      {!mfaRequired ? (
        <button
          type="button"
          onClick={handlePasskeySignin}
          disabled={passkeyPending}
          className="w-full rounded-xl border border-night-600 bg-night-900/80 px-4 py-3 text-sm font-medium text-sand-100 transition hover:border-sage-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {passkeyPending ? "Opening passkey prompt..." : "Sign In With Passkey"}
        </button>
      ) : null}

      {passkeyError ? <p className="text-sm text-amber-300">{passkeyError}</p> : null}

      <p className="text-xs text-night-300">
        New here?{" "}
        <Link href="/auth/signup" className="text-sage-200 hover:text-sage-100">
          Create your account
        </Link>
      </p>
    </form>
  );
}
