"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { MessageSquare, Plus, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CHAT_THREAD_PREVIEW_EVENT,
  CHAT_THREADS_INVALIDATE_EVENT,
  type ChatThreadPreviewDetail,
} from "@/components/chat/events";
import { parseJsonOrThrow } from "@/components/chat/request";
import { deriveThreadTopic } from "@/components/chat/topic";
import type { ChatMessage, ChatThread, ChatThreadScope } from "@/components/chat/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

type ThreadListPanelProps = {
  className?: string;
  showHeading?: boolean;
  onSelectThread?: (threadId: string) => void;
};

const VIRTUALIZE_THRESHOLD = 40;
const VIRTUAL_ROW_HEIGHT = 74;
const VIRTUAL_OVERSCAN = 6;
const PREVIEW_PREFETCH_LIMIT = 8;

function timestampLabel(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function normalizePreview(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 140);
}

function deriveMessagePreview(messages: ChatMessage[]): string | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const preview = normalizePreview(messages[index]?.content ?? "");
    if (preview.length > 0) {
      return preview;
    }
  }

  return null;
}

function fallbackPreview(thread: ChatThread): string {
  const topic = deriveThreadTopic(thread.title).toLowerCase();
  return `Continue ${topic}.`;
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
  const [loading, setLoading] = useState(true);
  const [previewsByThreadId, setPreviewsByThreadId] = useState<Record<string, string>>({});
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(520);
  const listRef = useRef<HTMLDivElement | null>(null);
  const requestedPreviewIdsRef = useRef<Set<string>>(new Set());
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
    setLoading(true);
    setError(null);

    try {
      const loaded = await parseJsonOrThrow<ChatThread[]>(
        await fetch(`/api/chat/threads?scope=${nextScope}`, { method: "GET", cache: "no-store" }),
      );

      setThreads(loaded);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadThreads(scope).catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load chat history.");
    });
  }, [scope]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setQuery(queryInput.trim().toLowerCase());
    }, 120);

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
    function handlePreviewUpdate(event: Event): void {
      const detail = (event as CustomEvent<ChatThreadPreviewDetail>).detail;

      if (!detail?.threadId || !detail.preview) {
        return;
      }

      setPreviewsByThreadId((prev) => ({
        ...prev,
        [detail.threadId]: normalizePreview(detail.preview),
      }));
    }

    window.addEventListener(CHAT_THREAD_PREVIEW_EVENT, handlePreviewUpdate as EventListener);
    return () =>
      window.removeEventListener(CHAT_THREAD_PREVIEW_EVENT, handlePreviewUpdate as EventListener);
  }, []);

  useEffect(() => {
    function syncViewportHeight(): void {
      setViewportHeight(listRef.current?.clientHeight ?? 520);
    }

    syncViewportHeight();
    window.addEventListener("resize", syncViewportHeight);
    return () => window.removeEventListener("resize", syncViewportHeight);
  }, []);

  useEffect(() => {
    const candidates = threads
      .slice(0, PREVIEW_PREFETCH_LIMIT)
      .filter((thread) => !previewsByThreadId[thread.id] && !requestedPreviewIdsRef.current.has(thread.id));

    if (candidates.length === 0) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      candidates.map(async (thread) => {
        requestedPreviewIdsRef.current.add(thread.id);

        try {
          const loadedMessages = await parseJsonOrThrow<ChatMessage[]>(
            await fetch(`/api/chat/threads/${thread.id}/messages`, { method: "GET", cache: "no-store" }),
          );

          const preview = deriveMessagePreview(loadedMessages);
          if (!cancelled && preview) {
            setPreviewsByThreadId((prev) => ({
              ...prev,
              [thread.id]: preview,
            }));
          }
        } catch {
          // Keep fallback preview when we cannot prefetch message snippets.
        }
      }),
    );

    return () => {
      cancelled = true;
    };
  }, [previewsByThreadId, threads]);

  const filteredThreads = useMemo(() => {
    if (!query) {
      return threads;
    }

    return threads.filter((thread) => {
      const preview = previewsByThreadId[thread.id] ?? fallbackPreview(thread);
      return `${thread.title} ${preview}`.toLowerCase().includes(query);
    });
  }, [previewsByThreadId, query, threads]);

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
    <section className={cn("flex h-full min-h-0 flex-col gap-2", className)}>
      {showHeading ? (
        <div className="space-y-0.5 px-1">
          <p className="text-[10px] uppercase tracking-[0.26em] text-night-300">Companion</p>
          <p className="text-sm text-night-200">Reflection threads</p>
        </div>
      ) : null}

      <div className="flex items-center gap-2">
        <Button
          onClick={() => applyThreadToUrl(null)}
          size="sm"
          variant="secondary"
          aria-label="Create a new conversation thread"
          className="h-9 flex-1 justify-center"
        >
          <Plus size={14} />
          New
        </Button>

        <div className="inline-flex rounded-lg border border-night-700/80 bg-night-950/80 p-0.5">
          <button
            type="button"
            onClick={() => setScope("active")}
            aria-label="Show active threads"
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] transition",
              scope === "active"
                ? "bg-sage-500/15 text-sage-100"
                : "text-night-300 hover:text-night-100",
            )}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setScope("archived")}
            aria-label="Show archived threads"
            className={cn(
              "rounded-md px-2.5 py-1 text-[11px] transition",
              scope === "archived"
                ? "bg-sage-500/15 text-sage-100"
                : "text-night-300 hover:text-night-100",
            )}
          >
            Archived
          </button>
        </div>
      </div>

      <label className="relative block" htmlFor={searchId}>
        <Search className="pointer-events-none absolute left-3 top-2.5 text-night-300" size={14} />
        <Input
          id={searchId}
          value={queryInput}
          onChange={(event) => setQueryInput(event.target.value)}
          className="h-9 pl-8"
          placeholder="Search"
        />
      </label>

      <div
        ref={listRef}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
        className="min-h-0 flex-1 space-y-0 overflow-y-auto overscroll-contain pr-1"
      >
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-1 rounded-xl border border-night-800/65 px-3 py-2.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : visibleThreads.length > 0 ? (
          <>
            {topPadding > 0 ? <div style={{ height: `${topPadding}px` }} aria-hidden="true" /> : null}

            <div className="space-y-2">
              {visibleThreads.map((thread) => {
                const isActive = activeThreadId === thread.id;
                const preview = previewsByThreadId[thread.id] ?? fallbackPreview(thread);

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => applyThreadToUrl(thread.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "h-[68px] w-full rounded-xl border px-3 py-2 text-left transition",
                      isActive
                        ? "border-sage-300/55 bg-sage-500/10"
                        : "border-night-800/65 bg-night-950/45 hover:border-night-600",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-sand-100">{thread.title}</p>
                      <p className="shrink-0 text-[11px] text-night-300">{timestampLabel(thread.updatedAt)}</p>
                    </div>
                    <p className={cn("mt-1 line-clamp-1 text-xs", isActive ? "text-sage-200/90" : "text-night-200")}>{preview}</p>
                  </button>
                );
              })}
            </div>

            {bottomPadding > 0 ? <div style={{ height: `${bottomPadding}px` }} aria-hidden="true" /> : null}
          </>
        ) : (
          <div className="rounded-xl border border-night-800/65 bg-night-950/55 p-3 text-sm text-night-300">
            <p className="flex items-center gap-2 text-night-200">
              <MessageSquare size={14} />
              {threads.length > 0
                ? "No matching conversations."
                : scope === "active"
                  ? "No active reflections yet."
                  : "No archived reflections yet."}
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

      {error ? <p className="px-1 text-xs text-amber-300">{error}</p> : null}
    </section>
  );
}
