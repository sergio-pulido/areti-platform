import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

type SurfaceCardProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function SurfaceCard({ title, subtitle, children }: SurfaceCardProps) {
  return (
    <Card variant="default" className="rounded-[var(--radius-2xl)]">
      <h2 className="text-lg font-semibold text-sand-100">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-night-300">{subtitle}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </Card>
  );
}
