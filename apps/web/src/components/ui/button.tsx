import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClassMap: Record<ButtonVariant, string> = {
  primary:
    "border-transparent bg-sand-100 text-night-950 hover:bg-sand-50 focus-visible:outline-none",
  secondary:
    "border-night-700 bg-night-900/80 text-sand-100 hover:border-night-500 focus-visible:outline-none",
  ghost:
    "border-transparent bg-transparent text-night-100 hover:border-night-700 hover:bg-night-900/70 focus-visible:outline-none",
  destructive:
    "border-rose-400/40 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20 focus-visible:outline-none",
};

const sizeClassMap: Record<ButtonSize, string> = {
  sm: "h-8 rounded-lg px-3 text-xs",
  md: "h-10 rounded-xl px-4 text-sm",
  lg: "h-11 rounded-xl px-5 text-sm",
  icon: "h-9 w-9 rounded-xl p-0",
};

export function Button({
  className,
  type = "button",
  variant = "secondary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 border font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClassMap[variant],
        sizeClassMap[size],
        className,
      )}
      {...props}
    />
  );
}
