import Link from "next/link";
import type { ReactNode } from "react";

type InteractiveCardLinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

const baseClassName =
  "block rounded-2xl border border-night-800 bg-night-950/70 p-3 transition hover:border-sage-300/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-300/70";

export function InteractiveCardLink({
  href,
  children,
  className,
  ariaLabel,
}: InteractiveCardLinkProps) {
  const nextClassName = className ? `${baseClassName} ${className}` : baseClassName;

  return (
    <Link href={href} className={nextClassName} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
