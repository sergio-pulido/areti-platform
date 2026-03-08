import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeVariant = "default" | "success" | "muted";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClassMap: Record<BadgeVariant, string> = {
  default: "border-night-700 bg-night-900/80 text-night-200",
  success: "border-sage-300/40 bg-sage-500/10 text-sage-100",
  muted: "border-night-700/80 bg-night-950/80 text-night-300",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        variantClassMap[variant],
        className,
      )}
      {...props}
    />
  );
}
