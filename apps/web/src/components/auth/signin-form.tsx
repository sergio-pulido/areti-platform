"use client";

import { startAuthentication } from "@simplewebauthn/browser";
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { signinAction } from "@/actions/auth";
import { initialAuthActionState } from "@/actions/auth-state";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthField } from "@/components/auth/auth-field";
import { AuthFooterLink } from "@/components/auth/auth-footer-link";
import { AuthTrustMicrocopy } from "@/components/auth/auth-trust-microcopy";
import { PasskeyButton } from "@/components/auth/passkey-button";
import { PasswordField } from "@/components/auth/password-field";
import { Input } from "@/components/ui/input";
import { isValidEmail } from "@/lib/auth/client-validation";
import { parseClientApiData } from "@/lib/client-api";
import { cn } from "@/lib/cn";

type PasskeyAuthOptionsData = {
  challengeId: string;
  options: PublicKeyCredentialRequestOptionsJSON;
};

type SigninFormProps = {
  initialEmail?: string;
  autoStartPasskey?: boolean;
  showSignupLink?: boolean;
};

function SubmitButton({ mfaRequired }: { mfaRequired: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (mfaRequired ? "Verifying..." : "Signing in...") : mfaRequired ? "Verify code" : "Sign in"}
    </button>
  );
}

function humanizePasskeyError(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Passkey sign-in was canceled. Try again when you're ready.";
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("unavailable")) {
      return "Passkey sign-in is not set up for this account yet.";
    }

    if (message.includes("challenge") || message.includes("request failed")) {
      return "We couldn't complete passkey sign-in. Please try again.";
    }

    return error.message;
  }

  return "We couldn't complete passkey sign-in. Please try again.";
}

export function SigninForm({
  initialEmail = "",
  autoStartPasskey = false,
  showSignupLink = true,
}: SigninFormProps) {
  const router = useRouter();
  const [state, formAction] = useActionState(signinAction, initialAuthActionState);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, mfaCode: false });
  const [passkeyPending, setPasskeyPending] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);
  const passkeyAutostarted = useRef(false);

  const mfaRequired = Boolean(state.mfaRequired && state.mfaChallengeId);

  function buildLocalErrors(force: boolean): Record<string, string> {
    const errors: Record<string, string> = {};
    const shouldShow = force || submitAttempted;

    if ((shouldShow || touched.email) && !isValidEmail(email)) {
      errors.email = "Use a valid email address.";
    }

    if ((shouldShow || touched.password) && password.length === 0) {
      errors.password = "Password is required.";
    }

    if (mfaRequired && (shouldShow || touched.mfaCode) && !/^\d{6}$/.test(mfaCode)) {
      errors.mfaCode = "Enter the 6-digit verification code.";
    }

    return errors;
  }

  const localFieldErrors = buildLocalErrors(false);

  const emailError = localFieldErrors.email ?? state.fieldErrors?.email?.[0];
  const passwordError = localFieldErrors.password ?? state.fieldErrors?.password?.[0];
  const mfaError = localFieldErrors.mfaCode ?? state.fieldErrors?.mfaCode?.[0];

  const handlePasskeySignin = useCallback(async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      setPasskeyError("Enter your account email first.");
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
        body: JSON.stringify({ email: normalizedEmail }),
      });

      const optionsPayload = await parseClientApiData<PasskeyAuthOptionsData>(optionsResponse);

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

      await parseClientApiData<{ user: { id: string } }>(verifyResponse);

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setPasskeyError(humanizePasskeyError(error));
    } finally {
      setPasskeyPending(false);
    }
  }, [email, router]);

  useEffect(() => {
    if (!autoStartPasskey || mfaRequired || passkeyAutostarted.current) {
      return;
    }

    if (!isValidEmail(email)) {
      return;
    }

    passkeyAutostarted.current = true;
    void handlePasskeySignin();
  }, [autoStartPasskey, email, handlePasskeySignin, mfaRequired]);

  const authError = state.unverifiedEmail
    ? "Email not verified. Check your inbox to continue."
    : state.error
      ? state.error
      : null;

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

      <PasswordField
        id="password"
        name="password"
        label="Password"
        autoComplete="current-password"
        value={password}
        onChange={setPassword}
        onBlur={() => setTouched((current) => ({ ...current, password: true }))}
        error={passwordError}
        placeholder="Enter your password"
        labelRight={
          <Link
            href="/auth/forgot-password"
            className="text-xs text-sage-200 hover:text-sage-100"
          >
            Forgot password?
          </Link>
        }
      />

      {mfaRequired ? (
        <>
          <input type="hidden" name="mfaChallengeId" value={state.mfaChallengeId} readOnly />
          <AuthField id="mfaCode" label="Verification code" error={mfaError}>
            <Input
              id="mfaCode"
              name="mfaCode"
              type="text"
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={mfaCode}
              onChange={(event) => setMfaCode(event.currentTarget.value)}
              onBlur={() => setTouched((current) => ({ ...current, mfaCode: true }))}
              aria-invalid={mfaError ? true : undefined}
              aria-describedby={mfaError ? "mfaCode-error" : undefined}
              placeholder="6-digit code"
              className={cn(
                "h-11 border-night-600/90 bg-night-950/85 px-4 transition-colors duration-150 hover:border-night-500/90 focus:border-sage-300",
                mfaError ? "border-amber-400/80 focus:border-amber-300" : undefined,
              )}
            />
          </AuthField>
        </>
      ) : null}

      {state.info ? (
        <p className="rounded-xl border border-sage-400/40 bg-sage-500/10 px-3 py-2 text-sm text-sage-100">
          {state.info}
        </p>
      ) : null}

      {authError ? (
        <div className="rounded-xl border border-amber-400/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-200" role="alert">
          {authError}
          {state.unverifiedEmail ? (
            <>
              {" "}
              <Link
                href={`/auth/verify-email?email=${encodeURIComponent(state.unverifiedEmail)}&resend=1`}
                className="text-sage-200 underline underline-offset-2 hover:text-sage-100"
              >
                Request a new verification email
              </Link>
              .
            </>
          ) : null}
        </div>
      ) : null}

      <SubmitButton mfaRequired={mfaRequired} />

      {!mfaRequired ? (
        <>
          <AuthDivider />
          <PasskeyButton onClick={() => void handlePasskeySignin()} pending={passkeyPending} />
          {passkeyError ? (
            <p className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200" role="alert">
              {passkeyError}
            </p>
          ) : null}
        </>
      ) : null}

      {showSignupLink ? (
        <AuthFooterLink text="New here?" href="/auth/signup" cta="Create your account" />
      ) : null}
      <AuthTrustMicrocopy text="Private by default. Fast sign-in. No unnecessary noise." />
    </form>
  );
}
