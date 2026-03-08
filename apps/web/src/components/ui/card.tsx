import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "muted" | "elevated";

type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
};

const variantClassMap: Record<CardVariant, string> = {
  default: "border-night-800 bg-night-900/65",
  muted: "border-night-800/80 bg-night-950/70",
  elevated: "border-night-700/80 bg-night-900/85 shadow-ui-elevated",
};

export function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <section
      className={cn("rounded-[var(--radius-xl)] border p-5", variantClassMap[variant], className)}
      {...props}
    />
  );
}
