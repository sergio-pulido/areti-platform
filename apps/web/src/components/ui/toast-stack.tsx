"use client";

import { CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

export type ToastKind = "success" | "error" | "info";

export type ToastItem = {
  id: string;
  message: string;
  kind?: ToastKind;
};

type ToastStackProps = {
  items: ToastItem[];
  className?: string;
};

function iconForKind(kind: ToastKind) {
  if (kind === "error") {
    return <AlertCircle size={14} className="text-rose-200" />;
  }
  if (kind === "info") {
    return <Info size={14} className="text-sky-200" />;
  }
  return <CheckCircle2 size={14} className="text-sage-100" />;
}

export function ToastStack({ items, className }: ToastStackProps) {
  return (
    <div className={cn("pointer-events-none fixed right-4 top-16 z-50 flex w-[min(90vw,24rem)] flex-col gap-2", className)}>
      {items.map((item) => {
        const kind = item.kind ?? "success";
        return (
          <div
            key={item.id}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm shadow-xl backdrop-blur-sm",
              kind === "error" && "border-rose-300/55 bg-rose-500/18 text-rose-100",
              kind === "info" && "border-sky-300/45 bg-sky-500/16 text-sky-100",
              kind === "success" && "border-sage-300/45 bg-sage-500/16 text-sage-100",
            )}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5">{iconForKind(kind)}</span>
              <p className="leading-5">{item.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
