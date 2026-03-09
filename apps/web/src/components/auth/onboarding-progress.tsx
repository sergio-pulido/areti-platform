type OnboardingProgressProps = {
  currentStep: number;
  totalSteps: number;
};

export function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const safeTotal = totalSteps <= 0 ? 1 : totalSteps;
  const safeCurrent = Math.min(Math.max(currentStep, 1), safeTotal);
  const percent = Math.round((safeCurrent / safeTotal) * 100);

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-night-300">
        <p>Step {safeCurrent} of {safeTotal}</p>
        <p>{percent}%</p>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-night-800" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div
          className="h-full rounded-full bg-sage-300 transition-[width] duration-500 ease-[var(--motion-ease-standard)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
