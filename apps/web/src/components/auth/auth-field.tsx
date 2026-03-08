import type { ReactNode } from "react";

type AuthFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  labelRight?: ReactNode;
  children: ReactNode;
};

export function AuthField({ id, label, error, hint, labelRight, children }: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-sand-200">
          {label}
        </label>
        {labelRight}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" aria-live="polite" className="text-xs text-amber-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-night-300">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
