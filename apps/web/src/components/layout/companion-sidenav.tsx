"use client";

import Link from "next/link";
import { ThreadListPanel } from "@/components/chat/thread-list-panel";

export function CompanionSidenav() {
  return (
    <aside
      aria-label="Companion conversations sidebar"
      className="hidden w-[17rem] shrink-0 border-r border-night-800/70 bg-night-950/90 px-4 py-5 lg:flex lg:flex-col lg:gap-4"
    >
      <div className="px-1">
        <Link href="/chat" className="inline-block">
          <p className="text-[10px] uppercase tracking-[0.3em] text-sage-200/90">Companion</p>
          <h1 className="mt-1 font-title text-2xl leading-tight text-sand-100">Reflections</h1>
          <p className="mt-1 text-xs text-night-300">Calm, practical conversation history</p>
        </Link>
      </div>

      <ThreadListPanel className="flex-1 min-h-0" showHeading={false} />
    </aside>
  );
}
