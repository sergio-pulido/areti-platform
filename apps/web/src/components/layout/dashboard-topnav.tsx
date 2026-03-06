import Link from "next/link";
import { Bell, Menu, Plus, Search, Sparkles, Zap } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import type { CurrentUser } from "@/lib/auth/session";
import { canAccessCreator, getTopbarSectionsForRole } from "@/lib/navigation";

type DashboardTopnavProps = {
  user: CurrentUser;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardTopnav({ user }: DashboardTopnavProps) {
  const topbarSections = getTopbarSectionsForRole(user.role);
  const showCreator = canAccessCreator(user.role);

  return (
    <header className="sticky top-0 z-20 border-b border-night-800/80 bg-night-950/90 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <Link
              href="/dashboard"
              aria-label="Go to dashboard home"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-night-700 bg-night-900/80 text-sand-100 hover:border-night-600"
            >
              <Menu size={18} />
            </Link>
            <Link href="/dashboard" className="font-title text-xl text-sand-100">
              Ataraxia
            </Link>
          </div>

          <div className="hidden flex-1 lg:block">
            <form className="relative max-w-md" action="/dashboard/library" method="get">
              <label htmlFor="dashboard-search" className="sr-only">
                Search lessons, quotes, and practices
              </label>
              <Search className="pointer-events-none absolute left-3 top-3 text-night-200" size={16} />
              <input
                id="dashboard-search"
                type="search"
                name="q"
                placeholder="Search lessons, quotes, practices..."
                className="w-full rounded-xl border border-night-700 bg-night-900/70 py-2 pl-9 pr-4 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none"
              />
            </form>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/journal"
              className="inline-flex items-center gap-2 rounded-xl border border-night-700 bg-night-900/80 px-3 py-2 text-xs text-sand-200 hover:border-night-600"
            >
              <Plus size={14} />
              New Entry
            </Link>

            <details className="relative">
              <summary
                className="inline-flex h-9 w-9 list-none cursor-pointer items-center justify-center rounded-xl border border-night-700 bg-night-900/80 text-sand-200 hover:border-night-600"
                aria-label="Notifications"
                aria-haspopup="menu"
              >
                <Bell size={15} />
              </summary>
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-night-700 bg-night-900/95 p-2 shadow-2xl">
                <p className="px-2 py-1 text-xs uppercase tracking-[0.2em] text-night-300">Notifications</p>
                <div className="mt-1 flex flex-col text-sm">
                  <Link
                    href="/dashboard/journal?title=Daily%20Reflection&mood=Grounded"
                    className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800"
                  >
                    Reflection reminder
                  </Link>
                  <Link
                    href="/dashboard/practices"
                    className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800"
                  >
                    Continue your practice streak
                  </Link>
                  <Link
                    href="/community"
                    className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800"
                  >
                    New circle activity
                  </Link>
                </div>
              </div>
            </details>

            <details className="relative">
              <summary
                className="inline-flex h-9 w-9 list-none cursor-pointer items-center justify-center rounded-xl border border-night-700 bg-night-900/80 text-sand-200 hover:border-night-600"
                aria-label="Quick actions"
                aria-haspopup="menu"
              >
                <Zap size={15} />
              </summary>
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-night-700 bg-night-900/95 p-2 shadow-2xl">
                <p className="px-2 py-1 text-xs uppercase tracking-[0.2em] text-night-300">Quick Actions</p>
                <div className="mt-1 flex flex-col text-sm">
                  <Link href="/dashboard/journal" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                    Capture a reflection
                  </Link>
                  <Link href="/dashboard/practices" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                    Start a practice
                  </Link>
                  <Link href="/community" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                    Check community circles
                  </Link>
                </div>
              </div>
            </details>

            <Link
              href="/dashboard/chat"
              className="hidden items-center gap-2 rounded-xl border border-sage-400/40 bg-sage-500/15 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20 sm:inline-flex"
            >
              <Sparkles size={14} />
              AI Assist
            </Link>

            <details className="relative">
              <summary className="list-none cursor-pointer" aria-label="Open user menu" aria-haspopup="menu">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sage-300/50 bg-sage-500/15 text-xs font-semibold text-sage-100">
                  {initials(user.name)}
                </span>
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-night-700 bg-night-900/95 p-2 shadow-2xl">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium text-sand-100">{user.name}</p>
                  <p className="text-xs text-night-300">{user.email}</p>
                </div>
                <div className="my-1 border-t border-night-700" />
                <div className="flex flex-col text-sm">
                  <Link
                    href="/account"
                    aria-label="Open account section"
                    className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800"
                  >
                    Account
                  </Link>
                  <Link
                    href="/community"
                    aria-label="Open community section"
                    className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800"
                  >
                    Community
                  </Link>
                  {showCreator ? (
                    <Link
                      href="/creator"
                      aria-label="Open creator section"
                      className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800"
                    >
                      Creator Studio
                    </Link>
                  ) : null}
                  <Link href="/account/settings" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                    Security Settings
                  </Link>
                  <Link href="/account/privacy" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                    Privacy Policy
                  </Link>
                  <Link href="/account/terms" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                    Terms
                  </Link>
                </div>
                <div className="my-1 border-t border-night-700" />
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-lg px-2 py-2 text-left text-sm text-rose-200 hover:bg-rose-500/15"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </details>
          </div>
        </div>

        <div className="space-y-2">
          <p className="px-1 text-[10px] uppercase tracking-[0.25em] text-night-300">Sections</p>
          <div className="hidden gap-2 overflow-x-auto pb-1 lg:flex">
            {topbarSections.map((section) => (
              <Link
                key={section.id}
                href={section.href}
                className="whitespace-nowrap rounded-xl border border-night-700 bg-night-900/70 px-3 py-1.5 text-xs text-sand-200 hover:border-night-600"
              >
                {section.label}
              </Link>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {topbarSections.map((section) => (
              <Link
                key={section.id}
                href={section.href}
                className="whitespace-nowrap rounded-xl border border-night-700 bg-night-900/70 px-3 py-1.5 text-xs text-sand-200"
              >
                {section.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
