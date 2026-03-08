"use client";

import Link from "next/link";
import { ThreadListPanel } from "@/components/chat/thread-list-panel";

export function CompanionSidenav() {
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
    </aside>
  );
}
