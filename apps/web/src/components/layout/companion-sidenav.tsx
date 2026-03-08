"use client";

import Link from "next/link";
import type { CurrentUser } from "@/lib/auth/session";
import { ThreadListPanel } from "@/components/chat/thread-list-panel";

type CompanionSidenavProps = {
  user: CurrentUser;
};

export function CompanionSidenav({ user }: CompanionSidenavProps) {
  return (
    <aside
      aria-label="Companion conversations sidebar"
      className="hidden w-80 shrink-0 border-r border-night-800/70 bg-night-950/90 p-6 lg:flex lg:flex-col lg:gap-5"
    >
      <div>
        <Link href="/chat" className="inline-block">
          <p className="text-xs uppercase tracking-[0.35em] text-sage-200/90">Companion</p>
          <h1 className="mt-2 font-title text-3xl leading-tight text-sand-100">Conversations</h1>
        </Link>
      </div>

      <ThreadListPanel className="flex-1 p-3" showHeading={false} />

      <div className="rounded-2xl border border-night-700/70 bg-night-900/70 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-night-300">Member</p>
        <p className="mt-1 text-sm font-semibold text-sand-100">{user.name}</p>
        <p className="text-xs text-night-300">{user.email}</p>
      </div>
    </aside>
  );
}
