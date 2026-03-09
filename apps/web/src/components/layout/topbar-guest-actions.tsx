import Link from "next/link";

export type TopbarGuestAuthSwitch = {
  href: string;
  label: string;
};

type TopbarGuestActionsProps = {
  guestAuthSwitch?: TopbarGuestAuthSwitch;
};

export function TopbarGuestActions({ guestAuthSwitch }: TopbarGuestActionsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        href="/legal/privacy"
        className="rounded-lg border border-night-700 px-3 py-1.5 text-sand-200 hover:border-night-500"
      >
        Privacy
      </Link>
      <Link
        href="/legal/terms"
        className="rounded-lg border border-night-700 px-3 py-1.5 text-sand-200 hover:border-night-500"
      >
        Terms
      </Link>
      {guestAuthSwitch ? (
        <Link
          href={guestAuthSwitch.href}
          className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-1.5 font-semibold text-night-950 hover:bg-sand-50"
        >
          {guestAuthSwitch.label}
        </Link>
      ) : (
        <>
          <Link
            href="/auth/signin"
            className="rounded-lg border border-night-700 px-3 py-1.5 text-sand-200 hover:border-night-500"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-lg border border-sand-100 bg-sand-100 px-3 py-1.5 font-semibold text-night-950 hover:bg-sand-50"
          >
            Get started
          </Link>
        </>
      )}
    </nav>
  );
}
