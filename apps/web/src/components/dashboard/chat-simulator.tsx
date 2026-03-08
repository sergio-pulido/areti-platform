"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Archive, List, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChatComposer } from "@/components/chat/chat-composer";
import { ChatConversation } from "@/components/chat/chat-conversation";
import { ChatEmptyState } from "@/components/chat/chat-empty-state";
import { CHAT_THREADS_INVALIDATE_EVENT, emitChatThreadsInvalidated } from "@/components/chat/events";
import { parseJsonOrThrow } from "@/components/chat/request";
import { ThreadListPanel } from "@/components/chat/thread-list-panel";
import { deriveThreadTopic } from "@/components/chat/topic";
import type { ChatMessage, ChatThread } from "@/components/chat/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const WELCOME_MESSAGE = "I am your Socratic companion. Ask one practical question to start.";

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

export function ChatSimulator({ initialPrompt, initialThreadId }: ChatSimulatorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeThreadId = searchParams.get("thread") ?? initialThreadId ?? null;
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const consumedPromptRef = useRef<string | null>(null);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

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
    const loadedMessages = await parseJsonOrThrow<ChatMessage[]>(
      await fetch(`/api/chat/threads/${threadId}/messages`, { method: "GET", cache: "no-store" }),
    );

    setMessages(loadedMessages.length > 0 ? loadedMessages : [syntheticAssistantMessage(threadId)]);
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
      return;
    }

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
    <div className="space-y-4">
      <div className="flex items-center justify-between lg:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMobileThreadsOpen(true)}
          aria-label="Open threads"
        >
          <List size={14} />
          Threads
        </Button>
      </div>

      {mobileThreadsOpen ? (
        <div className="fixed inset-0 z-30 bg-night-950/85 p-4 lg:hidden">
          <div className="mx-auto flex h-full max-w-lg flex-col gap-3 rounded-[var(--radius-2xl)] border border-night-700 bg-night-900 p-4">
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
        <Card variant="default" className="rounded-[var(--radius-xl)] p-4">
          {renaming ? (
            <div className="space-y-2">
              <label htmlFor="thread-rename" className="text-xs uppercase tracking-[0.15em] text-night-300">
                Rename thread
              </label>
              <Input
                id="thread-rename"
                value={renameValue}
                onChange={(event) => setRenameValue(event.target.value)}
                maxLength={120}
                aria-label="Rename thread title"
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-sand-100">{activeThread.title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="muted">{threadDateLabel(activeThread.updatedAt)}</Badge>
                  <Badge variant="success">{deriveThreadTopic(activeThread.title)}</Badge>
                  <Badge variant={activeThread.archived ? "muted" : "success"}>
                    {activeThread.archived ? "Archived" : "Active"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setRenaming(true);
                    setRenameValue(activeThread.title);
                  }}
                  disabled={pending}
                >
                  <Pencil size={12} />
                  Rename
                </Button>
                {activeThread.archived ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void updateOrDeleteActiveThread("restore")}
                    disabled={pending}
                  >
                    <RotateCcw size={12} />
                    Restore
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void updateOrDeleteActiveThread("archive")}
                    disabled={pending}
                  >
                    <Archive size={12} />
                    Archive
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => void updateOrDeleteActiveThread("delete")}
                  disabled={pending}
                >
                  <Trash2 size={12} />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </Card>
      ) : null}

      {activeThread ? <ChatConversation messages={messages} pending={pending} /> : <ChatEmptyState />}

      <ChatComposer
        value={input}
        pending={pending}
        disabled={activeThread?.archived ?? false}
        onChange={setInput}
        onSend={() => {
          void sendPrompt(input);
        }}
      />

      {!activeThread ? (
        <p className="text-xs text-night-300">Your first message will create a new thread automatically.</p>
      ) : null}
      {activeThread?.archived ? (
        <p className="text-xs text-night-300">
          This thread is archived. Restore it to continue sending messages.
        </p>
      ) : null}

      {providerError ? <p className="text-xs text-amber-200">{providerError}</p> : null}
      {error && !providerError ? <p className="text-xs text-amber-300">{error}</p> : null}
    </div>
  );
}
