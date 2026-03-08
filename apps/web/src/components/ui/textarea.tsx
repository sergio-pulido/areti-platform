import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-night-700 bg-night-950 px-3 py-2.5 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
});
