import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/cn";

type PasswordStrengthChecklistProps = {
  password: string;
};

const passwordChecks = [
  {
    id: "length",
    label: "At least 10 characters",
    test: (value: string) => value.length >= 10,
  },
  {
    id: "uppercase",
    label: "At least one uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "At least one lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "At least one number",
    test: (value: string) => /\d/.test(value),
  },
] as const;

export function PasswordStrengthChecklist({ password }: PasswordStrengthChecklistProps) {
  return (
    <ul className="grid gap-1.5" aria-live="polite" aria-label="Password requirements">
      {passwordChecks.map((check) => {
        const passed = check.test(password);

        return (
          <li key={check.id} className="flex items-center gap-2 text-xs">
            <CheckCircle2
              size={14}
              aria-hidden="true"
              className={cn(passed ? "text-sage-300" : "text-night-400")}
            />
            <span className={cn(passed ? "text-sage-200" : "text-night-300")}>{check.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
