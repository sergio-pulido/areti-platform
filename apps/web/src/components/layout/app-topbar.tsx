import Link from "next/link";
import { Bell, Menu, Plus, Search, Sparkles, Zap } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import {
  markNotificationReadAction,
  readAllNotificationsAction,
} from "@/actions/notifications";
import {
  TopbarGuestActions,
  type TopbarGuestAuthSwitch,
} from "@/components/layout/topbar-guest-actions";
import type { CurrentUser } from "@/lib/auth/session";
import { apiNotifications } from "@/lib/backend-api";
import { getTopbarSectionsForRole } from "@/lib/navigation";

const TOPBAR_CLASSNAME =
  "sticky top-0 z-40 border-b border-night-800/80 bg-night-950/95 px-4 py-2 backdrop-blur lg:px-8";

type AppTopbarProps = {
  user?: CurrentUser | null;
  accessToken?: string;
  guestAuthSwitch?: TopbarGuestAuthSwitch;
};

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function TopbarBrand() {
  return (
    <Link href="/" className="font-title text-xl text-sand-100">
      Areti
    </Link>
  );
}

function UnauthenticatedTopbar({ guestAuthSwitch }: { guestAuthSwitch?: TopbarGuestAuthSwitch }) {
  return (
    <header className={TOPBAR_CLASSNAME}>
      <div className="flex w-full items-center justify-between gap-3">
        <TopbarBrand />
        <TopbarGuestActions guestAuthSwitch={guestAuthSwitch} />
      </div>
    </header>
  );
}

export async function AppTopbar({ user, accessToken, guestAuthSwitch }: AppTopbarProps) {
  if (!user || !accessToken) {
    return <UnauthenticatedTopbar guestAuthSwitch={guestAuthSwitch} />;
  }

  const topbarSections = getTopbarSectionsForRole(user.role);
  const dropdownSections = topbarSections.filter((section) => section.id !== "companion");
  let notifications: Awaited<ReturnType<typeof apiNotifications>> = {
    items: [],
    unreadCount: 0,
  };

  try {
    notifications = await apiNotifications(accessToken, 20);
  } catch {
    notifications = { items: [], unreadCount: 0 };
  }

  return (
    <header className={TOPBAR_CLASSNAME}>
      <div className="flex w-full items-center gap-3">
        <div className="flex items-center gap-2">
          <details className="relative lg:hidden">
            <summary
              className="inline-flex h-8 w-8 list-none cursor-pointer items-center justify-center rounded-lg border border-night-700 bg-night-900/80 text-sand-100 hover:border-night-600"
              aria-label="Open mobile navigation"
            >
              <Menu size={16} />
            </summary>
            <div className="absolute left-0 mt-2 w-72 rounded-xl border border-night-700 bg-night-900/95 p-2 shadow-2xl">
              <p className="px-2 py-1 text-xs uppercase tracking-[0.2em] text-night-300">Sections</p>
              <div className="flex flex-col text-sm">
                {topbarSections.map((section) => (
                  <Link
                    key={section.id}
                    href={section.href}
                    className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800"
                  >
                    {section.label}
                  </Link>
                ))}
                <Link href="/account/profile" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                  Account
                </Link>
              </div>
            </div>
          </details>

          <TopbarBrand />
        </div>

        <div className="hidden flex-1 lg:block">
          <form className="relative max-w-md" action="/library" method="get">
            <label htmlFor="dashboard-search" className="sr-only">
              Search lessons, practices, reflections, or jump to Companion
            </label>
            <Search className="pointer-events-none absolute left-3 top-2.5 text-night-200" size={16} />
            <input
              id="dashboard-search"
              type="search"
              name="q"
              placeholder="Search lessons, practices, reflections, or jump..."
              className="w-full rounded-xl border border-night-700 bg-night-900/70 py-2 pl-9 pr-4 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none"
            />
          </form>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/journal"
            className="hidden items-center gap-2 rounded-xl border border-night-700 bg-night-900/80 px-3 py-2 text-xs text-sand-200 hover:border-night-600 lg:inline-flex"
          >
            <Plus size={14} />
            New Entry
          </Link>

          <details className="relative hidden lg:block">
            <summary
              className="inline-flex h-9 w-9 list-none cursor-pointer items-center justify-center rounded-xl border border-night-700 bg-night-900/80 text-sand-200 hover:border-night-600"
              aria-label="Notifications"
              aria-haspopup="menu"
            >
              <span className="relative inline-flex">
                <Bell size={15} />
                {notifications.unreadCount > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-sage-400 px-1 text-[10px] font-semibold text-night-950">
                    {notifications.unreadCount > 9 ? "9+" : notifications.unreadCount}
                  </span>
                ) : null}
              </span>
            </summary>
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-night-700 bg-night-900/95 p-2 shadow-2xl">
              <div className="flex items-center justify-between px-2 py-1">
                <p className="text-xs uppercase tracking-[0.2em] text-night-300">Notifications</p>
                <form action={readAllNotificationsAction}>
                  <button
                    type="submit"
                    className="rounded-md border border-night-700 px-2 py-1 text-[10px] text-sand-200 hover:border-night-500"
                  >
                    Read all
                  </button>
                </form>
              </div>
              <div className="mt-1 flex max-h-80 flex-col gap-1 overflow-y-auto text-sm">
                {notifications.items.length === 0 ? (
                  <p className="rounded-lg px-2 py-3 text-xs text-night-300">No notifications yet.</p>
                ) : (
                  notifications.items.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-lg px-2 py-2 hover:bg-night-800 ${
                        notification.readAt ? "text-night-200" : "text-sand-100"
                      }`}
                    >
                      <a href={notification.href} className="block">
                        <p className="text-xs font-semibold">{notification.title}</p>
                        <p className="mt-1 text-xs">{notification.body}</p>
                      </a>
                      {!notification.readAt ? (
                        <form action={markNotificationReadAction} className="mt-2">
                          <input type="hidden" name="id" value={notification.id} />
                          <button
                            type="submit"
                            className="rounded-md border border-night-700 px-1.5 py-1 text-[10px] text-night-200 hover:border-night-500"
                          >
                            Mark read
                          </button>
                        </form>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            </div>
          </details>

          <details className="relative hidden lg:block">
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
                <Link href="/journal" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                  Capture a reflection
                </Link>
                <Link href="/practices" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                  Start a practice
                </Link>
                <Link
                  href="/community/challenges"
                  className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800"
                >
                  Join a challenge
                </Link>
              </div>
            </div>
          </details>

          <Link
            href="/chat"
            className="hidden items-center gap-2 rounded-xl border border-sage-400/40 bg-sage-500/15 px-3 py-2 text-xs text-sage-100 hover:bg-sage-500/20 lg:inline-flex"
          >
            <Sparkles size={14} />
            Companion
          </Link>

          <details className="relative">
            <summary className="list-none cursor-pointer" aria-label="Open user menu" aria-haspopup="menu">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sage-300/50 bg-sage-500/15 text-xs font-semibold text-sage-100">
                {initials(user.name)}
              </span>
            </summary>
            <div className="absolute right-0 mt-2 w-72 rounded-xl border border-night-700 bg-night-900/95 p-2 shadow-2xl">
              <div className="px-2 py-2">
                <p className="text-sm font-medium text-sand-100">{user.name}</p>
                <p className="text-xs text-night-300">{user.email}</p>
              </div>

              <div className="my-1 border-t border-night-700" />
              <p className="px-2 py-1 text-xs uppercase tracking-[0.2em] text-night-300 lg:hidden">Actions</p>
              <div className="grid grid-cols-2 gap-2 px-2 pb-2 lg:hidden">
                <Link
                  href="/journal"
                  className="rounded-lg border border-night-700 px-2 py-1.5 text-center text-xs text-sand-200 hover:border-night-500"
                >
                  New Entry
                </Link>
                <Link
                  href="/chat"
                  className="rounded-lg border border-night-700 px-2 py-1.5 text-center text-xs text-sand-200 hover:border-night-500"
                >
                  Companion
                </Link>
                <details className="col-span-2">
                  <summary className="rounded-lg border border-night-700 px-2 py-1.5 text-center text-xs text-sand-200 hover:border-night-500">
                    Search
                  </summary>
                  <div className="fixed inset-0 z-50 bg-night-950/80 p-4">
                    <div className="mx-auto mt-16 max-w-xl rounded-2xl border border-night-700 bg-night-900 p-4 shadow-2xl">
                      <p className="text-sm font-semibold text-sand-100">Search</p>
                      <form action="/library" method="get" className="mt-3">
                        <label htmlFor="mobile-dashboard-search" className="sr-only">
                          Search lessons, practices, reflections, or jump to Companion
                        </label>
                        <input
                          id="mobile-dashboard-search"
                          type="search"
                          name="q"
                          autoFocus
                          placeholder="Search lessons, practices, reflections, or jump..."
                          className="w-full rounded-xl border border-night-700 bg-night-950 py-2 px-3 text-sm text-sand-100 placeholder:text-night-300 focus:border-sage-300 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="mt-3 w-full rounded-lg border border-sand-100 bg-sand-100 px-3 py-2 text-xs font-semibold text-night-950"
                        >
                          Search
                        </button>
                      </form>
                    </div>
                  </div>
                </details>
              </div>

              <div className="my-1 border-t border-night-700" />
              <p className="px-2 py-1 text-xs uppercase tracking-[0.2em] text-night-300">Account</p>
              <div className="flex flex-col text-sm">
                <Link
                  href="/account"
                  aria-label="Open account section"
                  className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800"
                >
                  Account
                </Link>
              </div>
              <div className="my-1 border-t border-night-700" />
              <p className="px-2 py-1 text-xs uppercase tracking-[0.2em] text-night-300">Sections</p>
              <div className="flex flex-col text-sm">
                {dropdownSections.map((section) => (
                  <Link
                    key={section.id}
                    href={section.href}
                    aria-label={`Open ${section.label.toLowerCase()} section`}
                    className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800"
                  >
                    {section.label}
                  </Link>
                ))}
              </div>
              <div className="my-1 border-t border-night-700" />
              <p className="px-2 py-1 text-xs uppercase tracking-[0.2em] text-night-300">Legal</p>
              <div className="flex flex-col text-sm">
                <Link href="/legal/privacy" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                  Privacy Policy
                </Link>
                <Link href="/legal/terms" className="rounded-lg px-2 py-2 text-sand-200 hover:bg-night-800">
                  Terms
                </Link>
              </div>

              <div className="my-1 border-t border-night-700 lg:hidden" />
              <div className="px-2 py-1 lg:hidden">
                <p className="text-xs uppercase tracking-[0.2em] text-night-300">Notifications</p>
                {notifications.items.length === 0 ? (
                  <p className="mt-1 text-xs text-night-300">No notifications yet.</p>
                ) : (
                  <div className="mt-1 max-h-36 overflow-y-auto">
                    {notifications.items.slice(0, 3).map((notification) => (
                      <a
                        key={notification.id}
                        href={notification.href}
                        className="block rounded-lg px-1 py-1.5 text-xs text-sand-200 hover:bg-night-800"
                      >
                        {notification.title}
                      </a>
                    ))}
                  </div>
                )}
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
    </header>
  );
}
