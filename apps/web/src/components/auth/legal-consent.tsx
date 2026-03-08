import Link from "next/link";
import { cn } from "@/lib/cn";

type LegalConsentProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
  error?: string;
};

export function LegalConsent({ checked, onChange, onBlur, error }: LegalConsentProps) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-start gap-3 text-sm text-sand-200" htmlFor="acceptLegal">
        <input
          id="acceptLegal"
          type="checkbox"
          name="acceptLegal"
          value="true"
          required
          checked={checked}
          onChange={(event) => onChange(event.currentTarget.checked)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "acceptLegal-error" : undefined}
          className={cn(
            "mt-1 h-4 w-4 rounded border border-night-500 bg-night-900 text-sage-300 focus:ring-0",
            error ? "border-amber-400" : undefined,
          )}
        />
        <span>
          I agree to the{" "}
          <Link href="/legal/terms" className="text-sage-200 underline underline-offset-2 hover:text-sage-100">
            Terms
          </Link>{" "}
          and{" "}
          <Link
            href="/legal/privacy"
            className="text-sage-200 underline underline-offset-2 hover:text-sage-100"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>
      {error ? (
        <p id="acceptLegal-error" role="alert" aria-live="polite" className="text-xs text-amber-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
