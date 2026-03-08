import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-[linear-gradient(90deg,rgba(48,40,31,0.72),rgba(74,59,45,0.72),rgba(48,40,31,0.72))] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
