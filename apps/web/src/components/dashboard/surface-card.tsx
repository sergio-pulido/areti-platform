import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

type SurfaceCardProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  className?: string;
  id?: string;
};

export function SurfaceCard({ title, subtitle, children, className, id }: SurfaceCardProps) {
  return (
    <Card id={id} variant="default" className={cn("rounded-[var(--radius-2xl)]", className)}>
      <h2 className="text-lg font-semibold text-sand-100">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-night-300">{subtitle}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  );
}
