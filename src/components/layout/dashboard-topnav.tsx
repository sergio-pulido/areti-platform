import Link from "next/link";
import { Bell, Menu, Plus, Search, Sparkles } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import type { CurrentUser } from "@/lib/auth/session";
import { dashboardNavItems } from "@/lib/navigation";

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
  return (
    <header className="sticky top-0 z-20 border-b border-night-800/80 bg-night-950/90 px-4 py-4 backdrop-blur lg:px-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 lg:hidden">
            <Menu size={18} className="text-sand-100" />
            <p className="font-title text-xl text-sand-100">Ataraxia</p>
          </div>

          <div className="hidden flex-1 lg:block">
            <form className="relative max-w-md" action="/dashboard/library" method="get">
              <Search className="pointer-events-none absolute left-3 top-3 text-night-200" size={16} />
              <input
                type="search"
                name="q"
                placeholder="Search lessons, quotes, practices..."
                className="w-full rounded-xl border border-night-700 bg-night-900/70 py-2 pl-9 pr-4 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none"
              />
            </form>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-night-700 bg-night-900/80 px-3 py-2 text-xs text-sand-200 hover:border-night-600"
            >
              <Plus size={14} />
              New Entry
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-night-700 bg-night-900/80 text-sand-200 hover:border-night-600"
              aria-label="Notifications"
            >
              <Bell size={15} />
            </button>
            <button
              type="button"
              className="hidden items-center gap-2 rounded-xl border border-sage-400/40 bg-sage-500/15 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20 sm:inline-flex"
            >
              <Sparkles size={14} />
              AI Assist
            </button>

            <details className="relative">
              <summary className="list-none cursor-pointer">
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
                  <Link href="/dashboard/account" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                    Account
                  </Link>
                  <Link href="/dashboard/settings" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                    Security Settings
                  </Link>
                  <Link href="/legal/privacy" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                    Privacy Policy
                  </Link>
                  <Link href="/legal/terms" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
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

        <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {dashboardNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-xl border border-night-700 bg-night-900/70 px-3 py-1.5 text-xs text-sand-200"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
