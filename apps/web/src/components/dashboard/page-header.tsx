import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex animate-fade-in-up flex-col gap-4 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="text-xs uppercase tracking-[0.3em] text-sage-200/85">{eyebrow}</p>
        ) : null}
        <h1 className="mt-1 font-title text-4xl leading-tight text-sand-100">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-night-200">{description}</p>
      </div>
      {actions ? <div>{actions}</div> : null}
    </div>
  );
}
