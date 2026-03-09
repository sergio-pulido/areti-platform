import { cn } from "@/lib/cn";

type OnboardingOptionCardProps = {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  hint?: string;
};

export function OnboardingOptionCard({
  id,
  name,
  value,
  checked,
  onChange,
  hint,
}: OnboardingOptionCardProps) {
  return (
    <div>
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className={cn(
          "group block min-h-14 cursor-pointer rounded-2xl border border-night-700/80 bg-night-950/60 px-4 py-3 text-left transition duration-300 ease-[var(--motion-ease-standard)]",
          "hover:border-sage-300/65 hover:bg-night-900/90 hover:shadow-[0_14px_40px_rgba(0,0,0,0.3)]",
          "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-sage-300/85 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-night-900",
          checked
            ? "border-sage-300 bg-sage-500/12 shadow-[0_12px_38px_rgba(0,0,0,0.35)]"
            : "",
        )}
      >
        <span className="text-[0.97rem] font-medium text-sand-100">{value}</span>
        {hint ? <p className="mt-1 text-sm text-night-200">{hint}</p> : null}
      </label>
    </div>
  );
}
