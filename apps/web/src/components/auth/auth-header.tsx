import type { ReactNode } from "react";

type AuthHeaderProps = {
  title: string;
  subtitle: string;
  afterTitle?: ReactNode;
};

export function AuthHeader({ title, subtitle, afterTitle }: AuthHeaderProps) {
  return (
    <header>
      <h2 className="font-title text-3xl text-sand-100">{title}</h2>
      <p className="mt-2 text-sm text-sand-300">{subtitle}</p>
      {afterTitle ? <div className="mt-4">{afterTitle}</div> : null}
    </header>
  );
}
