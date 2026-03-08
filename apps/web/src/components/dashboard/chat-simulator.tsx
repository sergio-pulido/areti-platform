"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Archive, List, MoreHorizontal, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatConversation } from "@/components/chat/chat-conversation";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import {
  CHAT_THREADS_INVALIDATE_EVENT,
  emitChatThreadPreview,
  emitChatThreadsInvalidated,
} from "@/components/chat/events";
import { parseJsonOrThrow } from "@/components/chat/request";
import { ThreadListPanel } from "@/components/chat/thread-list-panel";
import type { ChatMessage, ChatThread } from "@/components/chat/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const WELCOME_MESSAGE =
  "I am your reflective companion. Share one honest sentence, and we will work from there.";

const EMPTY_STATE_PROMPTS = [
  "I feel anxious and scattered. Help me settle in the next 10 minutes.",
  "Help me think clearly through a difficult decision.",
  "Guide a short evening reflection I can do tonight.",
  "I want to improve one relationship without losing myself.",
];

type ChatSimulatorProps = {
  initialPrompt?: string;
  initialThreadId?: string;
};

function syntheticAssistantMessage(threadId: string): ChatMessage {
  return {
    id: `welcome-${threadId}`,
    threadId,
    role: "assistant",
    content: WELCOME_MESSAGE,
    createdAt: new Date().toISOString(),
  };
}

function threadDateLabel(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizePreview(content: string): string {
  return content.replace(/\s+/g, " ").trim().slice(0, 180);
}

function deriveMessagePreview(source: ChatMessage[]): string | null {
  for (let index = source.length - 1; index >= 0; index -= 1) {
    const preview = normalizePreview(source[index]?.content ?? "");
    if (preview.length > 0) {
      return preview;
    }
  }

  return null;
}

function closeThreadActionsMenu(event: MouseEvent<HTMLElement>): void {
  const details = event.currentTarget.closest("details");
  if (details instanceof HTMLDetailsElement) {
    details.open = false;
  }
}

export function ChatSimulator({ initialPrompt, initialThreadId }: ChatSimulatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeThreadId = searchParams.get("thread") ?? initialThreadId ?? null;

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [composerFocusSignal, setComposerFocusSignal] = useState(0);
  const consumedPromptRef = useRef<string | null>(null);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const activePreview = useMemo(() => deriveMessagePreview(messages), [messages]);
  const resumePrompt = useMemo(() => {
    if (!activeThread || activeThread.archived || !activePreview) {
      return null;
    }

    return `Continue our reflection from where we paused: ${activePreview}`;
  }, [activePreview, activeThread]);

  function setThreadInUrl(threadId: string | null): void {
    const next = new URLSearchParams(searchParams.toString());

    if (threadId) {
      next.set("thread", threadId);
    } else {
      next.delete("thread");
    }
    next.delete("prompt");

    const suffix = next.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname);
  }

  function prefillComposer(value: string): void {
    setInput(value);
    setComposerFocusSignal((current) => current + 1);
  }

  async function createThreadOnServer(): Promise<ChatThread> {
    return parseJsonOrThrow<ChatThread>(
      await fetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
  }

  async function loadThreads(): Promise<ChatThread[]> {
    const loaded = await parseJsonOrThrow<ChatThread[]>(
      await fetch("/api/chat/threads?scope=all", { method: "GET", cache: "no-store" }),
    );

    setThreads(loaded);

    if (activeThreadId && !loaded.some((thread) => thread.id === activeThreadId)) {
      setThreadInUrl(null);
      setMessages([]);
    }

    return loaded;
  }

  async function loadMessages(threadId: string): Promise<void> {
    setMessagesLoading(true);

    try {
      const loadedMessages = await parseJsonOrThrow<ChatMessage[]>(
        await fetch(`/api/chat/threads/${threadId}/messages`, { method: "GET", cache: "no-store" }),
      );

      const nextMessages =
        loadedMessages.length > 0 ? loadedMessages : [syntheticAssistantMessage(threadId)];

      setMessages(nextMessages);

      const preview = deriveMessagePreview(nextMessages);
      if (preview) {
        emitChatThreadPreview({ threadId, preview });
      }
    } finally {
      setMessagesLoading(false);
    }
  }

  async function sendPrompt(prompt: string): Promise<void> {
    const nextPrompt = prompt.trim();
    if (!nextPrompt || activeThread?.archived) {
      return;
    }

    setPending(true);
    setError(null);

    let threadId = activeThreadId;

    try {
      if (!threadId) {
        const created = await createThreadOnServer();
        setThreads((prev) => [created, ...prev]);
        threadId = created.id;
        setThreadInUrl(threadId);
        emitChatThreadsInvalidated();
      }

      const resolvedThreadId = threadId;
      if (!resolvedThreadId) {
        throw new Error("Unable to create thread.");
      }

      const nowIso = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        {
          id: `tmp-user-${Date.now()}`,
          threadId: resolvedThreadId,
          role: "user",
          content: nextPrompt,
          createdAt: nowIso,
        },
      ]);
      emitChatThreadPreview({ threadId: resolvedThreadId, preview: nextPrompt });
      setInput("");

      await parseJsonOrThrow<{ answer: string }>(
        await fetch(`/api/chat/threads/${resolvedThreadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: nextPrompt }),
        }),
      );

      await Promise.all([loadMessages(resolvedThreadId), loadThreads()]);
      emitChatThreadsInvalidated();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to send prompt.");
      if (threadId) {
        await loadMessages(threadId).catch(() => undefined);
      }
    } finally {
      setPending(false);
    }
  }

  async function renameActiveThread(): Promise<void> {
    if (!activeThread) {
      return;
    }

    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      setError("Thread title cannot be empty.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      await parseJsonOrThrow<{ ok: true }>(
        await fetch(`/api/chat/threads/${activeThread.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: nextTitle }),
        }),
      );

      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === activeThread.id ? { ...thread, title: nextTitle } : thread,
        ),
      );
      setRenaming(false);
      setRenameValue("");
      emitChatThreadsInvalidated();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to rename thread.");
    } finally {
      setPending(false);
    }
  }

  async function updateOrDeleteActiveThread(mode: "archive" | "restore" | "delete"): Promise<void> {
    if (!activeThread) {
      return;
    }

    setPending(true);
    setError(null);

    const nextThreadId = threads.find((thread) => thread.id !== activeThread.id)?.id ?? null;

    try {
      if (mode === "archive" || mode === "restore") {
        await parseJsonOrThrow<{ ok: true }>(
          await fetch(`/api/chat/threads/${activeThread.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ archived: mode === "archive" }),
          }),
        );
      } else {
        await parseJsonOrThrow<{ ok: true }>(
          await fetch(`/api/chat/threads/${activeThread.id}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          }),
        );
      }

      setRenaming(false);
      setRenameValue("");

      if (mode === "delete") {
        setThreadInUrl(nextThreadId);
        setMessages([]);
        await loadThreads();
        if (nextThreadId) {
          await loadMessages(nextThreadId).catch(() => undefined);
        }
      } else {
        await loadThreads();
        await loadMessages(activeThread.id).catch(() => undefined);
      }

      emitChatThreadsInvalidated();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : `Unable to ${
              mode === "archive" ? "archive" : mode === "restore" ? "restore" : "delete"
            } thread.`,
      );
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    void loadThreads().catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load threads.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      setRenaming(false);
      setRenameValue("");
      setMessagesLoading(false);
      return;
    }

    setMessages([]);
    void loadMessages(activeThreadId).catch((caughtError) => {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load messages.");
    });
  }, [activeThreadId]);

  useEffect(() => {
    function handleThreadInvalidation(): void {
      void loadThreads().catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to refresh threads.");
      });

      if (activeThreadId) {
        void loadMessages(activeThreadId).catch(() => undefined);
      }
    }

    window.addEventListener(CHAT_THREADS_INVALIDATE_EVENT, handleThreadInvalidation);
    return () => window.removeEventListener(CHAT_THREADS_INVALIDATE_EVENT, handleThreadInvalidation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeThreadId, pathname, searchParams.toString()]);

  useEffect(() => {
    if (!initialPrompt || consumedPromptRef.current === initialPrompt) {
      return;
    }

    consumedPromptRef.current = initialPrompt;
    void sendPrompt(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  const providerError = error?.includes("configured chat providers")
    ? "Companion provider is temporarily unavailable. Verify API keys/provider status and retry."
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between lg:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMobileThreadsOpen(true)}
          aria-label="Open threads"
          className="h-9"
        >
          <List size={14} />
          Threads
        </Button>

        {activeThread ? <p className="text-xs text-night-300">{threadDateLabel(activeThread.updatedAt)}</p> : null}
      </div>

      {mobileThreadsOpen ? (
        <div className="fixed inset-0 z-30 bg-night-950/90 p-3 lg:hidden">
          <div className="mx-auto flex h-full max-w-xl flex-col gap-3 rounded-[var(--radius-2xl)] border border-night-700/80 bg-night-900/95 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-sand-100">Conversations</p>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close threads"
                onClick={() => setMobileThreadsOpen(false)}
              >
                <X size={16} />
              </Button>
            </div>

            <ThreadListPanel
              className="flex-1"
              onSelectThread={() => setMobileThreadsOpen(false)}
              showHeading={false}
            />
          </div>
        </div>
      ) : null}

      {activeThread ? (
        <header className="px-1 py-1">
          {renaming ? (
            <div className="space-y-2 rounded-xl border border-night-800/70 bg-night-950/45 px-4 py-3">
              <label htmlFor="thread-rename" className="text-[10px] uppercase tracking-[0.2em] text-night-300">
                Rename thread
              </label>
              <Input
                id="thread-rename"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                maxLength={120}
                aria-label="Rename thread title"
                className="h-9"
              />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="primary" onClick={() => void renameActiveThread()} disabled={pending}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRenaming(false);
                    setRenameValue("");
                  }}
                  disabled={pending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-sand-100">{activeThread.title}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Badge variant={activeThread.archived ? "muted" : "success"}>
                    {activeThread.archived ? "Archived" : "Active"}
                  </Badge>
                  <p className="text-xs text-night-300">{threadDateLabel(activeThread.updatedAt)}</p>
                </div>

                {activePreview ? (
                  <p className="mt-2 line-clamp-2 text-xs text-night-200">
                    Last reflection: <span className="text-night-100">{activePreview}</span>
                  </p>
                ) : null}
              </div>

              <details className="relative shrink-0">
                <summary
                  className="inline-flex h-9 w-9 list-none cursor-pointer items-center justify-center rounded-lg border border-night-700/80 bg-night-900/65 text-night-200 hover:border-night-600"
                  aria-label="Open thread actions"
                  aria-haspopup="menu"
                >
                  <MoreHorizontal size={16} />
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-night-700/80 bg-night-900/95 p-1.5 shadow-2xl">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-sand-100 hover:bg-night-800"
                    onClick={(event) => {
                      closeThreadActionsMenu(event);
                      setRenaming(true);
                      setRenameValue(activeThread.title);
                    }}
                    disabled={pending}
                  >
                    <Pencil size={12} />
                    Rename
                  </button>

                  {activeThread.archived ? (
                    <button
                      type="button"
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-sand-100 hover:bg-night-800"
                      onClick={(event) => {
                        closeThreadActionsMenu(event);
                        void updateOrDeleteActiveThread("restore");
                      }}
                      disabled={pending}
                    >
                      <RotateCcw size={12} />
                      Restore
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-sand-100 hover:bg-night-800"
                      onClick={(event) => {
                        closeThreadActionsMenu(event);
                        void updateOrDeleteActiveThread("archive");
                      }}
                      disabled={pending}
                    >
                      <Archive size={12} />
                      Archive
                    </button>
                  )}

                  <button
                    type="button"
                    className="mt-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-rose-200 hover:bg-rose-500/15"
                    onClick={(event) => {
                      closeThreadActionsMenu(event);
                      void updateOrDeleteActiveThread("delete");
                    }}
                    disabled={pending}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </details>
            </div>
          )}
        </header>
      ) : null}

      {activeThread ? (
        <ChatConversation
          messages={messages}
          pending={pending}
          loading={messagesLoading}
          onFollowUpSelect={activeThread.archived ? undefined : prefillComposer}
        />
      ) : (
        <ChatEmptyState prompts={EMPTY_STATE_PROMPTS} onUsePrompt={prefillComposer} />
      )}

      <ChatComposer
        value={input}
        pending={pending}
        disabled={activeThread?.archived ?? false}
        continuePrompt={resumePrompt}
        focusSignal={composerFocusSignal}
        onChange={setInput}
        onSend={() => {
          void sendPrompt(input);
        }}
      />

      {activeThread?.archived ? (
        <p className="text-xs text-night-300">
          This thread is archived. Restore it from the actions menu to continue the conversation.
        </p>
      ) : null}

      {providerError ? <p className="text-xs text-amber-200">{providerError}</p> : null}
      {error && !providerError ? <p className="text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
