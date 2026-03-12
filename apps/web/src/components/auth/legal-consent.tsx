import Link from "next/link";
import { cn } from "@/lib/cn";

type LegalConsentProps = {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  onTermsBlur?: () => void;
  onPrivacyBlur?: () => void;
  termsError?: string;
  privacyError?: string;
};

export function LegalConsent({
  acceptTerms,
  acceptPrivacy,
  onTermsChange,
  onPrivacyChange,
  onTermsBlur,
  onPrivacyBlur,
  termsError,
  privacyError,
}: LegalConsentProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-3 text-sm text-sand-200" htmlFor="acceptTerms">
        <input
          id="acceptTerms"
          type="checkbox"
          name="acceptTerms"
          value="true"
          required
          checked={acceptTerms}
          onChange={(event) => onTermsChange(event.currentTarget.checked)}
          onBlur={onTermsBlur}
          aria-invalid={termsError ? true : undefined}
          aria-describedby={termsError ? "acceptTerms-error" : undefined}
          className={cn(
            "mt-1 h-4 w-4 rounded border border-night-500 bg-night-900 text-sage-300 focus:ring-0",
            termsError ? "border-amber-400" : undefined,
          )}
        />
        <span>
          I accept the{" "}
          <Link href="/legal/terms" className="text-sage-200 underline underline-offset-2 hover:text-sage-100">
            Terms of Service
          </Link>
          .
        </span>
      </label>
      {termsError ? (
        <p id="acceptTerms-error" role="alert" aria-live="polite" className="text-xs text-amber-300">
          {termsError}
        </p>
      ) : null}

      <label className="flex items-start gap-3 text-sm text-sand-200" htmlFor="acceptPrivacy">
        <input
          id="acceptPrivacy"
          type="checkbox"
          name="acceptPrivacy"
          value="true"
          required
          checked={acceptPrivacy}
          onChange={(event) => onPrivacyChange(event.currentTarget.checked)}
          onBlur={onPrivacyBlur}
          aria-invalid={privacyError ? true : undefined}
          aria-describedby={privacyError ? "acceptPrivacy-error" : undefined}
          className={cn(
            "mt-1 h-4 w-4 rounded border border-night-500 bg-night-900 text-sage-300 focus:ring-0",
            privacyError ? "border-amber-400" : undefined,
          )}
        />
        <span>
          I accept the{" "}
          <Link
            href="/legal/privacy"
            className="text-sage-200 underline underline-offset-2 hover:text-sage-100"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {privacyError ? (
        <p id="acceptPrivacy-error" role="alert" aria-live="polite" className="text-xs text-amber-300">
          {privacyError}
        </p>
      ) : null}
    </div>
  );
}
