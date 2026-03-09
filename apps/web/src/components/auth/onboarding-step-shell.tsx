import type { ReactNode } from "react";

type OnboardingStepShellProps = {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export function OnboardingStepShell({ id, title, description, children }: OnboardingStepShellProps) {
  return (
    <section aria-labelledby={`${id}-title`} className="space-y-4 motion-safe:animate-fade-in-up">
      <header className="space-y-2">
        <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-tight text-sand-100 sm:text-[1.9rem]">
          {title}
        </h2>
        {description ? <p className="text-sm text-night-200">{description}</p> : null}
      </header>
      {children}
    </section>
  );
}
