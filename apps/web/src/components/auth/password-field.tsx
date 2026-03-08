"use client";

import { Eye, EyeOff } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Input } from "@/components/ui/input";
import { AuthField } from "@/components/auth/auth-field";

type PasswordFieldProps = {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  hint?: string;
  labelRight?: ReactNode;
};

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  value,
  onChange,
  onBlur,
  required = true,
  placeholder,
  error,
  hint,
  labelRight,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const describedBy = useMemo(() => {
    if (error) {
      return `${id}-error`;
    }

    if (hint) {
      return `${id}-hint`;
    }

    return undefined;
  }, [error, hint, id]);

  return (
    <AuthField id={id} label={label} error={error} hint={hint} labelRight={labelRight}>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          placeholder={placeholder}
          className={cn(
            "h-11 border-night-600/90 bg-night-950/85 px-4 pr-12 text-sand-100 transition-colors duration-150 hover:border-night-500/90 focus:border-sage-300",
            error ? "border-amber-400/80 focus:border-amber-300" : undefined,
          )}
        />
        <button
          type="button"
          onClick={() => setShowPassword((value) => !value)}
          className="absolute right-1 top-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-night-200 transition hover:bg-night-800 hover:text-sand-100"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </AuthField>
  );
}
