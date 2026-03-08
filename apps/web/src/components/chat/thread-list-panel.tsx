"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MessageSquare, Plus, Search, X } from "lucide-react";
import { CHAT_THREADS_INVALIDATE_EVENT } from "@/components/chat/events";
import { parseJsonOrThrow } from "@/components/chat/request";
import { deriveThreadTopic } from "@/components/chat/topic";
import type { ChatThread, ChatThreadScope } from "@/components/chat/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

type ThreadListPanelProps = {
  className?: string;
  showHeading?: boolean;
  onSelectThread?: (threadId: string) => void;
};

const VIRTUALIZE_THRESHOLD = 40;
const VIRTUAL_ROW_HEIGHT = 84;
const VIRTUAL_OVERSCAN = 6;

function timestampLabel(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function ThreadListPanel({
  className,
  showHeading = true,
  onSelectThread,
}: ThreadListPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeThreadId = searchParams.get("thread");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [scope, setScope] = useState<ChatThreadScope>("active");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(520);
  const listRef = useRef<HTMLDivElement | null>(null);
  const searchId = useId();

  function applyThreadToUrl(threadId: string | null): void {
    const next = new URLSearchParams(searchParams.toString());

    if (threadId) {
      next.set("thread", threadId);
    } else {
      next.delete("thread");
    }
    next.delete("prompt");

    const suffix = next.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname);
    onSelectThread?.(threadId ?? "");
  }

  async function loadThreads(nextScope: ChatThreadScope): Promise<void> {
    const loaded = await parseJsonOrThrow<ChatThread[]>(
      await fetch(`/api/chat/threads?scope=${nextScope}`, { method: "GET", cache: "no-store" }),
    );

    setThreads(loaded);
  }

  useEffect(() => {
    void loadThreads(scope).catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load chat history.");
    });
  }, [scope]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setQuery(queryInput.trim().toLowerCase());
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [queryInput]);

  useEffect(() => {
    function handleThreadInvalidation(): void {
      void loadThreads(scope).catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh history.");
      });
    }

    window.addEventListener(CHAT_THREADS_INVALIDATE_EVENT, handleThreadInvalidation);
    return () => window.removeEventListener(CHAT_THREADS_INVALIDATE_EVENT, handleThreadInvalidation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, pathname, scope, searchParams.toString()]);

  useEffect(() => {
    function syncViewportHeight(): void {
      setViewportHeight(listRef.current?.clientHeight ?? 520);
    }

    syncViewportHeight();
    window.addEventListener("resize", syncViewportHeight);
    return () => window.removeEventListener("resize", syncViewportHeight);
  }, []);

  const filteredThreads = useMemo(() => {
    if (!query) {
      return threads;
    }

    return threads.filter((thread) => thread.title.toLowerCase().includes(query));
  }, [threads, query]);

  const shouldVirtualize = filteredThreads.length >= VIRTUALIZE_THRESHOLD;
  const visibleRange = useMemo(() => {
    if (!shouldVirtualize) {
      return {
        start: 0,
        end: filteredThreads.length,
      };
    }

    const start = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
    const end = Math.min(
      filteredThreads.length,
      Math.ceil((scrollTop + viewportHeight) / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN,
    );

    return { start, end };
  }, [filteredThreads.length, scrollTop, shouldVirtualize, viewportHeight]);

  const visibleThreads = shouldVirtualize
    ? filteredThreads.slice(visibleRange.start, visibleRange.end)
    : filteredThreads;

  const topPadding = shouldVirtualize ? visibleRange.start * VIRTUAL_ROW_HEIGHT : 0;
  const bottomPadding = shouldVirtualize
    ? Math.max(0, (filteredThreads.length - visibleRange.end) * VIRTUAL_ROW_HEIGHT)
    : 0;

  return (
    <Card variant="muted" className={cn("space-y-3 p-4", className)}>
      {showHeading ? (
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-night-300">Companion</p>
          <p className="text-sm text-night-200">Threaded thinking workspace</p>
        </div>
      ) : null}

      <Button
        onClick={() => applyThreadToUrl(null)}
        size="sm"
        variant="secondary"
        aria-label="Create a new conversation thread"
        className="w-full justify-center"
      >
        <Plus size={14} />
        New thread
      </Button>

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-night-700 bg-night-950/70 p-1">
        <button
          type="button"
          onClick={() => setScope("active")}
          aria-label="Show active threads"
          className={cn(
            "rounded-lg px-2 py-1.5 text-xs",
            scope === "active"
              ? "border border-sage-300/40 bg-sage-500/15 text-sage-100"
              : "border border-transparent text-night-200 hover:border-night-600",
          )}
        >
          Active
        </button>
        <button
          type="button"
          onClick={() => setScope("archived")}
          aria-label="Show archived threads"
          className={cn(
            "rounded-lg px-2 py-1.5 text-xs",
            scope === "archived"
              ? "border border-sage-300/40 bg-sage-500/15 text-sage-100"
              : "border border-transparent text-night-200 hover:border-night-600",
          )}
        >
          Archived
        </button>
      </div>

      <label className="relative block" htmlFor={searchId}>
        <Search className="pointer-events-none absolute left-3 top-2.5 text-night-300" size={14} />
        <Input
          id={searchId}
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          className="pl-8"
          placeholder="Search threads"
        />
      </label>

      <div className="space-y-1">
        <p className="px-1 text-[10px] uppercase tracking-[0.25em] text-night-300">History</p>
        <div
          ref={listRef}
          onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
          className="max-h-[56vh] space-y-0 overflow-y-auto pr-1"
        >
          {visibleThreads.length > 0 ? (
            <>
              {topPadding > 0 ? <div style={{ height: `${topPadding}px` }} aria-hidden="true" /> : null}
              <div className="space-y-2">
                {visibleThreads.map((thread) => {
                  const isActive = activeThreadId === thread.id;
                  const topic = deriveThreadTopic(thread.title);

                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => applyThreadToUrl(thread.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "h-[76px] w-full rounded-xl border p-3 text-left transition",
                        isActive
                          ? "border-sage-300/60 bg-sage-500/10"
                          : "border-night-700/80 bg-night-950/70 hover:border-night-600",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-sm font-medium text-sand-100">{thread.title}</p>
                        <Badge variant={isActive ? "success" : "muted"}>{topic}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-night-300">{timestampLabel(thread.updatedAt)}</p>
                    </button>
                  );
                })}
              </div>
              {bottomPadding > 0 ? (
                <div style={{ height: `${bottomPadding}px` }} aria-hidden="true" />
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-night-700/80 bg-night-950/70 p-3 text-sm text-night-300">
              <p className="flex items-center gap-2 text-night-200">
                <MessageSquare size={14} />
                {threads.length > 0
                  ? "No matching conversations."
                  : scope === "active"
                    ? "No active conversation history yet."
                    : "No archived conversations yet."}
              </p>
              {queryInput ? (
                <button
                  type="button"
                  onClick={() => setQueryInput("")}
                  className="mt-2 inline-flex items-center gap-1 text-xs text-sage-200 hover:text-sage-100"
                >
                  <X size={12} />
                  Clear search
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {error ? <p className="text-xs text-amber-300">{error}</p> : null}
    </Card>
  );
}
