import type { ReactNode } from "react";

type SurfaceCardProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
};

export function SurfaceCard({ title, subtitle, children }: SurfaceCardProps) {
  return (
    <section className="rounded-3xl border border-night-800 bg-night-900/60 p-5 shadow-[0_10px_50px_rgba(0,0,0,0.22)]">
      <h2 className="text-lg font-semibold text-sand-100">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-night-300">{subtitle}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
