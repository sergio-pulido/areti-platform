import Link from "next/link";

type AuthFooterLinkProps = {
  text: string;
  href: string;
  cta: string;
};

export function AuthFooterLink({ text, href, cta }: AuthFooterLinkProps) {
  return (
    <p className="text-center text-sm text-night-300">
      {text}{" "}
      <Link href={href} className="text-sage-200 hover:text-sage-100">
        {cta}
      </Link>
    </p>
  );
}
