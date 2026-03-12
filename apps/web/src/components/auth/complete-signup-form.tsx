"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { completeSignupAction, type CompleteSignupActionState } from "@/actions/auth";
import { AuthField } from "@/components/auth/auth-field";
import { LegalConsent } from "@/components/auth/legal-consent";
import { PasswordField } from "@/components/auth/password-field";
import { PasswordStrengthChecklist } from "@/components/auth/password-strength-checklist";
import { Input } from "@/components/ui/input";
import { PASSWORD_MIN_LENGTH } from "@/lib/auth/constants";
import { isValidPassword } from "@/lib/auth/client-validation";
import { cn } from "@/lib/cn";
import { SUPPORTED_LOCALES } from "@/lib/i18n/config";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-sand-100 bg-sand-100 px-4 py-3 text-sm font-semibold tracking-wide text-night-950 transition hover:bg-sand-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Creating account..." : "Create account"}
    </button>
  );
}

type CompleteSignupFormProps = {
  completionToken: string;
  email: string;
  suggestedUsername: string;
  requiresLegalAtCompletion: boolean;
  locale: string | null;
};

export function CompleteSignupForm({
  completionToken,
  email,
  suggestedUsername,
  requiresLegalAtCompletion,
  locale,
}: CompleteSignupFormProps) {
  const [state, formAction] = useActionState<CompleteSignupActionState, FormData>(
    completeSignupAction,
    {},
  );
  const [name, setName] = useState("");
  const [username, setUsername] = useState(suggestedUsername);
  const [password, setPassword] = useState("");
  const [selectedLocale, setSelectedLocale] = useState(locale ?? "");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    username: false,
    password: false,
    acceptTerms: false,
    acceptPrivacy: false,
  });

  function buildLocalErrors(force: boolean): Record<string, string> {
    const errors: Record<string, string> = {};
    const shouldShow = force || submitAttempted;

    if ((shouldShow || touched.name) && name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    if ((shouldShow || touched.username) && !/^[a-z0-9_-]{3,40}$/.test(username.trim().toLowerCase())) {
      errors.username = "Use 3-40 lowercase letters, numbers, _ or -.";
    }

    if ((shouldShow || touched.password) && !isValidPassword(password)) {
      errors.password =
        `Use at least ${PASSWORD_MIN_LENGTH} characters, including upper and lower case letters and a number.`;
    }

    if (requiresLegalAtCompletion && (shouldShow || touched.acceptTerms) && !acceptTerms) {
      errors.acceptTerms = "Please accept the Terms of Service.";
    }

    if (requiresLegalAtCompletion && (shouldShow || touched.acceptPrivacy) && !acceptPrivacy) {
      errors.acceptPrivacy = "Please accept the Privacy Policy.";
    }

    return errors;
  }

  const localErrors = buildLocalErrors(false);
  const nameError = localErrors.name ?? state.fieldErrors?.name?.[0];
  const usernameError = localErrors.username ?? state.fieldErrors?.username?.[0];
  const passwordError = localErrors.password ?? state.fieldErrors?.password?.[0];
  const termsError =
    localErrors.acceptTerms ?? state.fieldErrors?.acceptTerms?.[0] ?? state.fieldErrors?.acceptLegal?.[0];
  const privacyError =
    localErrors.acceptPrivacy ??
    state.fieldErrors?.acceptPrivacy?.[0] ??
    state.fieldErrors?.acceptLegal?.[0];

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
      <input type="hidden" name="completionToken" value={completionToken} />
      <input type="hidden" name="requiresLegalAtCompletion" value={String(requiresLegalAtCompletion)} />

      <div className="rounded-xl border border-night-700 bg-night-900/70 px-4 py-3 text-sm text-night-100">
        <span className="text-night-300">Verified email:</span> {email}
      </div>

      <AuthField id="name" label="Name" error={nameError}>
        <Input
          id="name"
          name="name"
          required
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
          onBlur={() => setTouched((current) => ({ ...current, name: true }))}
          placeholder="Your name"
          aria-invalid={nameError ? true : undefined}
          className={cn(
            "h-11 border-night-600/90 bg-night-950/85 px-4 transition-colors duration-150 hover:border-night-500/90 focus:border-sage-300",
            nameError ? "border-amber-400/80 focus:border-amber-300" : undefined,
          )}
        />
      </AuthField>

      <AuthField id="username" label="Username" error={usernameError}>
        <Input
          id="username"
          name="username"
          required
          autoComplete="username"
          value={username}
          onChange={(event) => setUsername(event.currentTarget.value.toLowerCase())}
          onBlur={() => setTouched((current) => ({ ...current, username: true }))}
          placeholder="username"
          aria-invalid={usernameError ? true : undefined}
          className={cn(
            "h-11 border-night-600/90 bg-night-950/85 px-4 transition-colors duration-150 hover:border-night-500/90 focus:border-sage-300",
            usernameError ? "border-amber-400/80 focus:border-amber-300" : undefined,
          )}
        />
      </AuthField>

      {state.suggestedUsername ? (
        <button
          type="button"
          onClick={() => setUsername(state.suggestedUsername ?? suggestedUsername)}
          className="text-left text-xs text-sage-200 underline underline-offset-2 hover:text-sage-100"
        >
          Try suggested username: {state.suggestedUsername}
        </button>
      ) : null}

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

      <AuthField id="locale" label="Language (optional)">
        <select
          id="locale"
          name="locale"
          value={selectedLocale}
          onChange={(event) => setSelectedLocale(event.currentTarget.value)}
          className="h-11 w-full rounded-xl border border-night-600/90 bg-night-950/85 px-4 text-sm text-sand-100 outline-none transition-colors duration-150 hover:border-night-500/90 focus:border-sage-300"
        >
          <option value="">Choose later</option>
          {SUPPORTED_LOCALES.map((item) => (
            <option key={item} value={item}>
              {item === "es" ? "Español" : "English"}
            </option>
          ))}
        </select>
      </AuthField>

      {requiresLegalAtCompletion ? (
        <LegalConsent
          acceptTerms={acceptTerms}
          acceptPrivacy={acceptPrivacy}
          onTermsChange={setAcceptTerms}
          onPrivacyChange={setAcceptPrivacy}
          onTermsBlur={() => setTouched((current) => ({ ...current, acceptTerms: true }))}
          onPrivacyBlur={() => setTouched((current) => ({ ...current, acceptPrivacy: true }))}
          termsError={termsError}
          privacyError={privacyError}
        />
      ) : null}

      {state.error ? (
        <p className="rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200" role="alert">
          {state.error}
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
