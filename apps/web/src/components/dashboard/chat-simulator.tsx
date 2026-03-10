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
import type { ChatContextTelemetry, ChatMessage, ChatThread } from "@/components/chat/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastStack, type ToastItem } from "@/components/ui/toast-stack";

const WELCOME_MESSAGE =
  "I am your reflective companion. Share one honest sentence, and we will work from there.";

const EMPTY_STATE_PROMPTS = [
  "I feel anxious and scattered. Help me settle in the next 10 minutes.",
  "Help me think clearly through a difficult decision.",
  "Guide a short evening reflection I can do tonight.",
  "I want to improve one relationship without losing myself.",
];
const PINNED_INSIGHTS_STORAGE_KEY = "areti:chat:pinned-insights";

type ChatSimulatorProps = {
  initialPrompt?: string;
  initialThreadId?: string;
};

type MessageActionType = "journal" | "branch" | "branch_ask";

type PinnedInsight = {
  id: string;
  messageId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
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

function formatSummaryTimestamp(value: string | null): string | null {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function deriveJournalTitleFromMessage(input: {
  role: "user" | "assistant";
  content: string;
}): string {
  const clean = input.content
    .replace(/\s+/g, " ")
    .replace(/["'`]/g, "")
    .trim();
  const rolePrefix = input.role === "assistant" ? "Companion note" : "Reflection note";

  if (!clean) {
    return rolePrefix;
  }

  const words = clean
    .split(" ")
    .filter(Boolean)
    .slice(0, 8)
    .join(" ");

  const title = words.charAt(0).toUpperCase() + words.slice(1);
  const joined = `${rolePrefix}: ${title}`;
  return joined.length > 80 ? `${joined.slice(0, 77).trimEnd()}...` : joined;
}

function quoteForComposer(message: ChatMessage): string {
  const lines = message.content
    .trim()
    .split(/\r?\n/)
    .map((line) => `> ${line}`);
  const source = message.role === "assistant" ? "Companion" : "You";
  return `${lines.join("\n")}\n\n${source}, help me unpack this further.`;
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
  const [manualSummarizePending, setManualSummarizePending] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageActionPending, setMessageActionPending] = useState<{
    messageId: string;
    action: MessageActionType;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileThreadsOpen, setMobileThreadsOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [composerFocusSignal, setComposerFocusSignal] = useState(0);
  const [contextNotice, setContextNotice] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pinsByThreadId, setPinsByThreadId] = useState<Record<string, PinnedInsight[]>>({});
  const [draggingPinnedInsightId, setDraggingPinnedInsightId] = useState<string | null>(null);
  const consumedPromptRef = useRef<string | null>(null);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeThreadId) ?? null,
    [threads, activeThreadId],
  );

  const activePreview = useMemo(() => deriveMessagePreview(messages), [messages]);
  const activeContext = activeThread?.context ?? null;
  const activePinnedInsights = useMemo(
    () => (activeThreadId ? pinsByThreadId[activeThreadId] ?? [] : []),
    [activeThreadId, pinsByThreadId],
  );
  const contextSummaryTimestamp = useMemo(
    () => formatSummaryTimestamp(activeContext?.lastSummarizedAt ?? null),
    [activeContext?.lastSummarizedAt],
  );
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

  function pushToast(message: string, kind: ToastItem["kind"] = "success"): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, message, kind }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 2600);
  }

  async function trackThreadEvent(input: {
    threadId: string;
    eventType: "message_quoted" | "message_pinned" | "thread_branch_auto_asked";
    messageId?: string;
  }): Promise<void> {
    try {
      await fetch(`/api/chat/threads/${input.threadId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: input.eventType,
          messageId: input.messageId,
        }),
      });
    } catch {
      // UI analytics should never block core chat actions.
    }
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

      const messageResult = await parseJsonOrThrow<{ answer: string; context?: ChatContextTelemetry }>(
        await fetch(`/api/chat/threads/${resolvedThreadId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: nextPrompt }),
        }),
      );

      if (messageResult.context) {
        setThreads((prev) =>
          prev.map((thread) =>
            thread.id === resolvedThreadId ? { ...thread, context: { ...thread.context, ...messageResult.context } } : thread,
          ),
        );
        setContextNotice(messageResult.context.notice ?? null);
      } else {
        setContextNotice(null);
      }

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

  async function summarizeContextNow(): Promise<void> {
    if (!activeThread) {
      return;
    }

    setManualSummarizePending(true);
    setError(null);

    try {
      const result = await parseJsonOrThrow<{ context: ChatContextTelemetry }>(
        await fetch(`/api/chat/threads/${activeThread.id}/context/summarize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );

      setThreads((prev) =>
        prev.map((thread) =>
          thread.id === activeThread.id ? { ...thread, context: { ...thread.context, ...result.context } } : thread,
        ),
      );
      setContextNotice(result.context.notice ?? null);
      emitChatThreadsInvalidated();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to summarize context.");
    } finally {
      setManualSummarizePending(false);
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

  async function saveMessageToJournal(message: ChatMessage): Promise<void> {
    const trimmedBody = message.content.trim();
    if (trimmedBody.length < 10) {
      setError("This message is too short to save as a journal entry.");
      pushToast("Message is too short to save.", "error");
      return;
    }

    setMessageActionPending({ messageId: message.id, action: "journal" });
    setError(null);

    const body = trimmedBody.length > 3000 ? `${trimmedBody.slice(0, 2997).trimEnd()}...` : trimmedBody;
    const title = deriveJournalTitleFromMessage({
      role: message.role,
      content: body,
    });

    try {
      await parseJsonOrThrow<{ ok: true }>(
        await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            body,
            mood: "Reflective",
          }),
        }),
      );

      setContextNotice("Saved this message to Journal.");
      pushToast("Saved to Journal.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save this message to Journal.");
      pushToast("Could not save this message to Journal.", "error");
    } finally {
      setMessageActionPending(null);
    }
  }

  function copyMessage(message: ChatMessage): void {
    pushToast(message.role === "assistant" ? "Companion message copied." : "Message copied.");
  }

  function quoteMessage(message: ChatMessage): void {
    prefillComposer(quoteForComposer(message));
    pushToast("Added quote to composer.", "info");
    if (activeThread) {
      void trackThreadEvent({
        threadId: activeThread.id,
        eventType: "message_quoted",
        messageId: message.id,
      });
    }
  }

  function pinMessage(message: ChatMessage): void {
    if (!activeThreadId) {
      return;
    }

    const existing = pinsByThreadId[activeThreadId] ?? [];
    if (existing.some((item) => item.messageId === message.id)) {
      pushToast("Already pinned as an insight.", "info");
      return;
    }

    const insight: PinnedInsight = {
      id: `pin-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      messageId: message.id,
      role: message.role,
      content: message.content.replace(/\s+/g, " ").trim().slice(0, 600),
      createdAt: new Date().toISOString(),
    };

    setPinsByThreadId((current) => ({
      ...current,
      [activeThreadId]: [insight, ...(current[activeThreadId] ?? [])].slice(0, 6),
    }));
    pushToast("Pinned as insight.");
    if (activeThread) {
      void trackThreadEvent({
        threadId: activeThread.id,
        eventType: "message_pinned",
        messageId: message.id,
      });
    }
  }

  function removePinnedInsight(insightId: string): void {
    if (!activeThreadId) {
      return;
    }

    setPinsByThreadId((current) => {
      const existing = current[activeThreadId] ?? [];
      const next = existing.filter((item) => item.id !== insightId);
      if (next.length === existing.length) {
        return current;
      }
      return {
        ...current,
        [activeThreadId]: next,
      };
    });
  }

  function clearPinnedInsights(): void {
    if (!activeThreadId) {
      return;
    }

    setPinsByThreadId((current) => {
      if (!(current[activeThreadId]?.length)) {
        return current;
      }
      return {
        ...current,
        [activeThreadId]: [],
      };
    });
    pushToast("Cleared pinned insights.", "info");
  }

  function reorderPinnedInsight(targetInsightId: string): void {
    if (!activeThreadId || !draggingPinnedInsightId || draggingPinnedInsightId === targetInsightId) {
      return;
    }

    setPinsByThreadId((current) => {
      const existing = [...(current[activeThreadId] ?? [])];
      const fromIndex = existing.findIndex((item) => item.id === draggingPinnedInsightId);
      const toIndex = existing.findIndex((item) => item.id === targetInsightId);

      if (fromIndex < 0 || toIndex < 0) {
        return current;
      }

      const [moved] = existing.splice(fromIndex, 1);
      existing.splice(toIndex, 0, moved);

      return {
        ...current,
        [activeThreadId]: existing,
      };
    });
  }

  async function branchFromMessage(
    message: ChatMessage,
    options?: { autoPrompt?: string; action?: MessageActionType },
  ): Promise<void> {
    if (!activeThread || activeThread.archived) {
      return;
    }

    if (message.threadId !== activeThread.id) {
      setError("This message does not belong to the active thread.");
      pushToast("Message does not belong to this thread.", "error");
      return;
    }

    const action = options?.action ?? "branch";
    const autoPrompt = options?.autoPrompt?.trim() ?? "";

    setMessageActionPending({ messageId: message.id, action });
    setError(null);

    try {
      const payload = await parseJsonOrThrow<{
        threadId: string;
        href: string;
        copiedMessagesCount: number;
      }>(
        await fetch(`/api/chat/threads/${activeThread.id}/branch`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId: message.id,
          }),
        }),
      );

      setThreadInUrl(payload.threadId);
      setMessages([]);
      await Promise.all([loadThreads(), loadMessages(payload.threadId)]);
      emitChatThreadsInvalidated();

      if (autoPrompt.length > 0) {
        const optimisticCreatedAt = new Date().toISOString();
        const optimisticUserMessage: ChatMessage = {
          id: `tmp-branch-user-${Date.now()}`,
          threadId: payload.threadId,
          role: "user",
          content: autoPrompt,
          createdAt: optimisticCreatedAt,
        };

        setMessages((prev) => [...prev, optimisticUserMessage]);
        emitChatThreadPreview({ threadId: payload.threadId, preview: autoPrompt });
        setPending(true);
        try {
          const messageResult = await parseJsonOrThrow<{ answer: string; context?: ChatContextTelemetry }>(
            await fetch(`/api/chat/threads/${payload.threadId}/messages`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: autoPrompt }),
            }),
          );

          if (messageResult.context) {
            setThreads((prev) =>
              prev.map((thread) =>
                thread.id === payload.threadId
                  ? { ...thread, context: { ...thread.context, ...messageResult.context } }
                  : thread,
              ),
            );
          }

          await Promise.all([loadThreads(), loadMessages(payload.threadId)]);
          emitChatThreadsInvalidated();
          setContextNotice("Started a new branch and sent your first prompt.");
          pushToast("Branch created and first prompt sent.");
          void trackThreadEvent({
            threadId: payload.threadId,
            eventType: "thread_branch_auto_asked",
          });
        } catch (caughtError) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Branch was created, but the first prompt could not be sent.",
          );
          await loadMessages(payload.threadId).catch(() => undefined);
          setContextNotice("Started a new branch, but the first prompt did not send.");
          pushToast("Branch created, but first prompt failed.", "error");
        } finally {
          setPending(false);
        }
      } else {
        setContextNotice(
          payload.copiedMessagesCount > 0
            ? `Started a new branch with ${payload.copiedMessagesCount} messages of context.`
            : "Started a new branch.",
        );
        pushToast("Branch created.");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to branch from this message.");
      pushToast("Unable to create branch from this message.", "error");
    } finally {
      setMessageActionPending(null);
    }
  }

  async function branchAndAskFromMessage(message: ChatMessage): Promise<void> {
    const suggestedPrompt =
      input.trim() ||
      "Continue from this point. Help me examine the assumptions and define one concrete next step.";
    const promptValue = window.prompt("First prompt for this branch:", suggestedPrompt);

    if (promptValue === null) {
      return;
    }

    const autoPrompt = promptValue.trim();
    if (autoPrompt.length < 3) {
      setError("Please enter at least 3 characters for the first prompt.");
      pushToast("First prompt is too short.", "error");
      return;
    }

    await branchFromMessage(message, { autoPrompt, action: "branch_ask" });
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(PINNED_INSIGHTS_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, PinnedInsight[]>;
      if (parsed && typeof parsed === "object") {
        setPinsByThreadId(parsed);
      }
    } catch {
      window.localStorage.removeItem(PINNED_INSIGHTS_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(PINNED_INSIGHTS_STORAGE_KEY, JSON.stringify(pinsByThreadId));
  }, [pinsByThreadId]);

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
      setContextNotice(null);
      setMessageActionPending(null);
      setDraggingPinnedInsightId(null);
      setMessagesLoading(false);
      return;
    }

    setMessages([]);
    setMessageActionPending(null);
    setDraggingPinnedInsightId(null);
    setContextNotice(null);
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
    <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
      <ToastStack items={toasts} />

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

                {activeThread.branch ? (
                  <p className="mt-1 text-xs text-night-300">
                    Branched from <span className="text-night-100">{activeThread.branch.sourceThreadTitle}</span>:{" "}
                    <span className="text-night-200">{activeThread.branch.sourceMessagePreview}</span>
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

      {activeThread && activeContext?.state === "degraded" ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/45 bg-rose-500/10 px-4 py-3">
          <p className="text-xs text-rose-100">
            Conversation context is near capacity. Replies may lose precision. Start a new conversation for best continuity.
          </p>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              setThreadInUrl(null);
              setMessages([]);
              setContextNotice(null);
            }}
          >
            Start new conversation
          </Button>
        </section>
      ) : null}

      {activeThread && contextNotice ? <p className="text-xs text-sage-100">{contextNotice}</p> : null}

      {activePinnedInsights.length > 0 ? (
        <section className="rounded-xl border border-night-800/75 bg-night-950/45 px-3 py-2">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.18em] text-night-300">Pinned insights</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-night-400">{activePinnedInsights.length}/6</p>
              <button
                type="button"
                onClick={clearPinnedInsights}
                className="text-[10px] text-night-300 hover:text-night-100"
              >
                Unpin all
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {activePinnedInsights.map((insight) => (
              <div
                key={insight.id}
                draggable
                onDragStart={() => setDraggingPinnedInsightId(insight.id)}
                onDragEnd={() => setDraggingPinnedInsightId(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  reorderPinnedInsight(insight.id);
                  setDraggingPinnedInsightId(null);
                }}
                className="group inline-flex max-w-[min(100%,28rem)] items-start gap-2 rounded-full border border-night-700/70 bg-night-900/70 px-3 py-1.5"
              >
                <span className="cursor-grab text-night-400" title="Drag to reorder">
                  ::
                </span>
                <button
                  type="button"
                  onClick={() => prefillComposer(insight.content)}
                  className="truncate text-left text-xs text-night-100 hover:text-sand-100"
                  title={insight.content}
                >
                  {insight.content}
                </button>
                <button
                  type="button"
                  onClick={() => removePinnedInsight(insight.id)}
                  className="text-night-400 hover:text-night-200"
                  aria-label="Remove pinned insight"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] gap-3 overflow-hidden">
        {activeThread ? (
          <ChatConversation
            messages={messages}
            pending={pending}
            loading={messagesLoading}
            onFollowUpSelect={activeThread.archived ? undefined : prefillComposer}
            onCopyMessage={copyMessage}
            onQuoteMessage={quoteMessage}
            onPinMessage={pinMessage}
            onSaveToJournal={saveMessageToJournal}
            onBranchFromMessage={activeThread.archived ? undefined : branchFromMessage}
            onBranchAndAskFromMessage={activeThread.archived ? undefined : branchAndAskFromMessage}
            messageActionPending={messageActionPending}
            className="h-full min-h-0"
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
          context={activeContext}
          contextSummaryTimestamp={contextSummaryTimestamp}
          summarizePending={manualSummarizePending}
          onChange={setInput}
          onSend={() => {
            void sendPrompt(input);
          }}
          onSummarizeContext={() => {
            void summarizeContextNow();
          }}
        />
      </div>

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
