import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-night-700 bg-night-950 px-3 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});
